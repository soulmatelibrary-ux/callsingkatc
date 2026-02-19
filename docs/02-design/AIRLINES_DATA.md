# KATC1 인증 시스템 - 항공사 데이터 명세

**프로젝트**: KATC1 유사호출부호 경고시스템
**주제**: 시스템 사용 항공사 목록 및 데이터
**버전**: 1.0.0
**작성일**: 2026-02-19

---

## 1. 항공사 목록 (총 11개)

### 1.1 항공사 데이터 테이블

| 순번 | 항공사명 (한글) | 항공사명 (영문) | ICAO 코드 | IATA 코드 | 상태 |
|------|--------------|--------------|----------|----------|------|
| 1 | 대한항공 | Korean Air | KAL | KE | 운영 중 |
| 2 | 아시아나항공 | Asiana Airlines | AAR | OZ | 운영 중 |
| 3 | 제주항공 | Jeju Air | JJA | 7C | 운영 중 |
| 4 | 진에어 | Jin Air | JNA | LJ | 운영 중 |
| 5 | 티웨이항공 | T'way Air | TWB | TW | 운영 중 |
| 6 | 에어부산 | Air Busan | ABL | BX | 운영 중 |
| 7 | 에어서울 | Air Seoul | ASV | RS | 운영 중 |
| 8 | 이스타항공 | Eastar Jet | ESR | ZE | 운영 중 |
| 9 | 플라이강원 | Fly Gangwon | FGW | 4V | 운영 중 |
| 10 | 에어로케이항공 | Air Korea | ARK | RF | 운영 중 |
| 11 | 에어프레미아 | Air Premia | APZ | YP | 운영 중 |

---

## 2. 데이터베이스 항공사 테이블 초기 데이터

### 2.1 SQL INSERT 스크립트

```sql
-- Airlines 테이블 초기 데이터 (11개 국내 항공사)
INSERT INTO airlines (code, name_ko, name_en, icao_code, iata_code, created_at) VALUES
('KAL', '대한항공', 'Korean Air', 'KAL', 'KE', NOW()),
('AAR', '아시아나항공', 'Asiana Airlines', 'AAR', 'OZ', NOW()),
('JJA', '제주항공', 'Jeju Air', 'JJA', '7C', NOW()),
('JNA', '진에어', 'Jin Air', 'JNA', 'LJ', NOW()),
('TWB', '티웨이항공', 'T''way Air', 'TWB', 'TW', NOW()),
('ABL', '에어부산', 'Air Busan', 'ABL', 'BX', NOW()),
('ASV', '에어서울', 'Air Seoul', 'ASV', 'RS', NOW()),
('ESR', '이스타항공', 'Eastar Jet', 'ESR', 'ZE', NOW()),
('FGW', '플라이강원', 'Fly Gangwon', 'FGW', '4V', NOW()),
('ARK', '에어로케이항공', 'Air Korea', 'ARK', 'RF', NOW()),
('APZ', '에어프레미아', 'Air Premia', 'APZ', 'YP', NOW());
```

### 2.2 Airlines 테이블 스키마

```sql
CREATE TABLE airlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) UNIQUE NOT NULL,      -- ICAO 코드 (KAL, AAR, TWB 등)
  name_ko VARCHAR(100) NOT NULL,         -- 한글 항공사명
  name_en VARCHAR(100),                  -- 영문 항공사명
  icao_code VARCHAR(3),                  -- ICAO 3자리 코드
  iata_code VARCHAR(2),                  -- IATA 2자리 코드
  logo_url VARCHAR(255),                 -- 로고 이미지 URL (향후)
  website_url VARCHAR(255),              -- 항공사 웹사이트 URL (향후)
  is_active BOOLEAN DEFAULT true,        -- 활성 여부
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_airlines_code ON airlines(code);
CREATE INDEX idx_airlines_name_ko ON airlines(name_ko);
CREATE INDEX idx_airlines_is_active ON airlines(is_active);
```

---

## 3. 드롭다운 선택 옵션 (UI)

### 3.1 사용자 선택 드롭다운

```typescript
// React Select Options 형식
const airlineOptions = [
  { value: 'KAL', label: '대한항공 (Korean Air)', code: 'KAL' },
  { value: 'AAR', label: '아시아나항공 (Asiana Airlines)', code: 'AAR' },
  { value: 'JJA', label: '제주항공 (Jeju Air)', code: 'JJA' },
  { value: 'JNA', label: '진에어 (Jin Air)', code: 'JNA' },
  { value: 'TWB', label: '티웨이항공 (T\'way Air)', code: 'TWB' },
  { value: 'ABL', label: '에어부산 (Air Busan)', code: 'ABL' },
  { value: 'ASV', label: '에어서울 (Air Seoul)', code: 'ASV' },
  { value: 'ESR', label: '이스타항공 (Eastar Jet)', code: 'ESR' },
  { value: 'FGW', label: '플라이강원 (Fly Gangwon)', code: 'FGW' },
  { value: 'ARK', label: '에어로케이항공 (Air Korea)', code: 'ARK' },
  { value: 'APZ', label: '에어프레미아 (Air Premia)', code: 'APZ' },
];
```

### 3.2 관리자 항공사 선택

**관리자 페이지 (/admin/users/bulk-register)**:
- 드롭다운 또는 라디오 버튼으로 항공사 선택
- 11개 항공사 모두 선택 가능
- 일괄 등록 시 선택한 항공사로 모든 사용자 할당

---

## 4. 항공사별 데이터 격리

### 4.1 API 필터링 로직

```typescript
// 예: 사용자 항공사 필터링
const user = {
  id: 'uuid-xxx',
  email: 'kim@kal.com',
  airline_id: 'airline-uuid-kal',
  airline_code: 'KAL'
};

// GET /api/callsign-warnings?airline_id={airline_id}
// 쿼리:
// SELECT * FROM callsign_warnings
// WHERE airline_id = 'airline-uuid-kal'
// 또는
// SELECT * FROM callsign_warnings
// WHERE airline_code = 'KAL'

// 결과: airline_code='KAL'인 경고만 반환
```

### 4.2 각 항공사별 사용 시나리오

#### KAL (대한항공)
- 국내 최대 항공사
- 사용자: 가장 많을 것으로 예상
- 데이터: 대한항공 관련 유사호출부호 경고만 조회

#### AAR (아시아나항공)
- 국내 2대 항공사
- 사용자: 많음
- 데이터: 아시아나항공 관련 경고만 조회

#### JJA (제주항공)
- 저비용 항공사 (LCC)
- 사용자: 중간 규모
- 데이터: 제주항공 관련 경고만 조회

#### TWB (티웨이항공)
- 저비용 항공사 (LCC)
- 사용자: 중간 규모
- 데이터: 티웨이항공 관련 경고만 조회

#### 기타 중소 항공사 (JNA, ABL, ASV, ESR, FGW, ARK, APZ)
- 각각의 독립적인 데이터 격리
- 사용자: 소규모에서 중간 규모
- 데이터: 각 항공사 관련 경고만 조회

---

## 5. 항공사 관리 (향후)

### 5.1 관리자 항공사 관리 페이지 (/admin/settings)

**기능**:
- 항공사 목록 조회
- 항공사 추가/수정/삭제 (향후)
- 로고 업로드 (향후)
- 웹사이트 URL 등록 (향후)
- 항공사 활성화/비활성화 (향후)

**현재 상태**:
- 11개 항공사는 기본 데이터로 생성
- 편집 기능은 향후 추가 예정

### 5.2 항공사 추가 절차 (향후)

1. 관리자: /admin/settings에서 [항공사 추가] 클릭
2. 폼 입력:
   - 항공사 코드 (ICAO 3자리)
   - 한글 항공사명
   - 영문 항공사명
   - IATA 코드 (2자리)
   - 로고 URL
   - 웹사이트 URL
3. [저장] 클릭
4. 새 항공사 추가 완료
5. 해당 항공사 사용자 등록 가능

---

## 6. 테스트 데이터

### 6.1 테스트 사용자 (각 항공사별)

```sql
-- 각 항공사별 테스트 사용자 생성
INSERT INTO users (email, password_hash, airline_id, status, role, is_default_password, password_change_required, created_at) VALUES
('test.kal@kal.com', bcrypt_hash('TempPass@2026'), (SELECT id FROM airlines WHERE code='KAL'), 'active', 'user', false, false, NOW()),
('test.aar@aar.com', bcrypt_hash('TempPass@2026'), (SELECT id FROM airlines WHERE code='AAR'), 'active', 'user', false, false, NOW()),
('test.jja@jja.com', bcrypt_hash('TempPass@2026'), (SELECT id FROM airlines WHERE code='JJA'), 'active', 'user', false, false, NOW()),
...
```

### 6.2 테스트 시나리오

| 시나리오 | 항공사 | 테스트 계정 | 예상 결과 |
|--------|--------|----------|----------|
| KAL 사용자 로그인 | KAL | test.kal@kal.com | KAL 경고만 조회 |
| AAR 사용자 로그인 | AAR | test.aar@aar.com | AAR 경고만 조회 |
| 관리자 로그인 | admin | admin@katc.com | 모든 항공사 경고 조회 가능 |
| 크로스 항공사 접근 | KAL 사용자 → AAR 데이터 | 불가능 | 403 Forbidden 에러 |

---

## 7. 항공사 데이터 검증

### 7.1 드롭다운 검증

```typescript
// 비로그인 상태 사용자는 항공사 선택 불가
if (!user) {
  return <div>로그인 후 항공사를 선택할 수 있습니다.</div>;
}

// 사용자 항공사는 변경 불가 (읽기 전용)
<select disabled value={user.airline_code}>
  {airlineOptions.map(opt => (
    <option key={opt.value} value={opt.value}>{opt.label}</option>
  ))}
</select>
```

### 7.2 API 검증

```typescript
// 요청 시 사용자 항공사와 일치하는지 검증
const validateAirlineAccess = (user, requestedAirlineId) => {
  if (user.airline_id !== requestedAirlineId) {
    throw new Error('해당 항공사 데이터에 접근 권한이 없습니다.');
  }
};

// 응답 필터링
const getCallsignWarnings = async (user) => {
  const warnings = await db.query(
    'SELECT * FROM callsign_warnings WHERE airline_id = $1',
    [user.airline_id]
  );
  return warnings;
};
```

---

## 8. 향후 확장 계획

### 8.1 Phase 2: 항공사 로고 및 정보

- 항공사 로고 추가 (로고_url)
- 항공사 웹사이트 링크 (website_url)
- 항공사 소개 페이지

### 8.2 Phase 3: 항공사 관리 기능

- 관리자 항공사 관리 페이지
- 새 항공사 추가/삭제
- 항공사 활성화/비활성화
- 항공사별 사용자 통계

### 8.3 Phase 4: 항공사 간 협력

- 다중 항공사 권한 (관리자)
- 항공사 간 데이터 공유 정책
- 항공사 간 메시지 시스템

---

## 9. 항공사별 특수 고려사항

### 9.1 대한항공 (KAL)
- 가장 많은 사용자 예상
- 피크 시간대 트래픽 관리 필요
- 고가용성 보장

### 9.2 저비용 항공사 (JJA, TWB, JNA 등)
- 성장하는 사용자 수
- 확장성 고려

### 9.3 중소 항공사 (FGW, ARK, APZ 등)
- 소규모 사용자 기반
- 맞춤형 지원 가능

---

## 10. 마이그레이션 계획 (향후)

### 10.1 새 항공사 추가 시

1. 데이터베이스 INSERT
2. 드롭다운 옵션 업데이트
3. 관리자 알림
4. 해당 항공사에 사용자 등록 개시

### 10.2 항공사 통합 시 (예: 인수합병)

1. 기존 항공사 is_active = false
2. 새 항공사 is_active = true
3. 사용자 데이터 마이그레이션
4. 레거시 데이터 보관

---

**상태**: ✅ 항공사 데이터 명세 완료
**다음 단계**: 항공사 드롭다운 컴포넌트 구현 → 데이터베이스 마이그레이션 → 테스트

