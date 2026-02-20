# Plan: 항공사 데이터 및 조치 관리 시스템 (Phase 3)

**Feature**: airline-data-action-management
**Level**: Dynamic (fullstack BaaS + Next.js)
**Date**: 2026-02-20
**Status**: Planning
**Based On**: 기존 구현 코드 분석 (Phase 1-2)

---

## 📋 Executive Summary

KATC1 항공사 유사호출부호 경고시스템의 Phase 3입니다.
현재 구현된 인증 시스템(Phase 1)과 항공사 관리(Phase 2)를 기반으로,
**유사호출부호 데이터 관리** 및 **조치(Action) 이력 관리** 기능을 추가합니다.

- **핵심 목표**: 항공사별 유사호출부호 데이터 + 조치 이력 중앙집중식 관리
- **주요 기능**: callsign.xlsx 엑셀 업로드, 조치 등록/추적, 관리자 통합 대시보드
- **예상 기간**: 2-3일 (2-3 iterations)

---

## 🎯 목표 (Objectives)

### Primary Objectives

1. **유사호출부호 데이터 관리**
   - callsign.xlsx 파일 기반 호출부호 데이터 DB 저장
   - 항공사별 필터링 (자신의 항공사만 조회)
   - 관리자: 전체 항공사 호출부호 조회/관리

2. **조치(Action) 이력 관리**
   - 각 항공사 사용자가 유사호출부호별 조치 내용 등록
   - 조치 상태 추적 (pending → in_progress → completed)
   - 조치 결과 기록 (담당자, 예정일, 완료일 등)

3. **관리자 통합 관리**
   - 모든 항공사의 조치 이력 조회 + 필터링
   - 조치 현황 대시보드 (통계, 차트)
   - 조치 이력 엑셀 다운로드 (필터 적용)

---

## 📊 범위 (Scope)

### In Scope ✅

**데이터 레벨**:
- callsigns 테이블: 유사호출부호 쌍 저장
- actions 테이블: 조치 이력 저장
- action_history 테이블: 변경 이력 추적 (선택사항)
- file_uploads 테이블: 엑셀 업로드 이력

**API 레벨** (Next.js API Routes):
- `GET /api/airline/callsigns` - 항공사별 호출부호 조회
- `GET /api/airline/actions` - 항공사별 조치 목록
- `POST /api/airline/actions` - 조치 등록
- `PATCH /api/airline/actions/{id}` - 조치 상태 수정
- `GET /api/admin/callsigns` - 관리자용 호출부호 전체 조회
- `POST /api/admin/callsigns/upload` - 엑셀 파일 업로드
- `GET /api/admin/callsigns/upload-history` - 업로드 이력 조회
- `GET /api/admin/actions` - 전체 조치 이력 조회 (필터)
- `GET /api/admin/actions/export` - 엑셀 다운로드
- `GET /api/admin/statistics` - 조치 통계

**훅 레벨** (React Query v5):
- `useAirlineCallsigns()` - 항공사별 호출부호 조회
- `useActions()` - 항공사별 조치 목록
- `useCreateAction()` - 조치 등록
- `useUpdateAction()` - 조치 수정
- `useFileUpload()` - 엑셀 업로드
- `useAdminActions()` - 관리자용 조치 조회 (필터, 페이지네이션)
- `useExportActions()` - 엑셀 다운로드
- `useAdminStatistics()` - 조치 통계

**UI 레벨** (Next.js Pages + React Components):
- `/airline` 페이지 강화
  - "호출부호" 탭: 항공사의 유사호출부호 목록
  - "조치이력" 탭: 조치 기록 + 등록 모달
- `/admin/actions` 페이지 신규
  - 조치 대시보드 (통계, 차트)
  - 조치 이력 테이블 (필터, 검색)
  - 엑셀 다운로드 버튼

**권한 설계** (Bearer Token + role 검증):
- 항공사 사용자: 자신의 호출부호/조치만 조회/등록
- 관리자: 전체 항공사 호출부호/조치 조회/관리

### Out of Scope ❌

- 자동 조치 제안 (AI)
- 조치 효과 분석
- 실시간 알림 / 웹훅
- 워크플로우 승인 (선택사항)

---

## 💾 데이터 설계 (Database Schema)

### 1. callsigns 테이블 (PostgreSQL)

```sql
CREATE TABLE callsigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  airline_id UUID NOT NULL REFERENCES airlines(id),
  airline_code VARCHAR(10) NOT NULL,

  -- 호출부호 쌍
  callsign_pair VARCHAR(50) NOT NULL,        -- "KAL852 | KAL851"
  my_callsign VARCHAR(20) NOT NULL,          -- "KAL852"
  other_callsign VARCHAR(20) NOT NULL,       -- "KAL851"
  other_airline_code VARCHAR(10),            -- "AAR", "JJA" 등

  -- 위험 정보
  error_type VARCHAR(30),                    -- "관제사 오류", "조종사 오류", "오류 미발생"
  sub_error VARCHAR(30),                     -- "복창오류", "무응답/재호출" 등
  risk_level VARCHAR(20),                    -- "매우높음", "높음", "낮음"
  similarity VARCHAR(20),                    -- "매우높음", "높음", "낮음"

  -- 발생 통계
  occurrence_count INT DEFAULT 0,            -- 발생 건수
  last_occurred_at TIMESTAMP,                -- 최근 발생 시간

  -- 업로드 정보
  file_upload_id UUID REFERENCES file_uploads(id),
  uploaded_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(airline_id, callsign_pair),
  INDEX idx_airline_id (airline_id),
  INDEX idx_pair (callsign_pair),
  INDEX idx_risk (risk_level)
);
```

### 2. actions 테이블 (조치 이력)

```sql
CREATE TABLE actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  airline_id UUID NOT NULL REFERENCES airlines(id),
  callsign_id UUID NOT NULL REFERENCES callsigns(id),

  -- 조치 정보
  action_type VARCHAR(100) NOT NULL,         -- "편명 변경", "브리핑 시행" 등
  description TEXT,                          -- 조치 상세 설명
  manager_name VARCHAR(100),                 -- 담당자명
  manager_email VARCHAR(255),                -- 담당자 이메일
  planned_due_date DATE,                     -- 예정 완료일

  -- 상태 추적
  status VARCHAR(20) DEFAULT 'pending',      -- "pending", "in_progress", "completed"
  result_detail TEXT,                        -- 조치 결과 상세
  completed_at TIMESTAMP,                    -- 완료 날짜시간

  -- 등록/수정
  registered_by UUID REFERENCES users(id),  -- 등록자
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- 관리자 검토 (선택사항)
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  review_comment TEXT,

  INDEX idx_airline (airline_id),
  INDEX idx_status (status),
  INDEX idx_registered_at (registered_at),
  INDEX idx_completed_at (completed_at)
);
```

### 3. file_uploads 테이블 (엑셀 업로드 이력)

```sql
CREATE TABLE file_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name VARCHAR(255) NOT NULL,
  file_size INT,                             -- bytes

  -- 업로드자/시간
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- 처리 결과
  total_rows INT DEFAULT 0,
  success_count INT DEFAULT 0,
  failed_count INT DEFAULT 0,
  error_message TEXT,

  -- 상태
  status VARCHAR(20) DEFAULT 'pending',      -- "pending", "processing", "completed", "failed"
  processed_at TIMESTAMP,

  INDEX idx_uploaded_at (uploaded_at),
  INDEX idx_status (status)
);
```

### 4. action_history 테이블 (선택사항 - 감사 추적)

```sql
CREATE TABLE action_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id UUID NOT NULL REFERENCES actions(id) ON DELETE CASCADE,

  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  field_name VARCHAR(50),                    -- "status", "result_detail" 등
  old_value TEXT,
  new_value TEXT,

  INDEX idx_action (action_id),
  INDEX idx_changed_at (changed_at)
);
```

---

## 🔌 API 설계 (Next.js API Routes)

### 항공사 사용자 API (권한: user + 자신의 항공사)

#### 1. 유사호출부호 조회
```
GET /api/airline/callsigns
Query: (없음 - 로그인한 사용자의 항공사만)
Response:
  {
    callsigns: [
      {
        id, pair, myCallsign, otherCallsign, otherAirlineCode,
        errorType, subError, riskLevel, similarity,
        occurrenceCount, lastOccurredAt
      }
    ]
  }
Authorization: Bearer {accessToken}
```

#### 2. 조치 목록 조회
```
GET /api/airline/actions
Query: status=all|pending|in_progress|completed (선택)
Response:
  {
    actions: [
      {
        id, callsignPair, actionType, description,
        manager, plannedDueDate, status,
        registeredAt, completedAt
      }
    ],
    statistics: {
      total, pending, inProgress, completed
    }
  }
Authorization: Bearer {accessToken}
```

#### 3. 조치 등록
```
POST /api/airline/actions
Body:
  {
    callsignId: "uuid",
    actionType: "브리핑 시행",
    description: "파일럿 안전 브리핑 실시",
    managerName: "김윤항",
    managerEmail: "kim@airline.kr",
    plannedDueDate: "2026-03-01"
  }
Response: { id, status: "created" }
Authorization: Bearer {accessToken}
```

#### 4. 조치 수정
```
PATCH /api/airline/actions/{actionId}
Body:
  {
    status: "in_progress" | "completed",
    resultDetail: "2026-02-28 완료됨. 전 조종사 대상 브리핑 실시.",
    completedAt: "2026-02-28T15:30:00Z"
  }
Authorization: Bearer {accessToken}
```

#### 5. 조치 상세 조회
```
GET /api/airline/actions/{actionId}
Response:
  {
    id, callsignPair, actionType, description,
    manager, plannedDueDate, status, resultDetail,
    registeredBy, registeredAt, completedAt,
    registeredByName
  }
Authorization: Bearer {accessToken}
```

### 관리자 API (권한: admin)

#### 1. 전체 조치 이력 조회 (필터)
```
GET /api/admin/actions
Query:
  - airline_id=uuid (선택)
  - status=all|pending|completed
  - from_date=2026-01-01
  - to_date=2026-02-28
  - limit=20 (기본값)
  - offset=0
Response:
  {
    actions: [...],
    total: 150,
    statistics: {
      total, pending, inProgress, completed,
      byAirline: { airline_id: count, ... }
    }
  }
Authorization: Bearer {accessToken} + role=admin
```

#### 2. 항공사별 조치 통계
```
GET /api/admin/statistics
Response:
  {
    airlines: [
      {
        id, code, name_ko, name_en,
        incidentCount, actionCount, completedCount,
        pendingCount, completionRate: 50
      }
    ],
    summary: {
      totalAirlines, totalActions, completedActions,
      pendingActions, completionRate
    }
  }
Authorization: Bearer {accessToken} + role=admin
```

#### 3. 조치 이력 엑셀 반출
```
GET /api/admin/actions/export
Query:
  - airline_id=uuid (선택)
  - status=all|pending|completed
  - from_date, to_date
Response: Excel 파일 (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)
Columns: 항공사, 호출부호, 위험도, 조치유형, 담당자,
         예정일, 상태, 결과, 완료일, 등록자, 등록일
Authorization: Bearer {accessToken} + role=admin
```

#### 4. 호출부호 전체 조회 (관리자)
```
GET /api/admin/callsigns
Query:
  - airline_id=uuid (선택)
  - risk_level=매우높음|높음|낮음
  - limit, offset
Response:
  {
    callsigns: [...],
    total: 500
  }
Authorization: Bearer {accessToken} + role=admin
```

#### 5. 엑셀 파일 업로드
```
POST /api/admin/callsigns/upload
Content-Type: multipart/form-data
Body:
  {
    file: <callsigns.xlsx>,
    uploadedBy: "admin@katc.com"
  }
Response:
  {
    id: "upload_id",
    status: "processing",
    message: "파일 처리 중...",
    uploadedAt: "2026-02-20T15:30:00Z"
  }
Authorization: Bearer {accessToken} + role=admin
```

#### 6. 업로드 결과 조회
```
GET /api/admin/callsigns/upload/{uploadId}
Response:
  {
    id, fileName, uploadedBy, uploadedAt,
    status: "completed" | "failed",
    totalRows, successCount, failedCount,
    errorMessage: "Row 5: 유효하지 않은 형식",
    processedAt
  }
Authorization: Bearer {accessToken} + role=admin
```

#### 7. 업로드 이력 조회
```
GET /api/admin/callsigns/upload-history
Query: limit=10, offset=0
Response:
  {
    uploads: [
      { id, fileName, uploadedBy, uploadedAt,
        status, successCount, failedCount }
    ],
    total: 5
  }
Authorization: Bearer {accessToken} + role=admin
```

---

## 🏗️ 구현 계획 (Implementation Plan)

### Phase 1: 데이터베이스 설계 및 마이그레이션 (0.5-1일)

1. callsigns, actions, file_uploads, action_history 테이블 생성
2. PostgreSQL 마이그레이션 스크립트 작성 (scripts/init.sql 추가)
3. 샘플 데이터 (항공사별 호출부호 10-20개) 추가
4. 인덱스 최적화 (자주 조회하는 컬럼)

### Phase 2: 백엔드 API 구현 (1.5-2일)

**API Route 구현** (src/app/api/):
1. `GET /api/airline/callsigns` - 권한 검증 + 항공사 필터링
2. `GET /api/airline/actions` - 상태 필터 + 페이지네이션
3. `POST/PATCH /api/airline/actions` - 조치 등록/수정 + 검증
4. `GET /api/admin/callsigns` - 관리자용 전체 조회
5. `POST /api/admin/callsigns/upload` - xlsx 파싱 + DB 저장
6. `GET /api/admin/actions` - 필터 + 통계 계산
7. `GET /api/admin/actions/export` - Excel 다운로드 생성
8. `GET /api/admin/statistics` - 집계 쿼리

**기술 스택**:
- node-xlsx / exceljs - Excel 파일 처리
- pg-promise / typed-postgres - DB 쿼리
- 에러 처리: 401/403/409 반환

**인증 패턴** (기존 코드 적용):
```typescript
// admin API: Bearer 토큰 + role='admin' 검증
const token = authHeader.substring(7);
const payload = verifyToken(token);
if (!payload || payload.role !== 'admin') {
  return res.status(403).json({ error: '관리자만 접근 가능' });
}

// user API: 자신의 항공사만 필터링
if (!authPayload || authPayload.airline_id !== requestedAirlineId) {
  return res.status(403).json({ error: '접근 권한이 없습니다.' });
}
```

### Phase 3: 프론트엔드 구현 (1.5-2일)

**훅 구현** (src/hooks/):
- `useAirlineCallsigns()` - useQuery + 권한 필터링
- `useActions()` - useQuery + 상태 필터
- `useCreateAction()` - useMutation + 캐시 무효화
- `useUpdateAction()` - useMutation
- `useFileUpload()` - 파일 업로드 + 진행도
- `useAdminActions()` - 필터, 페이지네이션, 통계
- `useExportActions()` - 엑셀 다운로드
- `useAdminStatistics()` - 조치 통계

**컴포넌트 구현** (src/components/):
- `CallsignTable` - 호출부호 목록 테이블
- `ActionTable` - 조치 이력 테이블
- `ActionModal` - 조치 등록/수정 폼
- `ActionDashboard` - 통계 카드 + 차트
- `FileUploadZone` - 드래그앤드롭 업로드
- `ExportButton` - 엑셀 다운로드

**페이지 구현** (src/app/):
- `/airline` 강화
  - "호출부호" 탭 추가 (CallsignTable)
  - "조치이력" 탭 강화 (ActionTable + ActionModal)
- `/admin/actions` 신규 페이지
  - ActionDashboard (상단)
  - ActionTable (중단, 필터)
  - 엑셀 다운로드 버튼

**UI 패턴** (airline.html 스타일 적용):
- 통계 카드: 배경 색상, 큰 숫자, 작은 라벨
- 테이블: Tailwind 그리드, 호버 효과
- 모달: 흐린 배경, 중앙 정렬, 버튼 3개 (취소/초기화/저장)

### Phase 4: 테스트 및 검증 (0.5-1일)

1. API 테스트 (Zero Script QA - 로그 분석)
2. 권한 검증 테스트
3. 엑셀 파일 처리 테스트 (정상/오류 파일)
4. 통합 테스트 (조치 등록 → 조회 → 수정)

---

## ⚙️ 기술 스택

| 계층 | 기술 | 용도 |
|------|------|------|
| DB | PostgreSQL | 호출부호, 조치, 파일 이력 저장 |
| Backend | Next.js 14 API Routes | REST API (Node.js 런타임) |
| Frontend | React 18 + TypeScript | 사용자 인터페이스 |
| State | Zustand + TanStack Query v5 | 인증 + API 캐싱 |
| Auth | JWT (Bearer Token) | Bearer {accessToken} 패턴 |
| 파일 | exceljs / xlsx | Excel 업로드/다운로드 |
| 스타일 | Tailwind CSS | airline.html 색상 적용 |

---

## 🔐 권한 설계 (RBAC)

| 기능 | 항공사 사용자 | 관리자 |
|------|:---:|:---:|
| 자사 호출부호 조회 | ✅ | ✅ |
| 전체 호출부호 조회 | ❌ | ✅ |
| 자사 조치 등록/수정 | ✅ | ✅ |
| 전체 조치 조회 | ❌ | ✅ |
| 조치 필터/검색 | ❌ | ✅ |
| 조치 이력 다운로드 | ❌ | ✅ |
| 엑셀 업로드 | ❌ | ✅ |
| 통계 대시보드 | ❌ | ✅ |

---

## 📈 성공 기준 (Acceptance Criteria)

### 기능 요구사항

**호출부호 관리**:
- [ ] 항공사 사용자가 자신의 호출부호만 조회 가능
- [ ] 관리자가 전체 호출부호 조회 가능
- [ ] 호출부호 데이터는 DB에 저장됨

**조치 등록/추적**:
- [ ] 항공사 사용자가 조치 등록 가능
- [ ] 조치 상태 변경 (pending → in_progress → completed)
- [ ] 조치 결과 (담당자, 예정일, 완료일) 기록 가능

**관리자 기능**:
- [ ] 관리자가 전체 조치 조회 (필터: 항공사, 상태, 날짜)
- [ ] 조치 통계 표시 (항공사별, 상태별)
- [ ] 조치 이력을 엑셀로 다운로드
- [ ] Excel 파일 업로드 후 DB 저장
- [ ] 엑셀 업로드 이력 조회

**대시보드**:
- [ ] 통계 카드 (전체, 완료, 진행중, 대기)
- [ ] 항공사별 조치 현황 테이블
- [ ] 상태별 분포 시각화
- [ ] 완료율(%) 계산 및 표시

### 비기능 요구사항

- [ ] API 응답 시간 < 500ms (조회), < 1000ms (엑셀)
- [ ] 대용량 파일 처리 (1000+ 행)
- [ ] TanStack Query 캐싱 (30초 staleTime)
- [ ] 권한 검증으로 데이터 보안 확보
- [ ] 모바일 반응형 UI

---

## 🚨 위험성 및 완화책 (Risks & Mitigation)

| 위험 | 확률 | 영향 | 완화책 |
|------|------|------|--------|
| Excel 파일 형식 변경 | 중 | 중 | 유효성 검사 + 오류 로그 |
| 대량 파일 처리 성능 | 중 | 중 | 페이지네이션 + 인덱싱 |
| 권한 검증 누락 | 중 | 높음 | 모든 API에 role 검증 추가 |
| 동시성 문제 (조치 수정) | 낮음 | 중 | updated_at 활용한 낙관적 잠금 |

---

## 📝 관련 문서

- **Design**: airline-data-action-management.design.md (다음 단계)
- **기존 인증**: katc1-auth-v1.md
- **항공사 관리**: airline-management.md (Phase 2)

---

## ✅ Plan 체크리스트

- [x] 목표 정의 (3개)
- [x] 데이터 설계 (4 테이블)
- [x] API 설계 (12 endpoints)
- [x] 구현 순서 명시 (4 phases)
- [x] 성공 기준 정의 (기능 + 비기능)
- [x] 위험 분석
- [x] 현재 구현 패턴 반영 (JWT, React Query, Next.js)

**다음 단계**: Design 문서 작성 → `/pdca design airline-data-action-management`
