# 조치등록 기능 설계서

**상태**: 구현 기반 설계 (2026-03-02)
**작성자**: sein
**아키텍처**: Next.js 14 + SQLite + TanStack Query v5

---

## 1. 시스템 아키텍처

### 1.1 계층 구조

```
┌─────────────────────────────────────┐
│  UI Layer (React)                   │
│  ├─ AirlineActionModal              │
│  ├─ ActionModal (조치등록 폼)        │
│  └─ ActionsTab (조치 목록)          │
└─────────────────────────────────────┘
         ↓ (useCreateAction, useUpdateAction)
┌─────────────────────────────────────┐
│  Hook Layer (TanStack Query)        │
│  ├─ useCreateAction()               │
│  ├─ useUpdateAction()               │
│  ├─ useAirlineActions()             │
│  └─ useCallsigns()                  │
└─────────────────────────────────────┘
         ↓ (POST, GET, PATCH)
┌─────────────────────────────────────┐
│  API Layer (Next.js Routes)         │
│  ├─ POST /api/airlines/:id/actions  │
│  ├─ GET  /api/airlines/:id/actions  │
│  ├─ PATCH /api/actions/:id          │
│  └─ [auth, validation, transaction] │
└─────────────────────────────────────┘
         ↓ (query, transaction)
┌─────────────────────────────────────┐
│  Data Layer (SQLite)                │
│  ├─ actions (조치 데이터)            │
│  └─ callsigns (호출부호 + 상태)     │
└─────────────────────────────────────┘
```

---

## 2. API 설계

### 2.1 POST /api/airlines/:airlineId/actions

**목적**: 호출부호에 대한 조치를 신규 등록하거나 기존 조치를 수정

**요청**:
```json
{
  "callsign_id": "string",
  "action_type": "편명 변경",
  "description": "선택사항",
  "completed_at": "2026-03-02"
}
```

**응답** (201):
```json
{
  "id": "uuid",
  "status": "completed",
  "registered_at": "2026-03-02T10:30:00Z"
}
```

### 2.2 GET /api/airlines/:airlineId/actions

**쿼리 파라미터**:
- `status`: 'in_progress' | 'completed'
- `search`: 검색어
- `page`: 페이지 번호
- `limit`: 페이지 크기

**응답** (200):
```json
{
  "data": [...],
  "pagination": { "page": 1, "limit": 10, "total": 45 }
}
```

### 2.3 PATCH /api/actions/:id

**목적**: 조치 상태 업데이트 또는 취소

**취소**: `{ status: "in_progress" }` → `is_cancelled=1`

---

## 3. 트랜잭션 설계

```typescript
transaction((trx) => {
  // 1. actions 업데이트
  trx(`UPDATE actions SET ... WHERE id = ?`, [...])

  // 2. 상태 계산 및 callsigns 업데이트
  const newCallsignStatus = calculateStatus(...)
  trx(`UPDATE callsigns SET status = ? WHERE id = ?`, [...])
})
```

**보장**: All-or-nothing (둘 다 성공 또는 둘 다 실패)

---

## 4. 완료 조건 매트릭스

| 상황 | 조치항공사 | my_action_status | other_action_status | callsigns.status |
|------|----------|-----------------|-------------------|-----------------|
| 같은 항공사 | 아무나 | completed | completed | **completed** |
| 국내-국내 첫번째 | - | completed | no_action | in_progress |
| 국내-국내 둘째 | - | completed | completed | **completed** |
| 국내-외항사 | 국내 | completed | (자동) | **completed** |
| 외항사-외항사 | 아무나 | completed | completed | **completed** |

**구현 코드**:
```typescript
if (isSameAirline) {
  newCallsignStatus = (myCompleted || otherCompleted) ? 'completed' : 'in_progress'
} else if (isForeignAirline) {
  newCallsignStatus = (myCompleted || otherCompleted) ? 'completed' : 'in_progress'
} else {
  newCallsignStatus = (myCompleted && otherCompleted) ? 'completed' : 'in_progress'
}
```

---

## 5. 데이터 모델

### 5.1 Actions 테이블

```sql
id TEXT PRIMARY KEY
airline_id TEXT NOT NULL
callsign_id TEXT NOT NULL
action_type TEXT
status TEXT DEFAULT 'in_progress'
is_cancelled INTEGER DEFAULT 0
registered_at TEXT NOT NULL
updated_at TEXT NOT NULL
```

### 5.2 Callsigns 테이블 (관련 컬럼)

```sql
my_action_status TEXT DEFAULT 'no_action'
other_action_status TEXT DEFAULT 'no_action'
status TEXT DEFAULT 'in_progress'
```

---

## 6. 컴포넌트 설계

### ActionModal

**Props**:
- `airlineId`: string
- `callsigns`: Callsign[]
- `actionId?`: string (수정 모드)
- `initialData?`: { callsignId, actionType, ... }
- `onClose`: () => void
- `onSuccess?`: () => void

**폼 필드**:
1. 유사호출부호 (읽기 전용)
2. 조치 유형 (필수)
3. 처리일자 (선택)
4. 상세내용 (선택)

---

## 7. 인증 & 인가

```typescript
// Bearer Token 검증
const payload = verifyToken(token);

// airlineId 일치 확인
if (payload.role !== 'admin' && payload.airlineId !== airlineId) {
  return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
}
```

---

## 8. 성능 최적화

**캐싱**:
- `staleTime`: 30초
- `gcTime`: 5분

**페이지네이션**:
- 기본값: limit=20
- 최대값: limit=100

---

**최종 수정**: 2026-03-02
**상태**: 설계 완료
