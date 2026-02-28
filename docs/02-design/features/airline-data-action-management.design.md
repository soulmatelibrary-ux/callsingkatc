# Design: 항공사 데이터 및 조치 관리 시스템

**Feature**: airline-data-action-management
**Status**: Design Phase
**Date**: 2026-02-20
**Related Plan**: docs/01-plan/features/airline-data-action-management.plan.md

---

## 📋 Executive Summary

Plan 문서의 요구사항을 기술적으로 구현하기 위한 상세 설계. 데이터베이스 스키마, API 엔드포인트, 컴포넌트 구조, 그리고 권한 검증 전략을 정의합니다.

---

## 🏗️ 아키텍처 개요

```
┌─────────────────────────────────────────────────────────────┐
│                      프론트엔드 계층                          │
├─────────────────────────────────────────────────────────────┤
│  • /airline (항공사 페이지)                                   │
│    - IncidentsTab (발생현황 + 세부오류분석)                  │
│    - ActionsTab (조치 이력)                                   │
│    - AirlineStatisticsTab (통계)                             │
│    - AnnouncementsTab (공지사항)                             │
│    - ActionRegistration (조치 등록 모달)                     │
│                                                              │
│  • /admin (관리자 페이지)                                    │
│    - ActionDashboard (조치 대시보드)                         │
│    - CallSignUpload (엑셀 업로드)                            │
│    - UploadHistory (업로드 이력)                             │
│    - ActionManagement (조치 관리 탭)                         │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                      상태 관리 계층                           │
├─────────────────────────────────────────────────────────────┤
│  • Zustand (사용자 상태: 항공사, 역할)                       │
│  • TanStack Query v5                                        │
│    - useAirlineCallsigns (호출부호 목록)                    │
│    - useActions (조치 이력)                                  │
│    - useAdminActions (관리자 조회)                           │
│    - useFileUpload (파일 업로드)                             │
│    - useAdminStatistics (대시보드 통계)                     │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                     API 계층 (Next.js)                       │
├─────────────────────────────────────────────────────────────┤
│  • /api/airline/callsigns                                   │
│  • /api/airline/actions                                     │
│  • /api/admin/actions                                       │
│  • /api/admin/statistics                                    │
│  • /api/admin/callsigns/upload                              │
│  • /api/admin/callsigns/upload-history                      │
│  • /api/admin/actions/export                                │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    데이터베이스 계층                          │
├─────────────────────────────────────────────────────────────┤
│  • callsigns (유사호출부호 마스터)                            │
│  • actions (조치 이력)                                       │
│  • action_history (조치 수정 이력 - 선택)                    │
│  • file_uploads (업로드 이력)                                │
│  • airlines (기존)                                           │
│  • users (기존)                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 💾 데이터베이스 스키마

### 1. callsigns 테이블

```typescript
// TypeScript 타입 정의
interface CallSign {
  id: string;                  // UUID
  airlineCode: string;         // 항공사 코드 (KAL, AAR, ...)
  callsignPair: string;        // "KAL852 | KAL851"
  myCallsign: string;          // "KAL852"
  otherCallsign: string;       // "KAL851"
  errorType: 'ATC' | 'PILOT' | 'NONE';  // 관제사/조종사/없음
  subError?: string;           // "복창오류", "무응답/재호출"
  riskLevel: 'VERY_HIGH' | 'HIGH' | 'LOW';
  similarity: 'VERY_HIGH' | 'HIGH' | 'LOW';
  occurrenceCount: number;
  lastOccurredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

**SQL**:
```sql
CREATE TABLE callsigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  airline_code VARCHAR(10) NOT NULL,
  callsign_pair VARCHAR(30) NOT NULL,
  my_callsign VARCHAR(15) NOT NULL,
  other_callsign VARCHAR(15) NOT NULL,
  error_type VARCHAR(20) NOT NULL,
  sub_error VARCHAR(50),
  risk_level VARCHAR(20) NOT NULL,
  similarity VARCHAR(20) NOT NULL,
  occurrence_count INT DEFAULT 0,
  last_occurred_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  KEY idx_airline (airline_code),
  KEY idx_pair (callsign_pair),
  UNIQUE KEY uk_pair_airline (airline_code, callsign_pair)
);
```

### 2. actions 테이블

```typescript
interface Action {
  id: string;
  airlineCode: string;
  callsignPair: string;
  actionType: string;        // "편명 변경", "브리핑", "모니터링" 등
  managerName: string;
  managerEmail: string;
  plannedDueDate?: Date;
  status: 'pending' | 'in_progress' | 'completed';
  resultDetail?: string;
  completedAt?: Date;
  registeredBy: string;      // 항공사 직원
  registeredAt: Date;
  reviewedBy?: string;       // 관리자
  reviewedAt?: Date;
  updatedAt: Date;
}
```

**SQL**:
```sql
CREATE TABLE actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  airline_code VARCHAR(10) NOT NULL,
  callsign_pair VARCHAR(30) NOT NULL,
  action_type VARCHAR(100) NOT NULL,
  manager_name VARCHAR(100) NOT NULL,
  manager_email VARCHAR(100),
  planned_due_date DATE,
  status VARCHAR(20) DEFAULT 'pending',
  result_detail TEXT,
  completed_at TIMESTAMP,
  registered_by VARCHAR(100) NOT NULL,
  registered_at TIMESTAMP DEFAULT NOW(),
  reviewed_by VARCHAR(100),
  reviewed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW(),

  KEY idx_airline (airline_code),
  KEY idx_status (status),
  KEY idx_pair (callsign_pair),
  KEY idx_registered_date (registered_at),
  FOREIGN KEY (airline_code) REFERENCES airlines(code)
);
```

### 3. file_uploads 테이블

```typescript
interface FileUpload {
  id: string;
  fileName: string;
  filePath?: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: Date;
  totalRows: number;
  successCount: number;
  failedCount: number;
  errorMessage?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  processedAt?: Date;
}
```

**SQL**:
```sql
CREATE TABLE file_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500),
  file_size INT,
  uploaded_by VARCHAR(100) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  total_rows INT,
  success_count INT DEFAULT 0,
  failed_count INT DEFAULT 0,
  error_message TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  processed_at TIMESTAMP,

  KEY idx_uploaded_at (uploaded_at),
  KEY idx_status (status),
  FOREIGN KEY (uploaded_by) REFERENCES users(email)
);
```

---

## 🔌 API 상세 설계

### 인증 & 권한

모든 API는 JWT 인증이 필요합니다.

```typescript
// middleware/auth.ts
type UserRole = 'admin' | 'user';

interface AuthPayload {
  userId: string;
  email: string;
  airlineCode?: string;  // 사용자의 항공사 (admin은 undefined)
  role: UserRole;
}

// 권한 검증 함수
function requireAdmin(payload: AuthPayload) {
  if (payload.role !== 'admin') {
    throw new ForbiddenError('관리자만 접근 가능합니다.');
  }
}

function requireUserOrAdmin(payload: AuthPayload) {
  if (!payload.role) {
    throw new UnauthorizedError('인증이 필요합니다.');
  }
}
```

### 1. 항공사 사용자 API

#### GET /api/airline/callsigns

**목적**: 항공사별 호출부호 조회 (권한 기반)

**요청**:
```bash
GET /api/airline/callsigns?airlineCode=KAL&search=KAL8
```

**응답** (200 OK):
```json
{
  "callsigns": [
    {
      "id": "uuid",
      "airlineCode": "KAL",
      "callsignPair": "KAL852 | KAL851",
      "myCallsign": "KAL852",
      "otherCallsign": "KAL851",
      "errorType": "ATC",
      "riskLevel": "HIGH",
      "similarity": "VERY_HIGH",
      "occurrenceCount": 12,
      "lastOccurredAt": "2026-02-15T10:30:00Z"
    }
  ],
  "total": 45,
  "page": 1,
  "pageSize": 20
}
```

**권한**:
- 사용자: 자신의 항공사만 조회 가능
- 관리자: 모든 항공사 조회 가능

**구현**:
```typescript
// src/app/api/airline/callsigns/route.ts
export async function GET(request: NextRequest) {
  const payload = verifyToken(request);
  const { airlineCode, search, page = 1, limit = 20 } = getQueryParams(request);

  // 권한 검증
  if (payload.role === 'user' && payload.airlineCode !== airlineCode) {
    return NextResponse.json({ error: '자신의 항공사만 조회 가능합니다.' }, { status: 403 });
  }

  const offset = (page - 1) * limit;
  const result = await query(
    `SELECT * FROM callsigns
     WHERE airline_code = $1 AND callsign_pair ILIKE $2
     ORDER BY occurrence_count DESC
     LIMIT $3 OFFSET $4`,
    [airlineCode, `%${search}%`, limit, offset]
  );

  return NextResponse.json({ callsigns: result.rows });
}
```

#### GET /api/airline/actions

**목적**: 조치 이력 조회

**요청**:
```bash
GET /api/airline/actions?status=completed&page=1
```

**응답** (200 OK):
```json
{
  "actions": [
    {
      "id": "uuid",
      "airlineCode": "KAL",
      "callsignPair": "KAL852 | KAL851",
      "actionType": "브리핑 시행",
      "managerName": "김윤항",
      "plannedDueDate": "2026-03-01",
      "status": "completed",
      "resultDetail": "파일럿 안전 브리핑 완료",
      "registeredAt": "2026-02-15T10:00:00Z",
      "completedAt": "2026-02-28T15:30:00Z"
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "pageSize": 20,
    "totalPages": 2
  }
}
```

#### POST /api/airline/actions

**목적**: 조치 등록

**요청**:
```json
{
  "airlineCode": "KAL",
  "callsignPair": "KAL852 | KAL851",
  "actionType": "브리핑 시행",
  "managerName": "김윤항",
  "managerEmail": "kim@airline.kr",
  "plannedDueDate": "2026-03-01",
  "resultDetail": "파일럿 안전 브리핑 준비"
}
```

**응답** (201 Created):
```json
{
  "id": "uuid",
  "status": "pending",
  "message": "조치가 등록되었습니다."
}
```

#### PATCH /api/airline/actions/{actionId}

**목적**: 조치 상태 업데이트

**요청**:
```json
{
  "status": "completed",
  "resultDetail": "브리핑 완료 (2026-02-28)"
}
```

**응답** (200 OK):
```json
{
  "id": "uuid",
  "status": "completed",
  "updatedAt": "2026-02-28T15:30:00Z"
}
```

### 2. 관리자 API

#### POST /api/admin/callsigns/upload

**목적**: callsign.xlsx 파일 업로드

**요청**:
```bash
curl -X POST /api/admin/callsigns/upload \
  -F "file=@callsigns_2026-02-20.xlsx" \
  -H "Authorization: Bearer {token}"
```

**응답** (202 Accepted):
```json
{
  "uploadId": "uuid",
  "fileName": "callsigns_2026-02-20.xlsx",
  "status": "processing",
  "uploadedAt": "2026-02-20T15:30:00Z",
  "message": "파일 처리 중입니다..."
}
```

**구현 흐름**:
```typescript
// src/app/api/admin/callsigns/upload/route.ts
export async function POST(request: NextRequest) {
  const payload = verifyToken(request);
  requireAdmin(payload);

  const formData = await request.formData();
  const file = formData.get('file') as File;

  // 파일 검증
  validateExcelFile(file);

  // 업로드 레코드 생성
  const uploadId = await createUploadRecord(file.name, payload.email);

  // 비동기 처리 (background job)
  await processExcelFile(uploadId, file)
    .catch(err => updateUploadStatus(uploadId, 'failed', err.message));

  return NextResponse.json(
    { uploadId, status: 'processing' },
    { status: 202 }
  );
}

// 별도 처리 (Promise)
async function processExcelFile(uploadId: string, file: File) {
  const buffer = await file.arrayBuffer();
  const workbook = readExcelFile(buffer);

  let successCount = 0, failedCount = 0;
  const errors: string[] = [];

  for (const row of workbook.rows) {
    try {
      validateRow(row);
      await insertOrUpdateCallSign(row);
      successCount++;
    } catch (err) {
      failedCount++;
      errors.push(`Row ${row.index}: ${err.message}`);
    }
  }

  await updateUploadStatus(uploadId, 'completed', {
    totalRows: workbook.rows.length,
    successCount,
    failedCount,
    errorMessage: errors.slice(0, 10).join('\n')
  });
}
```

#### GET /api/admin/callsigns/upload/{uploadId}

**목적**: 업로드 결과 조회

**응답**:
```json
{
  "id": "uuid",
  "fileName": "callsigns_2026-02-20.xlsx",
  "uploadedBy": "admin@katc.go.kr",
  "uploadedAt": "2026-02-20T15:30:00Z",
  "status": "completed",
  "totalRows": 150,
  "successCount": 148,
  "failedCount": 2,
  "errorMessage": "Row 5: 유효하지 않은 형식\nRow 87: 중복된 호출부호",
  "processedAt": "2026-02-20T15:35:00Z"
}
```

#### GET /api/admin/actions

**목적**: 모든 조치 이력 조회 (필터 지원)

**요청**:
```bash
GET /api/admin/actions?airlineCode=KAL&status=completed&from=2026-01-01&to=2026-02-28&page=1
```

**응답**:
```json
{
  "actions": [
    {
      "id": "uuid",
      "airlineCode": "KAL",
      "callsignPair": "KAL852 | KAL851",
      "actionType": "브리핑",
      "managerName": "김윤항",
      "status": "completed",
      "completedAt": "2026-02-28T15:30:00Z"
    }
  ],
  "statistics": {
    "total": 156,
    "pending": 34,
    "inProgress": 45,
    "completed": 77,
    "completionRate": 49.4,
    "byAirline": {
      "KAL": 77,
      "AAR": 43,
      "JJA": 36
    }
  },
  "pagination": { "total": 156, "page": 1, "pageSize": 20, "totalPages": 8 }
}
```

#### GET /api/admin/statistics

**목적**: 항공사별 조치 통계 (대시보드용)

**응답**:
```json
{
  "summary": {
    "totalIncidents": 456,
    "totalActions": 234,
    "completedActions": 115,
    "completionRate": 49.1,
    "pendingCount": 52,
    "inProgressCount": 67
  },
  "byAirline": [
    {
      "code": "KAL",
      "name": "대한항공",
      "incidentCount": 123,
      "actionCount": 89,
      "completedCount": 45,
      "completionRate": 50.6
    },
    {
      "code": "AAR",
      "name": "아시아나",
      "incidentCount": 98,
      "actionCount": 76,
      "completedCount": 32,
      "completionRate": 42.1
    }
  ],
  "timeline": [
    { "date": "2026-02-01", "count": 12 },
    { "date": "2026-02-02", "count": 15 },
    { "date": "2026-02-03", "count": 8 }
  ]
}
```

#### GET /api/admin/actions/export

**목적**: 조치 이력 엑셀 다운로드

**요청**:
```bash
GET /api/admin/actions/export?airlineCode=KAL&status=completed&from=2026-01-01&to=2026-02-28
```

**응답**: Excel 파일 (content-type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)

**엑셀 컬럼**:
```
A: 항공사 | B: 호출부호 | C: 조치유형 | D: 담당자 | E: 계획일자
F: 상태 | G: 조치결과 | H: 완료일자 | I: 등록자 | J: 등록일자
```

---

## 🎨 프론트엔드 컴포넌트 구조

### 항공사 페이지 (`/(main)/airline`)

```
src/app/(main)/airline/page.tsx
├── Header (기존)
├── Sidebar
│   └── TabNav (발생현황, 조치이력, 통계, 공지사항)
│
└── Tabs
    ├── IncidentsTab (발생현황)
    │   ├── 요약 카드 (Total Cases, 오류 유형별 통계)
    │   ├── DetailAnalysisSection (세부오류분석 - Collapsible)
    │   │   ├── 오류분포 바 차트
    │   │   └── 분석 인사이트
    │   ├── FilterBar (검색, 필터, 날짜범위)
    │   ├── IncidentsTable
    │   └── Pagination
    │
    ├── ActionsTab (조치이력)
    │   ├── ActionFilter
    │   ├── ActionTable
    │   ├── Pagination
    │   └── ActionRegistrationModal
    │
    ├── AirlineStatisticsTab (통계)
    │   ├── DateRangeFilter
    │   ├── AnalyticsCharts (recharts 기반)
    │   └── StatisticsSummary
    │
    └── AnnouncementsTab (공지사항)
        ├── ActiveAnnouncements
        ├── AnnouncementHistory
        └── AnnouncementBadges
```

**주요 컴포넌트**:

```typescript
// src/components/airline/ActionTable.tsx
export function ActionTable() {
  const { data: actions, isLoading } = useActions(airlineCode);
  const { mutate: updateAction } = useUpdateAction();

  return (
    <table>
      <thead>
        <tr>
          <th>호출부호</th>
          <th>조치유형</th>
          <th>담당자</th>
          <th>계획일자</th>
          <th>상태</th>
          <th>액션</th>
        </tr>
      </thead>
      <tbody>
        {actions.map(action => (
          <tr key={action.id}>
            <td>{action.callsignPair}</td>
            <td>{action.actionType}</td>
            <td>{action.managerName}</td>
            <td>{formatDate(action.plannedDueDate)}</td>
            <td>
              <StatusBadge status={action.status} />
            </td>
            <td>
              <Button onClick={() => openEditModal(action)}>수정</Button>
              {action.status === 'pending' && (
                <Button onClick={() => deleteAction(action.id)}>삭제</Button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### 관리자 페이지 (`/admin`)

```
src/app/admin/page.tsx
├── Header (기존)
├── TabNav (사용자, 항공사, 조치 관리, 엑셀 업로드)
│
└── Tabs
    ├── UserManagementTab (기존)
    │
    ├── AirlineManagementTab (기존)
    │
    ├── ActionManagementTab (신규)
    │   ├── ActionDashboard
    │   │   ├── StatCard (전체/완료/진행/대기)
    │   │   ├── CompletionChart
    │   │   ├── TimelineGraph
    │   │   └── AirlineStatsTable
    │   │
    │   ├── ActionFilter
    │   ├── ActionTable
    │   ├── ExportButton
    │   └── ActionPagination
    │
    └── ExcelUploadTab (신규)
        ├── FileDropZone
        ├── FilePreview
        ├── UploadProgressBar
        ├── UploadResultReport
        └── UploadHistoryTable
```

**주요 컴포넌트**:

```typescript
// src/components/admin/ActionDashboard.tsx
export function ActionDashboard() {
  const { data: stats } = useAdminStatistics();

  return (
    <div className="grid grid-cols-4 gap-4">
      <StatCard label="전체 조치" value={stats.totalActions} />
      <StatCard label="완료" value={stats.completedActions} percentage={stats.completionRate} />
      <StatCard label="진행중" value={stats.inProgressCount} />
      <StatCard label="대기중" value={stats.pendingCount} />
    </div>
  );
}

// src/components/admin/ExcelUploadArea.tsx
export function ExcelUploadArea() {
  const { mutate: uploadFile } = useFileUpload();
  const [uploadId, setUploadId] = useState<string | null>(null);

  async function handleUpload(file: File) {
    const result = await uploadFile(file);
    setUploadId(result.uploadId);

    // 폴링으로 상태 확인
    const checkStatus = setInterval(async () => {
      const status = await getUploadStatus(result.uploadId);
      if (status.status !== 'processing') {
        clearInterval(checkStatus);
        showUploadResult(status);
      }
    }, 1000);
  }

  return (
    <FileDropZone onDrop={handleUpload}>
      {uploadId ? <UploadProgressBar uploadId={uploadId} /> : null}
    </FileDropZone>
  );
}
```

---

## 🪝 Custom Hooks (상태 관리)

```typescript
// src/hooks/useAirlineCallsigns.ts
export function useAirlineCallsigns(airlineCode: string) {
  return useQuery({
    queryKey: ['airline', 'callsigns', airlineCode],
    queryFn: () => fetch(`/api/airline/callsigns?airlineCode=${airlineCode}`).then(r => r.json()),
    staleTime: 5 * 60 * 1000, // 5분
  });
}

// src/hooks/useActions.ts
export function useActions(airlineCode: string, status?: string) {
  return useQuery({
    queryKey: ['airline', 'actions', airlineCode, status],
    queryFn: () => {
      const query = new URLSearchParams({ airlineCode });
      if (status) query.append('status', status);
      return fetch(`/api/airline/actions?${query}`).then(r => r.json());
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateActionRequest) => {
      return fetch('/api/airline/actions', {
        method: 'POST',
        body: JSON.stringify(data),
      }).then(r => r.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['airline', 'actions'] });
    },
  });
}

// src/hooks/useAdminStatistics.ts
export function useAdminStatistics() {
  return useQuery({
    queryKey: ['admin', 'statistics'],
    queryFn: () => fetch('/api/admin/statistics').then(r => r.json()),
    staleTime: 60 * 1000, // 1분
    refetchInterval: 60 * 1000,
  });
}

// src/hooks/useFileUpload.ts
export function useFileUpload() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/admin/callsigns/upload', {
        method: 'POST',
        body: formData,
      });
      return response.json();
    },
  });
}

export function useUploadStatus(uploadId: string) {
  return useQuery({
    queryKey: ['admin', 'upload', uploadId],
    queryFn: () => fetch(`/api/admin/callsigns/upload/${uploadId}`).then(r => r.json()),
    refetchInterval: (data) => data?.status === 'processing' ? 1000 : false,
  });
}
```

---

## 🔐 권한 검증 전략

### 데이터 계층 (SQL)

```sql
-- 사용자가 자신의 항공사 데이터만 볼 수 있도록
SELECT * FROM callsigns
WHERE airline_code = $1 AND airline_code IN (
  SELECT airline_code FROM users WHERE id = $2
);

-- 관리자는 모든 데이터 조회
SELECT * FROM callsigns
WHERE role = 'admin' OR airline_code = $1;
```

### API 미들웨어

```typescript
// src/lib/middleware/authorize.ts
export async function authorizeAirlineAccess(
  payload: AuthPayload,
  requiredAirlineCode: string
) {
  if (payload.role === 'admin') return true;
  if (payload.airlineCode !== requiredAirlineCode) {
    throw new ForbiddenError('자신의 항공사만 접근 가능합니다.');
  }
  return true;
}

export async function authorizeAdminAccess(payload: AuthPayload) {
  if (payload.role !== 'admin') {
    throw new ForbiddenError('관리자만 접근 가능합니다.');
  }
  return true;
}
```

---

## 📊 파일 업로드 처리 전략

### Excel 유효성 검증

```typescript
// src/lib/excel/validator.ts
interface ExcelSchema {
  airlineCode: string;
  callsignPair: string;
  myCallsign: string;
  otherCallsign: string;
  errorType: string;
  riskLevel: string;
  similarity: string;
}

export function validateExcelRow(row: any, index: number): ExcelSchema {
  const errors: string[] = [];

  if (!row.airline_code) errors.push('항공사 코드 필수');
  if (!row.callsign_pair) errors.push('호출부호 필수');
  if (!['ATC', 'PILOT', 'NONE'].includes(row.error_type)) {
    errors.push('오류 유형 형식 오류');
  }

  if (errors.length > 0) {
    throw new ValidationError(`Row ${index}: ${errors.join(', ')}`);
  }

  return { /* 정규화된 데이터 */ };
}
```

### 대용량 파일 처리 (Streaming)

```typescript
// src/lib/excel/processor.ts
export async function streamProcessExcelFile(
  buffer: Buffer,
  uploadId: string,
  onProgress: (progress: number) => void
) {
  const workbook = readExcelFile(buffer);
  const totalRows = workbook.rows.length;
  let processed = 0;

  // 배치 처리 (메모리 효율)
  const batchSize = 100;
  for (let i = 0; i < totalRows; i += batchSize) {
    const batch = workbook.rows.slice(i, i + batchSize);

    await Promise.all(
      batch.map(row => insertOrUpdateCallSign(row))
    );

    processed += batch.length;
    onProgress(Math.round((processed / totalRows) * 100));
  }
}
```

---

## ⚡ 성능 최적화 전략

### 1. 데이터베이스 인덱싱

```sql
-- 조회 성능 최적화
CREATE INDEX idx_actions_airline_status ON actions(airline_code, status);
CREATE INDEX idx_callsigns_occurrence ON callsigns(occurrence_count DESC);

-- 업로드 이력 검색
CREATE INDEX idx_uploads_admin_date ON file_uploads(uploaded_by, uploaded_at DESC);
```

### 2. 캐싱 전략

```typescript
// TanStack Query 설정
const defaultQueryOptions = {
  staleTime: 5 * 60 * 1000,    // 5분
  cacheTime: 10 * 60 * 1000,   // 10분
  retry: 1,
};
```

### 3. 페이지네이션

```typescript
// API: 기본 20개씩, 최대 100개
GET /api/admin/actions?page=1&limit=20

// 프론트엔드: 가상 스크롤 적용
<VirtualList height={600} itemCount={1000} itemSize={60}>
  {ActionTableRow}
</VirtualList>
```

---

## 🚨 에러 처리 전략

```typescript
// src/app/api/lib/errors.ts
class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
  }
}

class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message, 'VALIDATION_ERROR');
  }
}

class ForbiddenError extends AppError {
  constructor(message: string) {
    super(403, message, 'FORBIDDEN');
  }
}

// API 에러 핸들러
export function handleApiError(error: AppError): NextResponse {
  return NextResponse.json(
    {
      error: error.message,
      code: error.code,
      timestamp: new Date().toISOString(),
    },
    { status: error.statusCode }
  );
}
```

---

## 📋 구현 체크리스트

### 데이터베이스
- [ ] callsigns 테이블 생성 (또는 확인)
- [ ] actions 테이블 생성
- [ ] file_uploads 테이블 생성
- [ ] 인덱스 생성
- [ ] 샘플 데이터 삽입

### 백엔드 API
- [ ] /api/airline/callsigns (GET)
- [ ] /api/airline/actions (GET, POST, PATCH)
- [ ] /api/admin/callsigns/upload (POST)
- [ ] /api/admin/callsigns/upload/{uploadId} (GET)
- [ ] /api/admin/callsigns/upload-history (GET)
- [ ] /api/admin/actions (GET)
- [ ] /api/admin/statistics (GET)
- [ ] /api/admin/actions/export (GET)

### 프론트엔드
- [x] 항공사 페이지 - IncidentsTab (발생현황 + 세부오류분석)
- [x] 항공사 페이지 - ActionsTab (조치이력)
- [x] 항공사 페이지 - AirlineStatisticsTab (통계)
- [x] 항공사 페이지 - AnnouncementsTab (공지사항)
- [ ] 관리자 페이지 - Action 대시보드
- [ ] 관리자 페이지 - Excel 업로드
- [ ] 관리자 페이지 - Upload 이력

### Hooks & 상태관리
- [ ] useAirlineCallsigns
- [ ] useActions
- [ ] useAdminActions
- [ ] useAdminStatistics
- [ ] useFileUpload
- [ ] useUploadStatus

### 테스트
- [ ] API 엔드포인트 테스트
- [ ] 권한 검증 테스트
- [ ] 파일 업로드 테스트
- [ ] 대용량 데이터 처리 테스트

---

## 🔗 관련 문서

- **Plan**: docs/01-plan/features/airline-data-action-management.plan.md
- **인증 설계**: docs/02-design/features/katc1-auth-v1.design.md
- **항공사 관리**: docs/02-design/features/airline-management.design.md

---

**다음 단계**: Implementation (Do Phase) → `/pdca do airline-data-action-management`
