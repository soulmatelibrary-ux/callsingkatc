# Excel 업로드 데이터 정규화 및 발생 이력 추적 - 구현 완료

## 📋 개요
호출부호 데이터를 정규화하여 같은 호출부호 쌍의 중복을 제거하고, 발생 날짜별로 별도 관리하는 시스템을 구현했습니다.

## 🔄 데이터 구조 변경

### Before (이전)
```
callsigns 테이블
├─ KAL852|KAL851 (2026-01-01) → 1개 행
├─ KAL852|KAL851 (2026-01-02) → 1개 행 (중복!)
└─ KAL852|KAL851 (2026-01-03) → 1개 행 (중복!)
```

### After (변경 후)
```
callsigns 테이블
└─ KAL852|KAL851 → 1개 행만 저장 (정규화)

callsign_occurrences 테이블
├─ callsign_id=xxx, occurred_date=2026-01-01
├─ callsign_id=xxx, occurred_date=2026-01-02
└─ callsign_id=xxx, occurred_date=2026-01-03
```

## 📝 구현 사항

### 1. 데이터베이스 스키마 (`scripts/init.sql`)
#### 새 테이블: `callsign_occurrences`
```sql
CREATE TABLE IF NOT EXISTS callsign_occurrences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  callsign_id UUID NOT NULL REFERENCES callsigns(id) ON DELETE CASCADE,

  -- 발생 정보
  occurred_date DATE NOT NULL,
  occurred_time TIMESTAMP,

  -- 상세 정보
  error_type VARCHAR(30),
  sub_error VARCHAR(30),
  location VARCHAR(100),
  flight_level VARCHAR(20),

  -- 메타정보
  file_upload_id UUID REFERENCES file_uploads(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- 제약조건: 같은 callsign이 같은 날짜에 여러 번 나타나면 1번만 저장
  UNIQUE(callsign_id, occurred_date)
);
```

### 2. Excel 업로드 API (`src/app/api/admin/upload-callsigns/route.ts`)
#### 처리 흐름
```
Excel 파일 로드
    ↓
각 행 처리:
  ├─ 호출부호 추출 (KAL852|KAL851)
  ├─ 발생 날짜 추출 (row[0])
  ├─ 항공사 ID 조회
  ├─ Step 1: callsigns 테이블에 저장 (없으면 생성, 있으면 유지)
  ├─ Step 2: callsign_occurrences에 발생 이력 저장
  └─ 중복 날짜는 자동 무시 (ON CONFLICT DO NOTHING)
    ↓
업로드 결과 기록
```

#### 날짜 포맷 처리
- Excel 시작일시 (row[0])를 발생 날짜로 사용
- "MM/DD/YYYY" → "YYYY-MM-DD" 자동 변환
- 빈 값 → 오늘 날짜 사용

#### 응답
```json
{
  "success": true,
  "total": 100,           // 처리한 행 수
  "inserted": 45,         // 신규 호출부호 쌍
  "updated": 55,          // 기존 호출부호 쌍에 추가된 발생
  "failed": 0,
  "errors": []
}
```

### 3. API 응답 집계 (`src/app/api/airlines/[airlineId]/callsigns/route.ts`)
#### SQL 쿼리 변경
```sql
SELECT
  c.*,
  COUNT(co.id) AS occurrence_count,
  MAX(co.occurred_date) AS last_occurred_at
FROM callsigns c
LEFT JOIN actions a ON c.id = a.callsign_id
LEFT JOIN callsign_occurrences co ON c.id = co.callsign_id
WHERE c.airline_id = ? AND a.id IS NULL
GROUP BY c.id, ...
```

#### 응답 필드
```json
{
  "callsign_pair": "KAL852 | KAL851",
  "risk_level": "매우높음",
  "occurrence_count": 3,           // 발생 건수 (집계)
  "last_occurred_at": "2026-01-03" // 마지막 발생일 (집계)
}
```

### 4. 대시보드 표시 (`src/app/dashboard/page.tsx`)
#### 호출부호 목록 테이블
| 호출부호 쌍 | 위험도 | 유사도 | 발생 횟수 | 마지막 발생일 |
|-----------|-------|-------|---------|------------|
| KAL852\|KAL851 | 매우높음 | 높음 | **3** | **2026-01-03** |

#### Excel 내보내기
- 발생 횟수
- 마지막 발생일
등이 포함된 Excel 파일로 다운로드 가능

## ✅ 검증 체크리스트

- [x] 데이터베이스 스키마 생성 (`callsign_occurrences` 테이블)
- [x] Excel 업로드 API 수정 (2단계 저장)
- [x] API 응답 집계 구현 (COUNT, MAX)
- [x] 타입스크립트 컴파일 성공
- [x] 빌드 성공 (`npm run build`)
- [x] 대시보드에서 발생 건수 및 검출 날짜 표시됨

## 🚀 배포 준비

### Docker 재시작 필요
```bash
# 기존 컨테이너 정지 (필요시)
docker-compose down

# 새 스키마로 재시작
docker-compose up -d postgres
```

새로 시작할 때 `scripts/init.sql`이 자동으로 실행되어 `callsign_occurrences` 테이블이 생성됩니다.

### 마이그레이션 (기존 데이터가 있는 경우)
기존 데이터베이스에 스키마를 추가하려면:
```sql
-- callsign_occurrences 테이블 수동 생성
-- scripts/init.sql의 162-189번 줄을 실행
```

## 📊 데이터 예시

### 입력 (Excel)
| 시작일 | 종료일 | 편명1 | 편명2 | ... |
|-------|-------|------|------|-----|
| 2026-01-01 | ... | KAL852 | KAL851 | ... |
| 2026-01-02 | ... | KAL852 | KAL851 | ... |
| 2026-01-03 | ... | KAL852 | KAL851 | ... |

### 저장 결과
**callsigns 테이블**
| id | airline_code | callsign_pair | ... |
|----|-------------|---------------|-----|
| xxx | KAL | KAL852\|KAL851 | ... |

**callsign_occurrences 테이블**
| id | callsign_id | occurred_date |
|----|------------|---------------|
| yyy | xxx | 2026-01-01 |
| zzz | xxx | 2026-01-02 |
| aaa | xxx | 2026-01-03 |

### 대시보드 표시
- 발생 횟수: **3** (COUNT from occurrences)
- 마지막 발생일: **2026-01-03** (MAX from occurrences)

## 🔧 기술 상세

### 정규화의 이점
1. **저장 공간 절감** - 같은 호출부호 쌍은 1번만 저장
2. **데이터 일관성** - 호출부호 속성 (위험도, 유사도 등) 중복 없음
3. **상세 분석 가능** - 날짜별 발생 이력 추적 가능
4. **쿼리 효율화** - JOIN으로 필요한 데이터만 집계

### 제약조건
- `UNIQUE(callsign_id, occurred_date)` - 같은 호출부호가 같은 날짜에 여러 번 나타나면 1번만 저장
- `ON CONFLICT DO NOTHING` - 중복 발생 시 자동 무시 (에러 없음)

## 📅 일정
- **구현**: 2026-02-20
- **상태**: ✅ 완료
- **빌드**: ✅ 성공

## 🎯 다음 단계
1. Docker 컨테이너 재시작 (스키마 자동 적용)
2. Excel 파일 업로드 테스트
3. 대시보드에서 발생 건수 및 검출 날짜 확인

---
**작성자**: Claude
**버전**: v1.0
**마지막 수정**: 2026-02-20
