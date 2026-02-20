# airline-data-action-management Analysis Report

> **Analysis Type**: Gap Analysis (Design vs Implementation)
>
> **Project**: KATC1
> **Version**: Phase 4
> **Analyst**: gap-detector
> **Date**: 2026-02-20
> **Design Doc**: [airline-data-action-management.design.md](../../02-design/features/airline-data-action-management.design.md)

---

## 1. Analysis Overview

### 1.1 Analysis Purpose

Phase 4 (airline-data-action-management)의 설계 문서와 실제 구현 코드 간 일치도를 측정하고, 누락된 기능/불일치 항목/추가된 기능을 식별한다.

### 1.2 Analysis Scope

- **Design Document**: `docs/02-design/features/airline-data-action-management.design.md`
- **Implementation Paths**:
  - `scripts/init.sql` (DB schema)
  - `src/types/action.ts` (Type definitions)
  - `src/hooks/useActions.ts` (React Query hooks)
  - `src/app/api/actions/` (API routes)
  - `src/app/api/callsigns/` (API routes)
  - `src/app/api/airlines/[airlineId]/actions/` (API routes)
  - `src/app/api/airlines/[airlineId]/callsigns/` (API routes)
  - `src/components/actions/ActionModal.tsx` (Frontend component)
  - `src/app/admin/actions/page.tsx` (Admin page)
  - `src/app/(main)/airline/page.tsx` (Airline user page)
- **Analysis Date**: 2026-02-20

---

## 2. Overall Scores

| Category | Score | Status |
|----------|:-----:|:------:|
| Database Schema Match | 82% | Warning |
| API Endpoints Match | 50% | Critical |
| Type Definitions Match | 90% | Pass |
| React Query Hooks Match | 65% | Warning |
| Frontend Components Match | 45% | Critical |
| Architecture Compliance | 70% | Warning |
| Convention Compliance | 80% | Warning |
| **Overall** | **62%** | **Critical** |

---

## 3. Database Schema Gap Analysis

### 3.1 Table-Level Comparison

| Design Table | Implementation | Status | Notes |
|-------------|---------------|--------|-------|
| callsigns | `scripts/init.sql:122-154` | Match (Enhanced) | Implementation adds airline_id FK, other_airline_code, file_upload_id, uploaded_at |
| actions | `scripts/init.sql:162-189` | Match (Enhanced) | Implementation adds callsign_id FK (design used callsign_pair string), description field, review_comment |
| file_uploads | `scripts/init.sql:100-116` | Match (Modified) | Implementation uses uploaded_by UUID FK (design used VARCHAR email), removed file_path |
| action_history | `scripts/init.sql:199-211` | Match | Field-level change tracking as designed |

### 3.2 Field-Level Differences

#### callsigns table

| Field | Design | Implementation | Status | Impact |
|-------|--------|---------------|--------|--------|
| id | UUID PK | UUID PK | Match | - |
| airline_code | VARCHAR(10) NOT NULL | VARCHAR(10) NOT NULL | Match | - |
| airline_id | - | UUID NOT NULL FK | Added | Better referential integrity |
| callsign_pair | VARCHAR(30) | VARCHAR(50) | Changed | Wider allowance - compatible |
| my_callsign | VARCHAR(15) | VARCHAR(20) | Changed | Wider allowance - compatible |
| other_callsign | VARCHAR(15) | VARCHAR(20) | Changed | Wider allowance - compatible |
| other_airline_code | - | VARCHAR(10) | Added | Tracks counterpart airline |
| error_type | VARCHAR(20) NOT NULL | VARCHAR(30) nullable | Changed | Implementation allows nulls, wider enum |
| sub_error | VARCHAR(50) | VARCHAR(30) | Changed | Narrower - may truncate |
| risk_level | VARCHAR(20) NOT NULL | VARCHAR(20) nullable | Changed | Implementation allows nulls |
| similarity | VARCHAR(20) NOT NULL | VARCHAR(20) nullable | Changed | Implementation allows nulls |
| file_upload_id | - | UUID FK | Added | Links to upload source |
| uploaded_at | - | TIMESTAMP | Added | Tracks upload time |
| UNIQUE | (airline_code, callsign_pair) | (airline_id, callsign_pair) + (airline_code, callsign_pair) | Enhanced | Dual unique constraints |

**Design value format shift**: Design uses English enums (`'ATC' | 'PILOT' | 'NONE'`, `'VERY_HIGH' | 'HIGH' | 'LOW'`), implementation uses Korean values (`'관제사 오류'`, `'매우높음'`).

#### actions table

| Field | Design | Implementation | Status | Impact |
|-------|--------|---------------|--------|--------|
| callsign_pair | VARCHAR(30) NOT NULL | - | Removed | Replaced by callsign_id FK |
| callsign_id | - | UUID NOT NULL FK | Added | Relational reference (better) |
| airline_code | VARCHAR(10) NOT NULL | - | Removed | Replaced by airline_id FK |
| airline_id | - | UUID NOT NULL FK | Added | Relational reference (better) |
| description | - | TEXT | Added | Additional detail field |
| manager_name | VARCHAR(100) NOT NULL | VARCHAR(100) nullable | Changed | Implementation allows nulls |
| manager_email | VARCHAR(100) | VARCHAR(255) | Changed | Wider - compatible |
| registered_by | VARCHAR(100) | UUID FK | Changed | Better referential integrity |
| reviewed_by | VARCHAR(100) | UUID FK | Changed | Better referential integrity |
| review_comment | - | TEXT | Added | Admin review notes |

#### file_uploads table

| Field | Design | Implementation | Status | Impact |
|-------|--------|---------------|--------|--------|
| file_path | VARCHAR(500) | - | Removed | Not needed for in-memory processing |
| uploaded_by | VARCHAR(100) (email) | UUID FK | Changed | Better referential integrity |

### 3.3 Index Comparison

| Design Index | Implementation | Status |
|-------------|---------------|--------|
| idx_airline (callsigns) | idx_callsigns_airline_code | Match |
| idx_pair (callsigns) | idx_callsigns_pair | Match |
| uk_pair_airline (callsigns) | UNIQUE(airline_code, callsign_pair) | Match |
| idx_airline (actions) | idx_actions_airline_id | Match (by ID) |
| idx_status (actions) | idx_actions_status | Match |
| idx_pair (actions) | - | Missing (replaced by callsign_id FK) |
| idx_registered_date (actions) | idx_actions_registered_at | Match |
| idx_uploaded_at (file_uploads) | idx_file_uploads_uploaded_at | Match |
| idx_status (file_uploads) | idx_file_uploads_status | Match |
| idx_actions_airline_status (perf) | - | Missing |
| idx_callsigns_occurrence (perf) | - | Missing |
| idx_uploads_admin_date (perf) | - | Missing |
| - | idx_callsigns_airline_id | Added |
| - | idx_callsigns_risk_level | Added |
| - | idx_callsigns_created_at | Added |
| - | idx_actions_callsign_id | Added |
| - | idx_actions_registered_by | Added |
| - | idx_actions_completed_at | Added |
| - | idx_file_uploads_uploaded_by | Added |

**DB Schema Score: 82%** - Core schema matches well. Enhancements (UUID FKs instead of string references) are improvements over design. Some performance indexes from design are missing but compensated with other useful indexes. The key concern is the enum value format shift (English -> Korean).

---

## 4. API Endpoints Gap Analysis

### 4.1 Endpoint Comparison

| Design Endpoint | Implementation | Status | Notes |
|----------------|---------------|--------|-------|
| `GET /api/airline/callsigns` | `GET /api/callsigns` + `GET /api/airlines/[airlineId]/callsigns` | Changed | URL path differs; split into 2 endpoints |
| `GET /api/airline/actions` | `GET /api/actions` | Changed | URL path differs; admin-only (design allowed user access) |
| `POST /api/airline/actions` | `POST /api/airlines/[airlineId]/actions` | Changed | URL structure changed; admin-only (design allowed user registration) |
| `PATCH /api/airline/actions/{actionId}` | `PATCH /api/actions/[id]` | Changed | URL path differs; admin-only |
| `POST /api/admin/callsigns/upload` | - | Missing | Excel upload not implemented |
| `GET /api/admin/callsigns/upload/{uploadId}` | - | Missing | Upload status check not implemented |
| `GET /api/admin/callsigns/upload-history` | - | Missing | Upload history not implemented |
| `GET /api/admin/actions` | `GET /api/actions` (same endpoint) | Merged | Design had separate admin endpoint; implementation merges with airline endpoint |
| `GET /api/admin/statistics` | - | Missing | Statistics dashboard API not implemented |
| `GET /api/admin/actions/export` | - | Missing | Excel export not implemented |
| - | `GET /api/actions/[id]` | Added | Action detail endpoint (not in design) |
| - | `DELETE /api/actions/[id]` | Added | Action delete endpoint (not in design) |

### 4.2 API URL Pattern Differences

| Design Pattern | Implementation Pattern | Issue |
|---------------|----------------------|-------|
| `/api/airline/callsigns` | `/api/callsigns` | Design groups by role; implementation is resource-based |
| `/api/airline/actions` | `/api/actions` | Same pattern shift |
| `/api/airline/actions` (POST) | `/api/airlines/[airlineId]/actions` (POST) | RESTful nesting - implementation is better |

### 4.3 Response Format Comparison

**Design: GET /api/airline/callsigns response**
```json
{
  "callsigns": [...],
  "total": 45,
  "page": 1,
  "pageSize": 20
}
```

**Implementation: GET /api/callsigns response**
```json
{
  "data": [...],
  "pagination": { "page": 1, "limit": 20, "total": 45, "totalPages": 3 }
}
```

| Response Aspect | Design | Implementation | Status |
|----------------|--------|---------------|--------|
| Data wrapper key | `callsigns` / `actions` | `data` | Changed - inconsistent with design |
| Pagination format | Flat `total`, `page`, `pageSize` | Nested `pagination` object | Changed |
| Pagination field name | `pageSize` | `limit` | Changed |
| Total pages | Not provided | `totalPages` included | Added (improvement) |

### 4.4 Permission Model Differences

| Endpoint | Design Permission | Implementation Permission | Status |
|----------|-----------------|-------------------------|--------|
| Callsign list | User (own airline) + Admin (all) | Any authenticated user | Changed (less restrictive) |
| Action list | User (own airline) + Admin (all) | Admin only | Changed (more restrictive) |
| Action create | User (own airline) | Admin only | Changed (P0 issue) |
| Action update | User (own airline) | Admin only | Changed (P0 issue) |

**API Score: 50%** - 5 of 10 design endpoints are not implemented (upload, statistics, export). URL patterns systematically differ. Response format differs. Permission model is reversed from design intent for action endpoints.

---

## 5. Type Definitions Gap Analysis

### 5.1 Interface Comparison

| Design Interface | Implementation | Status | Notes |
|-----------------|---------------|--------|-------|
| CallSign | Callsign (`src/types/action.ts:37-81`) | Match (Enhanced) | Added airline_id, other_airline_code, file_upload_id, camelCase aliases |
| Action | Action (`src/types/action.ts:87-134`) | Match (Enhanced) | Added callsign_id (replaced callsign_pair), description, review_comment |
| FileUpload | FileUpload (`src/types/action.ts:5-31`) | Match | Minor: uploaded_by is string (UUID), design had email string |
| - | ActionHistory (`src/types/action.ts:140-157`) | Added | Not in design TypeScript types section |
| CreateActionRequest | CreateActionRequest (`src/types/action.ts:162-169`) | Changed | Uses callsign_id instead of callsignPair + airlineCode |
| - | UpdateActionRequest (`src/types/action.ts:171-180`) | Added | Separate type for updates |
| - | ActionListResponse (`src/types/action.ts:185-194`) | Added | Response wrapper type |
| - | CallsignListResponse (`src/types/action.ts:198-206`) | Added | Response wrapper type |
| - | UploadResponse (`src/types/action.ts:211-215`) | Added | Upload response type |
| - | ActionStats (`src/types/action.ts:220-227`) | Added | Dashboard statistics type |
| - | CallsignActionDetail (`src/types/action.ts:232-241`) | Added | Detail view type |

### 5.2 Naming Convention

Implementation uses dual naming (snake_case DB fields + camelCase aliases in same interface), which is non-standard. Design used pure camelCase TypeScript interfaces.

**Type Definitions Score: 90%** - All design interfaces are present with enhancements. Additional types added for API responses. The dual snake_case/camelCase pattern adds complexity but provides flexibility.

---

## 6. React Query Hooks Gap Analysis

### 6.1 Hook Comparison

| Design Hook | Implementation | Status | Notes |
|------------|---------------|--------|-------|
| `useAirlineCallsigns(airlineCode)` | `useAirlineCallsigns(airlineId)` | Changed | Param changed from code to ID |
| `useActions(airlineCode, status?)` | `useAirlineActions(filters?)` | Changed | Different signature, merged admin+user |
| `useCreateAction()` | `useCreateAction()` | Match | Signature differs (airlineId in mutation data) |
| `useAdminStatistics()` | - | Missing | Statistics hook not implemented |
| `useFileUpload()` | - | Missing | File upload hook not implemented |
| `useUploadStatus(uploadId)` | - | Missing | Upload status hook not implemented |
| - | `useCallsigns(filters?)` | Added | General callsign list (not in design) |
| - | `useAction(actionId)` | Added | Single action detail (not in design) |
| - | `useUpdateAction()` | Match | In design as mutation in useActions |
| - | `useDeleteAction()` | Added | Not in design |

### 6.2 Hook API Call Pattern

| Design Pattern | Implementation Pattern | Notes |
|---------------|----------------------|-------|
| `fetch('/api/airline/callsigns')` | `fetch('/api/airlines/${airlineId}/callsigns')` | Different URL |
| `fetch('/api/airline/actions')` | `fetch('/api/actions')` | Different URL, admin-only |
| `fetch('/api/admin/statistics')` | - | Not implemented |
| Uses raw fetch | Uses accessToken from Zustand | Implementation has auth integration |

### 6.3 Query Key & Cache Strategy

| Design staleTime | Implementation staleTime | Notes |
|-----------------|-------------------------|-------|
| 5 min (callsigns) | 30 sec (callsigns) | More aggressive refresh |
| 2 min (actions) | 30 sec (actions) | More aggressive refresh |
| 1 min + refetchInterval (statistics) | - | Not implemented |

**Hooks Score: 65%** - 3 of 6 design hooks missing (statistics, file upload, upload status). Existing hooks have different signatures but functional equivalents. Auth token integration is well-implemented.

---

## 7. Frontend Components Gap Analysis

### 7.1 Airline User Page (`/(main)/airline/page.tsx`)

| Design Component | Implementation | Status | Notes |
|-----------------|---------------|--------|-------|
| TabNav (항공사, 호출부호, 조치) | 2 tabs (incidents, actions) | Partial | No separate "AirlineTab" |
| CallSignFilter | - | Missing | No filter controls |
| CallSignTable | Hardcoded card layout | Critical | Uses INC constant, NOT API data |
| CallSignPagination | - | Missing | Not implemented |
| ActionFilter | Static buttons (non-functional) | Critical | Buttons exist but do nothing |
| ActionTable | Hardcoded HTML table | Critical | 6 rows of static mock data, NOT API data |
| ActionPagination | - | Missing | Not implemented |
| ActionRegistrationModal | Local ActionModal (mock) | Critical | Separate from `src/components/actions/ActionModal.tsx`; only does `console.log('mock')` |
| ActionStatusBadge | Inline styled spans | Partial | Not extracted as component |

**Critical Finding**: The airline user page (`src/app/(main)/airline/page.tsx`) uses **entirely hardcoded mock data** for both callsigns (INC constant, lines 29-40) and actions (static HTML table rows, lines 562-641). The "조치 등록" modal on this page is a local mock function (line 660-898) that does `console.log('조치 저장 (mock)')` and does NOT call any API. It does NOT use the properly implemented `src/components/actions/ActionModal.tsx` component.

### 7.2 Admin Actions Page (`/admin/actions/page.tsx`)

| Design Component | Implementation | Status | Notes |
|-----------------|---------------|--------|-------|
| ActionDashboard (StatCards, Charts) | - | Missing | No statistics dashboard |
| CompletionChart | - | Missing | No chart |
| TimelineGraph | - | Missing | No graph |
| AirlineStatsTable | - | Missing | No stats table |
| ActionFilter | Filter dropdowns (airline, status) | Partial | Works but airline options hardcoded (5 of 9 airlines), uses airline code as value but API expects UUID |
| ActionTable | Data-driven table | Match | Uses API data via useAirlineActions |
| ExportButton | - | Missing | No export feature |
| ActionPagination | Prev/Next buttons | Match | Functional pagination |
| ActionRegistrationModal | ActionModal component | Match | Uses proper `src/components/actions/ActionModal.tsx` |
| StatusBadge | Inline styled spans | Partial | Not extracted as reusable component |

**Critical Finding**: Airline filter dropdown uses hardcoded airline codes as option values (KAL, AAR, JJA, JNA, TWB - only 5 of 9 airlines). The API `GET /api/actions` filters by `airlineId` (UUID), not airline code. This means the filter will NOT work correctly at runtime.

### 7.3 Admin Excel Upload Page

| Design Component | Implementation | Status | Notes |
|-----------------|---------------|--------|-------|
| ExcelUploadTab | - | Missing | Entire tab not implemented |
| FileDropZone | - | Missing | |
| FilePreview | - | Missing | |
| UploadProgressBar | - | Missing | |
| UploadResultReport | - | Missing | |
| UploadHistoryTable | - | Missing | |

### 7.4 Admin Dashboard Integration

| Design Feature | Implementation | Status | Notes |
|---------------|---------------|--------|-------|
| "조치 관리" link on admin dashboard | Link at `/admin/actions` | Match | `src/app/admin/page.tsx:159-164` |

**Frontend Score: 45%** - The airline user page is entirely mock data. Admin actions page has basic list/filter/create but missing dashboard, charts, statistics, export. Excel upload feature is completely absent. Airline filter has a code-vs-UUID mismatch bug.

---

## 8. Missing Features Summary

### 8.1 Missing Features (Design O, Implementation X)

| # | Feature | Design Location | Impact | Priority |
|---|---------|----------------|--------|----------|
| 1 | `POST /api/admin/callsigns/upload` | design.md:389-461 | Excel upload entirely missing | P0 |
| 2 | `GET /api/admin/callsigns/upload/{id}` | design.md:464-481 | Upload status check | P0 |
| 3 | `GET /api/admin/callsigns/upload-history` | design.md:1004 | Upload history | P1 |
| 4 | `GET /api/admin/statistics` | design.md:525-562 | Dashboard statistics | P1 |
| 5 | `GET /api/admin/actions/export` | design.md:566-579 | Excel export | P1 |
| 6 | ExcelUploadTab (entire feature) | design.md:677-683 | Frontend upload UI | P0 |
| 7 | ActionDashboard (StatCards, Charts) | design.md:688-700 | Statistics visualization | P1 |
| 8 | Airline user API-connected data | design.md:281-301 | Airline page uses hardcoded data | P0 |
| 9 | useAdminStatistics hook | design.md:772-779 | Statistics data fetching | P1 |
| 10 | useFileUpload / useUploadStatus hooks | design.md:782-802 | Upload hooks | P0 |
| 11 | User-level action registration | design.md:339-363 | Users can register actions (currently admin-only) | P1 |
| 12 | Date range filter (from/to) | design.md:489-491 | Admin actions date filter | P2 |

### 8.2 Added Features (Design X, Implementation O)

| # | Feature | Implementation Location | Notes |
|---|---------|------------------------|-------|
| 1 | `GET /api/actions/[id]` | `src/app/api/actions/[id]/route.ts:16-110` | Useful action detail endpoint |
| 2 | `DELETE /api/actions/[id]` | `src/app/api/actions/[id]/route.ts:264-319` | Action deletion capability |
| 3 | useAction(actionId) hook | `src/hooks/useActions.ts:168-197` | Single action detail hook |
| 4 | useDeleteAction() hook | `src/hooks/useActions.ts:279-308` | Action deletion hook |
| 5 | useCallsigns() (general) | `src/hooks/useActions.ts:76-114` | Non-airline-specific callsign query |
| 6 | ActionModal edit mode | `src/components/actions/ActionModal.tsx:11-12` | Supports both create and edit |
| 7 | action_history table | `scripts/init.sql:199-214` | Audit trail for action changes |
| 8 | Sample callsign data | `scripts/init.sql:220-249` | 3 KAL callsign records |

### 8.3 Changed Features (Design != Implementation)

| # | Feature | Design | Implementation | Impact |
|---|---------|--------|---------------|--------|
| 1 | API URL pattern | `/api/airline/...` (role-based) | `/api/actions`, `/api/callsigns` (resource-based) | Medium - different routing convention |
| 2 | Response wrapper | `{ callsigns: [...] }` | `{ data: [...] }` | Medium - frontend must adapt |
| 3 | Pagination format | Flat `total, page, pageSize` | Nested `{ pagination: {...} }` | Medium - structural difference |
| 4 | Action permission | User can register own | Admin-only for all CRUD | High - blocks user self-service |
| 5 | Callsign data source | DB API-driven | Hardcoded INC constant (airline page) | Critical - no real data flow |
| 6 | Enum values | English (`'ATC'`, `'HIGH'`) | Korean (`'관제사 오류'`, `'매우높음'`) | Medium - UI consistency |
| 7 | FK references | String-based (email, code) | UUID-based | Low - improvement |
| 8 | staleTime | 5min (callsigns), 2min (actions) | 30sec (both) | Low - more responsive |

---

## 9. Critical Bugs Found

| # | Bug | Location | Description | Severity |
|---|-----|----------|-------------|----------|
| 1 | Airline filter code-vs-UUID mismatch | `src/app/admin/actions/page.tsx:82-87` | Dropdown values are airline codes (KAL, AAR...) but `useAirlineActions` sends as `airlineId` to API which expects UUID | Critical |
| 2 | Missing airlines in filter | `src/app/admin/actions/page.tsx:82-87` | Only 5 of 9 airlines in dropdown (ABL, ASV, EOK, FGW missing) | High |
| 3 | Airline page mock ActionModal | `src/app/(main)/airline/page.tsx:648-898` | Local mock modal (console.log only) shadows imported ActionModal component | Critical |
| 4 | Airlines constant mismatch | `src/app/(main)/airline/page.tsx:8-20` | Uses ESR (old code), not EOK. Also includes ARK, APZ which are not in DB | High |

---

## 10. Architecture Compliance

### 10.1 Layer Structure (Dynamic Level)

| Expected Layer | Actual Location | Status | Notes |
|---------------|----------------|--------|-------|
| Presentation (components) | `src/components/actions/ActionModal.tsx` | Match | Reusable component |
| Presentation (pages) | `src/app/admin/actions/page.tsx` | Match | Admin page |
| Application (hooks) | `src/hooks/useActions.ts` | Match | 7 React Query hooks |
| Domain (types) | `src/types/action.ts` | Match | 11 interfaces |
| Infrastructure (API routes) | `src/app/api/actions/`, `src/app/api/callsigns/` | Match | 5 route files |
| Infrastructure (DB) | `src/lib/db.ts` | Match | pg.Pool query + transaction |

### 10.2 Dependency Direction

| File | Layer | Imports | Status |
|------|-------|---------|--------|
| `ActionModal.tsx` | Presentation | `useActions` (hooks), `action.ts` (types) | Pass |
| `admin/actions/page.tsx` | Presentation | `useActions` (hooks), `ActionModal` (component) | Pass |
| `useActions.ts` | Application | `authStore` (state), `action.ts` (types), `fetch` (API) | Pass |
| `action.ts` | Domain | None | Pass |
| API routes | Infrastructure | `jwt.ts`, `db.ts` | Pass |

### 10.3 Violation

| File | Issue | Severity |
|------|-------|----------|
| `src/app/(main)/airline/page.tsx` | Hardcoded data (INC constant) bypasses all architecture layers | Critical |
| `src/app/admin/actions/page.tsx` | Hardcoded airline options instead of fetching from API/hook | Medium |

**Architecture Score: 70%** - Clean separation where implemented, but airline user page completely bypasses the architecture.

---

## 11. Convention Compliance

### 11.1 Naming Convention

| Category | Convention | Compliance | Violations |
|----------|-----------|:----------:|------------|
| Components | PascalCase | 100% | - |
| Hooks | use* camelCase | 100% | - |
| Types/Interfaces | PascalCase | 100% | - |
| Files (component) | PascalCase.tsx | 100% | - |
| Files (hooks) | camelCase.ts | 100% | - |
| API routes | kebab-case dirs | 100% | - |
| DB columns | snake_case | 100% | - |

### 11.2 Response Format Convention

| Convention | Expected | Actual | Status |
|-----------|----------|--------|--------|
| Success data wrapper | `{ data }` | `{ data }` | Match (actions, callsigns) |
| Error format | `{ error: { code, message } }` | `{ error: string }` | Simplified |
| Pagination | `{ data, pagination }` | `{ data, pagination }` | Match |

### 11.3 Dual Naming in Types

The `src/types/action.ts` interfaces include both snake_case (matching DB) and camelCase (matching JS convention) fields in the same interface. This is unconventional and doubles interface size. Recommendation: Use a single naming convention and transform at the API boundary.

**Convention Score: 80%** - Good naming compliance. Error format simplified from design convention. Dual naming in types is a concern.

---

## 12. Match Rate Calculation

### Category Breakdown

| Category | Weight | Score | Weighted |
|----------|:------:|:-----:|:--------:|
| Database Schema | 20% | 82% | 16.4 |
| API Endpoints | 25% | 50% | 12.5 |
| Type Definitions | 10% | 90% | 9.0 |
| React Query Hooks | 10% | 65% | 6.5 |
| Frontend Components | 25% | 45% | 11.25 |
| Architecture | 5% | 70% | 3.5 |
| Convention | 5% | 80% | 4.0 |
| **Total** | **100%** | - | **63.15%** |

### Overall Match Rate: 63%

```
+-----------------------------------------------+
|  Overall Match Rate: 63%          [Critical]   |
+-----------------------------------------------+
|  Database Schema:       82%  [Warning]         |
|  API Endpoints:         50%  [Critical]        |
|  Type Definitions:      90%  [Pass]            |
|  React Query Hooks:     65%  [Warning]         |
|  Frontend Components:   45%  [Critical]        |
|  Architecture:          70%  [Warning]         |
|  Convention:            80%  [Warning]         |
+-----------------------------------------------+
|  Missing Features:     12 items                |
|  Added Features:        8 items                |
|  Changed Features:      8 items                |
|  Critical Bugs:         4 items                |
+-----------------------------------------------+
```

---

## 13. Recommended Actions

### 13.1 Immediate (P0) - Must Fix

| # | Action | Target Files | Description |
|---|--------|-------------|-------------|
| 1 | Fix airline filter UUID mismatch | `src/app/admin/actions/page.tsx` | Airline dropdown should use airline UUIDs, not codes. Fetch airlines list from API |
| 2 | Connect airline page to API | `src/app/(main)/airline/page.tsx` | Replace INC hardcoded data with useAirlineCallsigns + useAirlineActions hooks |
| 3 | Replace mock ActionModal | `src/app/(main)/airline/page.tsx` | Remove local mock ActionModal (lines 655-898), use `src/components/actions/ActionModal.tsx` |
| 4 | Allow user-level action registration | API permission model | Design specifies users can register actions for their own airline |

### 13.2 Short-term (P1) - Should Fix

| # | Action | Target | Description |
|---|--------|--------|-------------|
| 5 | Implement statistics API | `src/app/api/admin/statistics/route.ts` | Dashboard statistics endpoint |
| 6 | Implement statistics dashboard | `src/app/admin/actions/page.tsx` | Add StatCards, charts, graphs |
| 7 | Implement Excel export | `src/app/api/admin/actions/export/route.ts` | Action history download |
| 8 | Complete airline filter options | `src/app/admin/actions/page.tsx` | All 9 airlines, fetched from API |
| 9 | Implement useAdminStatistics hook | `src/hooks/useActions.ts` | Statistics data hook |

### 13.3 Long-term (P2) - Nice to Have

| # | Action | Target | Description |
|---|--------|--------|-------------|
| 10 | Implement Excel upload | Multiple files | Full callsign upload pipeline |
| 11 | Add date range filter | Admin actions page | Filter by from/to dates |
| 12 | Normalize enum values | DB + frontend | Decide English vs Korean enums |
| 13 | Simplify type interfaces | `src/types/action.ts` | Remove dual snake_case/camelCase |

---

## 14. Design Document Updates Needed

If implementation is accepted as-is, the following design updates are needed:

- [ ] Update API endpoint URLs (`/api/airline/*` -> `/api/actions`, `/api/callsigns`, etc.)
- [ ] Update response format (nested pagination, `data` wrapper)
- [ ] Update permission model documentation (admin-only vs user-accessible)
- [ ] Add `GET /api/actions/[id]` and `DELETE /api/actions/[id]` endpoints
- [ ] Update field references (callsign_pair -> callsign_id, email -> UUID FKs)
- [ ] Document enum value format (Korean vs English)
- [ ] Add action_history table to design TypeScript types section

---

## 15. Synchronization Options

Given the 63% match rate, the following synchronization paths are available:

1. **Modify implementation to match design** - Implement missing 12 features, fix URL patterns, fix permission model
2. **Update design to match implementation** - Document current state as new baseline, defer missing features
3. **Hybrid approach (Recommended)** - Fix P0 bugs immediately, update design for URL/response format changes, implement P1 features incrementally

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-20 | Initial Phase 4 gap analysis | gap-detector |
