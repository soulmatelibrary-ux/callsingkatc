# 조치등록 기능 계획서

**상태**: 구현 완료 (2026-03-02)
**작성자**: sein
**레벨**: Dynamic (Next.js + SQLite + TanStack Query)

---

## 1. 기능 개요

### 목적
항공사 운영진이 유사호출부호 발생 시 취한 조치를 시스템에 등록하고, 관리하며, 결과를 추적하기 위한 기능

### 핵심 요구사항
- 호출부호별 조치 등록 (Action 생성)
- 조치 상태 추적 (진행중 → 완료)
- 조치 취소 및 재조치 (is_cancelled 플래그 사용)
- 국내/외항사 구분에 따른 자동완료 로직
- 항공사별 조치 이력 조회

---

## 2. 범위 (Scope)

### 포함 기능
✅ 조치 신규 등록 (POST)
✅ 조치 목록 조회 + 필터 + 페이지네이션 (GET)
✅ 조치 편집 (PATCH)
✅ 조치 상태 업데이트
✅ 조치 취소 (is_cancelled=1)
✅ 가상 항목 표시 (조치 미등록 호출부호)

### 제외 기능
❌ 조치 이력 저장 (action_history 테이블 활용하지 않음)
❌ 조치 삭제 (물리 삭제 아님, 취소로 처리)
❌ 벌크 조치 등록

---

## 3. 비즈니스 로직

### 3.1 조치 등록 흐름

```
사용자가 ActionModal 제출
  ↓
POST /api/airlines/:airlineId/actions
  ↓
[인증/인가 검증] ← Bearer Token + airlineId 확인
  ↓
[기존 action 조회] ← airline_id + callsign_id로 검색
  ├─ 있으면: 기존 ID 사용 (UPDATE)
  └─ 없으면: 신규 INSERT
  ↓
[Transaction 시작]
  ├─ actions 테이블 UPDATE/INSERT
  │  └─ status='completed' (신규 등록 = 완료 상태)
  └─ callsigns 테이블 UPDATE
     └─ 완료 조건 매트릭스에 따라 status 계산
  ↓
[응답] ← 생성/수정된 action 반환 (상태: 201/200)
```

### 3.2 완료 조건 매트릭스

| 상황 | 조치 항공사 | my_action_status | other_action_status | callsigns.status |
|------|-----------|------------------|-------------------|-----------------|
| **같은 항공사** | 아무나 | completed | completed | **completed** |
| **국내-국내** | 첫번째 | completed | no_action | in_progress |
| **국내-국내** | 둘째 | completed | completed | **completed** |
| **국내-외항사** | 국내 | completed | (자동완료) | **completed** |
| **외항사-외항사** | 아무나 | completed | completed | **completed** |

**규칙:**
- 같은 항공사: 한쪽만 완료 → 양쪽 모두 completed
- 국내-국내: 양쪽 모두 완료해야 completed
- 국내-외항사: 국내만 완료하면 completed (외항사 자동완료)
- 외항사-외항사: 한쪽만 완료 → completed

### 3.3 국내/외항사 판별

**국내항공사 목록** (ICAO 3글자 코드):
```
KAL, AAR, JJA, JNA, TWB, ABL, ASV, EOK, FGW, APZ, ESR
```

그 외 모든 항공사 코드는 **외항사**로 처리

### 3.4 조치 취소 & 재조치

**취소 (PATCH):**
```
PATCH /api/actions/:id
{ status: 'in_progress' }

결과:
- actions.is_cancelled = 1
- actions.status = 'in_progress'
- callsigns.status = 'in_progress'
- 조치목록에서 필터: WHERE COALESCE(is_cancelled, 0) = 0
```

**재조치:**
```
POST /api/airlines/:airlineId/actions (기존과 동일)

결과:
- 기존 행 UPDATE (is_cancelled=0으로 복원)
- 상태를 다시 계산
- 새 행 생성하지 않음 (이력 보존하지 않음)
```

---

## 4. 데이터 구조

### 4.1 actions 테이블

```sql
CREATE TABLE actions (
  id TEXT PRIMARY KEY,                    -- UUID (hex 형식)
  airline_id TEXT NOT NULL,               -- 조치 항공사
  callsign_id TEXT NOT NULL,              -- 호출부호
  action_type TEXT,                       -- "편명 변경", "브리핑 시행" 등
  description TEXT,                       -- 상세 내용
  manager_name TEXT,                      -- 담당자명 (자동 생성)
  planned_due_date TEXT,                  -- 계획된 완료일
  completed_at TEXT,                      -- 실제 완료일
  status TEXT DEFAULT 'in_progress',      -- 'pending', 'in_progress', 'completed'
  is_cancelled INTEGER DEFAULT 0,         -- 취소 플래그
  registered_by TEXT,                     -- 등록자
  registered_at TEXT NOT NULL,            -- 등록일시
  updated_at TEXT NOT NULL                -- 수정일시
);
```

### 4.2 callsigns 테이블 (관련 컬럼)

```sql
-- 항공사별 상태 (독립적으로 관리)
my_action_status TEXT DEFAULT 'no_action',       -- 자사 조치 상태
other_action_status TEXT DEFAULT 'no_action',    -- 상대 항공사 조치 상태

-- 최종 상태
status TEXT DEFAULT 'in_progress'                -- 'in_progress', 'completed'
```

---

## 5. API 명세

### 5.1 조치 등록

**Endpoint**: `POST /api/airlines/{airlineId}/actions`

**Request**:
```json
{
  "callsign_id": "uuid",
  "action_type": "편명 변경",
  "description": "상세 내용",
  "planned_due_date": "2026-03-15",
  "completed_at": "2026-03-02"
}
```

**Response (201)**:
```json
{
  "id": "uuid",
  "airline_id": "uuid",
  "callsign_id": "uuid",
  "action_type": "편명 변경",
  "status": "completed",
  "registered_at": "2026-03-02T10:30:00Z"
}
```

### 5.2 조치 목록 조회

**Endpoint**: `GET /api/airlines/{airlineId}/actions?status=...&search=...&page=1&limit=10`

**Response**:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  }
}
```

**가상 항목**: 조치 미등록 호출부호도 포함 (`is_virtual: true`)

### 5.3 조치 취소

**Endpoint**: `PATCH /api/actions/{id}`

**Request**:
```json
{
  "status": "in_progress",
  "action_type": "편명 변경",
  "completed_at": "2026-03-02"
}
```

---

## 6. UI/UX 흐름

### 6.1 항공사 페이지 - "조치 등록" 버튼

```
IncidentsTab
  ├─ 호출부호 목록 표시
  └─ 각 행에 [조치 등록] 버튼
      ↓
      ActionModal (생성 모드)
      ├─ 유사호출부호 (읽기 전용)
      ├─ 조치 유형 (선택)
      ├─ 처리일자 (입력)
      ├─ 상세내용 (입력)
      └─ [저장] 버튼
          ↓
          API 호출 + 캐시 무효화
```

### 6.2 항공사 페이지 - "검출이력" 탭

```
ActionsTab
  ├─ 조치 목록 (페이지네이션)
  ├─ 필터: status, 검색어, 날짜 범위
  └─ 각 행에 [편집] 버튼
      ↓
      ActionModal (수정 모드)
      └─ [상태] 드롭다운 (in_progress/completed)
```

---

## 7. 성공 기준

✅ **기능적 기준**
- 호출부호별 조치 등록 성공
- 완료 조건 매트릭스의 4가지 시나리오 모두 정상 작동
- 조치 취소 후 재조치 가능
- 국내/외항사 자동판별 정상

✅ **성능 기준**
- 조치 등록 응답 시간 < 500ms
- 조치 목록 조회 (100개) < 300ms
- 캐시 무효화 후 자동 갱신 < 1초

✅ **사용성 기준**
- 모든 에러에 친화적 메시지 표시
- 조치 등록 폼 검증 (필수 필드 확인)
- 중복 제출 방지 (로딩 상태)

---

## 8. 제약사항 & 주의사항

⚠️ **알려진 제약**
1. action_history 테이블은 미사용 (향후 활용 검토 필요)
2. 조치 이력이 기록되지 않음 (같은 행에서 UPDATE만 발생)
3. 실제 완료일(completed_at)과 등록일(registered_at) 구분 필요

⚠️ **보안**
- 모든 POST/PATCH는 Bearer Token 검증 필수
- airlineId 일치 검증 (자사만 조치 등록 가능)
- 관리자는 모든 항공사 조치 조회 가능

---

## 9. 향후 개선 (Backlog)

- [ ] action_history에 변경 이력 자동 기록
- [ ] 조치 취소 사유 필드 추가
- [ ] 조치 처리 시간 자동 계산 (등록일 → 완료일)
- [ ] 조치 통계 대시보드 (유형별, 항공사별)
- [ ] 조치 알림 (오래된 진행중 항목)

---

**최종 수정**: 2026-03-02
**상태**: 구현 완료, 문서화 진행 중
