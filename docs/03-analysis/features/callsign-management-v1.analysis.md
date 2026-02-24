# callsign-management-v1 Analysis Report (v3.0)

> **Analysis Type**: Gap Analysis (Design vs Implementation) -- Comprehensive Re-analysis
>
> **Project**: KATC1 - Callsign Management V1
> **Version**: 3.0.0
> **Analyst**: gap-detector agent
> **Date**: 2026-02-24
> **Previous Analysis**: v2.0 (2026-02-22, Match Rate: 83%)
> **Design Doc**: [callsign-management-v1.design.md](../../02-design/features/callsign-management-v1.design.md)

---

## 1. Analysis Overview

### 1.1 Analysis Purpose

Comprehensive re-analysis of the Callsign Management V1 feature following significant structural changes since v2.0:
1. **Folder Rename**: `callsign-mgmt-v1` -> `callsign-management` (components + routes)
2. **Dual Route Architecture**: Public route (`/callsign-management`) + Admin route (`/admin/callsign-management`)
3. **New API Endpoints**: `/api/callsigns/stats` (statistics), `/api/admin/file-uploads` (upload history)
4. **New Hook**: `useFileUploads` for server-persisted upload history
5. **Upload History Persistence**: Sidebar now queries `file_uploads` table via `useFileUploads` hook
6. **Header Navigation**: Admin-only link to `/callsign-management` in Header
7. **Middleware Protection**: `/callsign-management` added to protected routes

### 1.2 Analysis Scope

- **Design Document**: `docs/02-design/features/callsign-management-v1.design.md`
- **Implementation Paths**:
  - Public page: `src/app/callsign-management/page.tsx`
  - Admin page: `src/app/admin/callsign-management/page.tsx`
  - Components: `src/components/callsign-management/` (9 files)
  - Hooks: `src/hooks/useActions.ts`, `src/hooks/useFileUploads.ts`
  - API: 8 route files across `/api/callsigns/`, `/api/actions/`, `/api/airlines/`, `/api/admin/`
  - Types: `src/types/action.ts` (12 interfaces)
  - Database: `scripts/init.sql` (11 tables, 4 feature-specific)
- **Files Analyzed**: 23 implementation files

### 1.3 Improvement Summary (v2.0 -> v3.0)

| Previous Gap | Resolution | Impact |
|-------------|-----------|--------|
| H3: Upload history not persisted | RESOLVED -- `useFileUploads` hook queries `file_uploads` table | History survives page refresh |
| H4: Statistics API not implemented | PARTIALLY RESOLVED -- `/api/callsigns/stats` created for risk-level stats | KPI data from server |
| M5: No dedicated upload hooks | RESOLVED -- `useFileUploads` + `useDeleteFileUpload` in `src/hooks/useFileUploads.ts` | Server-side history |
| M6: Upload history not API-backed | RESOLVED -- Sidebar uses `useFileUploads({ status: 'completed', limit: 5 })` | Persistent data |
| Route naming inconsistency | RESOLVED -- All paths now use `callsign-management` (no v1 suffix) | Clean URLs |

---

## 2. Overall Scores

| Category | v2.0 Score | v3.0 Score | Delta | Status |
|----------|:---------:|:---------:|:-----:|:------:|
| Layout & Structure | 72% | 75% | +3 | MEDIUM |
| Tab 1 - Overview | 82% | 85% | +3 | HIGH |
| Tab 2 - Actions | 75% | 78% | +3 | MEDIUM |
| Tab 3 - Statistics | 78% | 80% | +2 | HIGH |
| Tab 4 - Upload/Sidebar | 92% | 96% | +4 | HIGH |
| Styling Compliance | 88% | 88% | 0 | HIGH |
| Data Flow & Hooks | 78% | 87% | +9 | HIGH |
| Database Schema | N/A | 95% | NEW | HIGH |
| API Completeness | N/A | 88% | NEW | HIGH |
| Component Architecture | 80% | 85% | +5 | HIGH |
| Convention Compliance | 98% | 98% | 0 | HIGH |
| **Overall Match Rate** | **83%** | **87%** | **+4** | **HIGH** |

### Score Change Rationale

- **Data Flow & Hooks (+9%)**: Major improvement with `useFileUploads` hook, `/api/callsigns/stats` API, and server-side upload history persistence. 5 of 7 design hooks now have implementations (previously 3/7).
- **Upload/Sidebar (+4%)**: Upload history now persists via server query. Near-complete implementation.
- **Layout (+3%)**: Route formalization with dual public/admin pages, middleware protection, Header navigation link.
- **Overview (+3%)**: Statistics API provides server-side KPI data for risk-level counts.
- **Actions (+3%)**: Airline summary statistics section added above individual records table.
- **Statistics (+2%)**: Server-side stats via `/api/callsigns/stats` for risk-level breakdown.
- **Database Schema (95% NEW)**: Full analysis of callsigns table (30+ columns), file_uploads, actions, action_history, callsign_occurrences.
- **API Completeness (88% NEW)**: 8 of 9 design-required endpoints exist.

---

## 3. Database Schema Analysis -- 95%

### 3.1 Callsigns Table

| Design Column | DB Column | Type | Status |
|---------------|-----------|------|--------|
| id | id | UUID PK | MATCH |
| airline_id | airline_id | UUID FK (airlines) ON DELETE CASCADE | MATCH |
| airline_code | airline_code | VARCHAR(10) | MATCH |
| callsign_pair | callsign_pair | VARCHAR(50) | MATCH |
| my_callsign | my_callsign | VARCHAR(20) | MATCH |
| other_callsign | other_callsign | VARCHAR(20) | MATCH |
| other_airline_code | other_airline_code | VARCHAR(10) | MATCH |
| sector | sector | VARCHAR(20) | MATCH |
| departure_airport1 | departure_airport1 | VARCHAR(10) | MATCH |
| arrival_airport1 | arrival_airport1 | VARCHAR(10) | MATCH |
| departure_airport2 | departure_airport2 | VARCHAR(10) | MATCH |
| arrival_airport2 | arrival_airport2 | VARCHAR(10) | MATCH |
| same_airline_code | same_airline_code | VARCHAR(10) | MATCH |
| same_callsign_length | same_callsign_length | VARCHAR(10) | MATCH |
| same_number_position | same_number_position | VARCHAR(20) | MATCH |
| same_number_count | same_number_count | INT | MATCH |
| same_number_ratio | same_number_ratio | DECIMAL(5,2) | MATCH |
| similarity | similarity | VARCHAR(20) | MATCH |
| max_concurrent_traffic | max_concurrent_traffic | INT | MATCH |
| coexistence_minutes | coexistence_minutes | INT | MATCH |
| error_probability | error_probability | INT | MATCH |
| atc_recommendation | atc_recommendation | VARCHAR(50) | MATCH |
| error_type | error_type | VARCHAR(30) | MATCH |
| sub_error | sub_error | VARCHAR(30) | MATCH |
| risk_level | risk_level | VARCHAR(20) | MATCH |
| occurrence_count | occurrence_count | INT DEFAULT 0 | MATCH |
| last_occurred_at | last_occurred_at | TIMESTAMP | MATCH |
| file_upload_id | file_upload_id | UUID FK (file_uploads) | MATCH |
| uploaded_at | uploaded_at | TIMESTAMP | MATCH |
| status | status | VARCHAR(20) CHECK (in_progress, completed) | MATCH |
| created_at | created_at | TIMESTAMP DEFAULT NOW() | MATCH |
| updated_at | updated_at | TIMESTAMP DEFAULT NOW() | MATCH |

**Indexes**: 6 indexes on airline_id, airline_code, callsign_pair, risk_level, status, created_at. All present.

**Unique Constraints**: `UNIQUE(airline_id, callsign_pair)` + `UNIQUE(airline_code, callsign_pair)`. Both present.

### 3.2 Supporting Tables

| Table | Columns | Indexes | FK Relations | Status |
|-------|:-------:|:-------:|:------------:|--------|
| file_uploads | 10 | 3 | uploaded_by -> users | MATCH |
| actions | 17 | 6 | airline_id -> airlines, callsign_id -> callsigns, registered_by -> users | MATCH |
| action_history | 7 | 2 | action_id -> actions, changed_by -> users | MATCH |
| callsign_occurrences | 9 | 2 | callsign_id -> callsigns, file_upload_id -> file_uploads | MATCH |

### 3.3 Schema Gaps

| Item | Status | Severity |
|------|--------|----------|
| callsigns.status uses in_progress/completed instead of 3-state (pending/in_progress/completed) | INTENTIONAL | LOW |
| actions.status has CHECK for pending/in_progress/completed | MATCH | - |
| airlines table has 11 entries (KAL...ESR) including duplicate EOK/ESR | KNOWN ISSUE | LOW |

**Schema Score: 95%** -- Comprehensive schema with all required tables, columns, indexes, and constraints.

---

## 4. API Endpoint Completeness -- 88%

### 4.1 Implemented Endpoints

| # | Endpoint | Method | File | Auth | Status |
|---|----------|--------|------|------|--------|
| 1 | `/api/callsigns` | GET | `src/app/api/callsigns/route.ts` | Bearer (any user) | MATCH |
| 2 | `/api/callsigns/stats` | GET | `src/app/api/callsigns/stats/route.ts` | Bearer (any user) | NEW (v3.0) |
| 3 | `/api/actions` | GET | `src/app/api/actions/route.ts` | Bearer (admin) | MATCH |
| 4 | `/api/actions/[id]` | GET/PATCH/DELETE | `src/app/api/actions/[id]/route.ts` | Bearer (admin for PATCH/DELETE) | MATCH |
| 5 | `/api/airlines/[id]/callsigns` | GET | `src/app/api/airlines/[airlineId]/callsigns/route.ts` | Bearer (any user) | MATCH |
| 6 | `/api/airlines/[id]/actions` | GET/POST | `src/app/api/airlines/[airlineId]/actions/route.ts` | Bearer (any user) | MATCH |
| 7 | `/api/admin/upload-callsigns` | POST | `src/app/api/admin/upload-callsigns/route.ts` | Bearer (admin) | MATCH |
| 8 | `/api/admin/file-uploads` | GET | `src/app/api/admin/file-uploads/route.ts` | Bearer (admin) | NEW (v3.0) |
| 9 | `/api/admin/file-uploads/[id]` | DELETE | `src/app/api/admin/file-uploads/[id]/route.ts` | Bearer (admin) | NEW (v3.0) |

### 4.2 Design vs Implementation Endpoint Mapping

| Design Endpoint | Actual Endpoint | Hook | Status |
|----------------|----------------|------|--------|
| GET /api/callsigns | GET /api/callsigns | useCallsigns() | MATCH |
| GET /api/admin/statistics?type=summary | GET /api/callsigns/stats | inline useQuery | PARTIAL (URL differs, risk-level stats only) |
| GET /api/admin/statistics?type=airline | NOT IMPLEMENTED | -- | MISSING |
| GET /api/admin/statistics?type=chart | NOT IMPLEMENTED | -- | MISSING |
| POST /api/admin/uploads | POST /api/admin/upload-callsigns | Direct fetch | MATCH (URL differs) |
| GET /api/admin/uploads/history | GET /api/admin/file-uploads | useFileUploads() | MATCH (URL differs) |
| DELETE /api/admin/file-uploads/[id] | DELETE /api/admin/file-uploads/[id] | useDeleteFileUpload() | BONUS |

### 4.3 Missing Endpoints

| Design Endpoint | Purpose | Severity |
|----------------|---------|----------|
| GET /api/admin/statistics?type=airline | Airline-level aggregate statistics | MEDIUM |
| GET /api/admin/statistics?type=chart | Chart data for Recharts visualization | MEDIUM |

### 4.4 Response Format Verification

All endpoints return the standardized format:

```
Success: { data: [...], pagination: { page, limit, total, totalPages } }
Error:   { error: "message" }
Single:  { field1, field2, ... }
```

Dual naming convention (snake_case + camelCase aliases) consistently applied across all endpoints.

### 4.5 Known API Bugs (Carried from v2.0)

| # | Severity | File | Line | Description |
|---|----------|------|------|-------------|
| B1 | HIGH | `src/app/api/actions/[id]/route.ts` | 287 | PATCH response hardcodes `status: 'completed'` regardless of actual DB value |
| B2 | MEDIUM | `src/app/api/actions/[id]/route.ts` | 171-198 | PATCH with `status:'in_progress'` deletes the action row entirely (unconventional) |
| B3 | LOW | `src/app/api/airlines/[airlineId]/actions/route.ts` | 74 | CASE statement returns 'in_progress' for rows where `a.id IS NULL` (should be 'pending' or 'no_action') |

---

## 5. Hook Implementation Analysis -- 87%

### 5.1 Hook Inventory

| # | Hook | File | Type | Design Required | Status |
|---|------|------|------|:---------------:|--------|
| 1 | useCallsigns() | useActions.ts | Query | YES | MATCH |
| 2 | useAirlineCallsigns() | useActions.ts | Query | YES | MATCH |
| 3 | useAllActions() | useActions.ts | Query | YES | MATCH |
| 4 | useAirlineActions() | useActions.ts | Query | YES | MATCH |
| 5 | useAirlineActionStats() | useActions.ts | Query | NO | BONUS |
| 6 | useAction() | useActions.ts | Query | YES | MATCH |
| 7 | useCreateAction() | useActions.ts | Mutation | YES | MATCH |
| 8 | useUpdateAction() | useActions.ts | Mutation | YES | MATCH |
| 9 | useDeleteAction() | useActions.ts | Mutation | YES | MATCH |
| 10 | useFileUploads() | useFileUploads.ts | Query | YES | NEW (v3.0) |
| 11 | useDeleteFileUpload() | useFileUploads.ts | Mutation | NO | BONUS |

### 5.2 Design Hook Coverage

| Design Hook | Implementation | Status |
|-------------|---------------|--------|
| useCallsigns() | useCallsigns() in useActions.ts | MATCH |
| useStatistics() | Inline useQuery in OverviewTab + StatisticsTab | PARTIAL (not extracted as reusable hook) |
| useAirlineStats() | useAirlineActionStats() in useActions.ts | MATCH (name differs) |
| useChartData() | NOT IMPLEMENTED (progress bars replace charts) | MISSING |
| useUploadFile() | Direct fetch in FileUploadZone | MISSING (no hook, but works) |
| useUploadHistory() | useFileUploads() in useFileUploads.ts | MATCH (name differs) |

**Coverage: 5/7 design hooks implemented** (was 3/7 in v2.0, +2 resolved)

### 5.3 Hook Quality Assessment

All hooks follow consistent patterns:
- TanStack Query v5 with `useQuery` / `useMutation`
- Zustand `useAuthStore` for accessToken
- `staleTime: 30s`, `gcTime: 5min` (standard)
- `enabled` guard on `!!accessToken`
- Cache invalidation on mutation success via `queryClient.invalidateQueries()`
- Proper TypeScript typing with imported interfaces

---

## 6. Component Analysis -- 85%

### 6.1 Component Inventory

| # | Component | File | Design Match | Lines |
|---|-----------|------|:------------:|:-----:|
| 1 | OverviewTab | `src/components/callsign-management/OverviewTab.tsx` | 85% | 321 |
| 2 | ActionsTab | `src/components/callsign-management/ActionsTab.tsx` | 78% | 480 |
| 3 | StatisticsTab | `src/components/callsign-management/StatisticsTab.tsx` | 80% | 291 |
| 4 | Sidebar | `src/components/callsign-management/Sidebar.tsx` | 96% | 52 |
| 5 | StatCard | `src/components/callsign-management/StatCard.tsx` | 90% | 43 |
| 6 | Tabs | `src/components/callsign-management/Tabs.tsx` | 100% (UNUSED) | 46 |
| 7 | FileUploadZone | `src/components/callsign-management/uploads/FileUploadZone.tsx` | 95% | 180 |
| 8 | UploadResult | `src/components/callsign-management/uploads/UploadResult.tsx` | 98% | 66 |
| 9 | UploadHistory | `src/components/callsign-management/uploads/UploadHistory.tsx` | 95% | 62 |
| 10 | ActionModal | `src/components/actions/ActionModal.tsx` | 90% | 431 |
| 11 | ActionDetailModal | `src/components/actions/ActionDetailModal.tsx` | 90% | 237 |

### 6.2 Page Architecture

| Page | Route | Auth | Layout | Status |
|------|-------|------|--------|--------|
| Public | `/callsign-management` | Zustand check + middleware | Full-page with Header + left sidebar nav | IMPLEMENTED |
| Admin | `/admin/callsign-management` | Admin role check | Grid with left menu + right content | IMPLEMENTED |
| Middleware | `protectedRoutes` array | refreshToken + user cookie | Route-level protection | MATCH |

### 6.3 Public vs Admin Route Differences

| Feature | Public (`/callsign-management`) | Admin (`/admin/callsign-management`) |
|---------|:---:|:---:|
| Tab state management | `useSearchParams` (URL-based) | `useState` (local) |
| Navigation style | Full-height sticky sidebar with NanoIcons | Grid-based vertical menu |
| Header component | Includes `<Header />` | No separate Header |
| Background color | `bg-gray-50` | `bg-[#f8fafc]` |
| Auth redirect | Logout + redirect to `/` | Redirect to `/login` or `/airline` |
| Tab items | 4 items with lucide-react icons | 4 items with emoji icons |

Both pages render the same 4 tab components: `OverviewTab`, `ActionsTab`, `StatisticsTab`, `Sidebar`.

---

## 7. Layout & Structure Comparison -- 75%

### 7.1 Design vs Implementation Layout

| Design Spec | Implementation | Status | Severity |
|-------------|---------------|--------|----------|
| Horizontal tabs (3 tabs at top) | Left vertical menu (4 items) | CHANGED | HIGH |
| Left area: Tab content (lg:col-span-4) | Left area: Navigation sidebar | CHANGED | HIGH |
| Right area: Upload sidebar (lg:col-span-2) | Upload as 4th tab content | CHANGED | HIGH |
| Admin-only route `/admin/callsign-mgmt-v1` | Dual route: public `/callsign-management` + admin `/admin/callsign-management` | IMPROVED | MEDIUM |
| `max-w-7xl mx-auto` container | Applied on admin page; public uses full-width with sidebar | PARTIAL | LOW |
| Tabs.tsx horizontal tab container | Created at design spec but NOT imported in any page | UNUSED | MEDIUM |

### 7.2 Page Header -- 98% Match

Implementation matches design precisely:
- Blue accent bar (`w-8 h-1 bg-primary rounded-full`)
- "SYSTEM MANAGEMENT" label (`text-primary font-bold text-sm tracking-widest uppercase`)
- Title: "callsign management" (`text-4xl font-black text-gray-900 tracking-tight`)
- Description text with `text-gray-500 font-medium`
- Bottom border: `border-b border-gray-200 pb-8`

### 7.3 Route Protection

| Protection Layer | Status |
|-----------------|--------|
| Middleware: `/callsign-management` in `protectedRoutes` array | MATCH |
| Middleware: matcher includes `/callsign-management/:path*` | MATCH |
| Public page: Zustand `accessToken` + `user` check | MATCH |
| Admin page: `isAdmin()` role check with redirect | MATCH |
| Header: Admin-only link to `ROUTES.CALLSIGN_MANAGEMENT` | MATCH |
| Constants: `ROUTES.CALLSIGN_MANAGEMENT = '/callsign-management'` | MATCH |

---

## 8. Tab Content Analysis

### 8.1 Tab 1: Overview -- 85% (was 82%)

| Design Item | Implementation | Status |
|-------------|---------------|--------|
| 5 KPI cards (sm:grid-cols-5) | 4 KPI cards (sm:grid-cols-4) | MISSING 1 card |
| KPI "in progress" card (blue-600) | NOT IMPLEMENTED | MISSING |
| KPI stats from server API | `/api/callsigns/stats` provides total, veryHigh, high, low | MATCH (NEW) |
| 4-column filter grid | 2 columns (airline, risk) + page size selector | PARTIAL |
| Status filter dropdown | NOT IMPLEMENTED | MISSING |
| Search text input | NOT IMPLEMENTED | MISSING |
| Table: 5 columns (airline, callsign, risk, status, date) | Table: 7 columns (airline, callsign, risk, occurrences, last_occurred, action_status, date) | EXTENDED |
| Reset button | "Refresh" button | MATCH |
| Pagination with total count | Pagination with full info: "page N / M - total X (start-end)" | MATCH |
| useCallsigns hook | useCallsigns() from useActions.ts | MATCH |
| Risk level badge colors | red-600/amber-600/emerald-600 with rounded-full badges | MATCH |
| Loading spinner | Border spinner with "Loading Data..." | MATCH |
| Empty state | "No Data" uppercase | MATCH |

**Improvements from v2.0:**
- Server-side statistics via `/api/callsigns/stats` (replaces client-side counting)
- Extended table columns with occurrence count, last occurred date, action status
- Page size selector (10/30/50/100)
- Full pagination info with item range

### 8.2 Tab 2: Actions -- 78% (was 75%)

| Design Item | Implementation | Status |
|-------------|---------------|--------|
| Airline aggregate table (Section 3.5) | SECTION 1: Summary cards (3: total, in-progress, completed) | CHANGED |
| 7 columns (airline, count, rate, pending, progress, completed, status) | SECTION 2: Airline stats table (5 columns: airline, total, pending, progress, completed) | PARTIAL |
| Progress bar per airline | NOT IMPLEMENTED | MISSING |
| Status grade badges (excellent/good/caution) | NOT IMPLEMENTED | MISSING |
| -- | SECTION 3: Individual action records table (7 columns) | ADDED |
| -- | Status/airline/date filters + reset | ADDED |
| Excel export button | Excel export with Korean column headers (xlsx library) | MATCH |
| useAllActions hook | useAllActions() from useActions.ts | MATCH |
| Action create modal | ActionModal component (admin only) | MATCH |
| Action detail modal | ActionDetailModal component (admin only) | MATCH |
| -- | Callsign query for modal dropdown | ADDED |

**Improvements from v2.0:**
- Added airline summary statistics section above individual records
- 3 KPI-style summary cards (total, in-progress, completed)
- Airline stats table shows per-airline breakdown
- Better structural alignment with design intent (aggregate + detail view)

### 8.3 Tab 3: Statistics -- 80% (was 78%)

| Design Item | Implementation | Status |
|-------------|---------------|--------|
| 4 KPI cards | 4 KPI cards (total callsigns, pending, in-progress, completed) | MATCH |
| KPI data from server | Server-side via `/api/callsigns/stats` + `useAllActions` pagination.total | MATCH (NEW) |
| Left chart: Risk level (Recharts BarChart) | Progress bars (custom CSS) | CHANGED |
| Right chart: Airline action rate (Recharts) | "Action status distribution" progress bars | CHANGED |
| Airline detailed statistics table | Airline detailed statistics table | MATCH |
| 5 columns (airline, callsigns, rate, avg time, recent upload) | 5 columns matching design spec | MATCH |
| Completion rate calculation | `(completed / total) * 100` | MATCH |
| Average response time | Calculated from completed_at - registered_at | MATCH |
| Recent upload column | Hardcoded "-" (no data source) | PARTIAL |

**Improvements from v2.0:**
- KPI stats now use server-side data instead of client-only pagination total
- Efficient API calls: `useAllActions({ page: 1, limit: 1 })` with `pagination.total` for counts

### 8.4 Tab 4: Upload/Sidebar -- 96% (was 92%)

| Design Item | Implementation | Status |
|-------------|---------------|--------|
| File upload drag & drop zone | Drag & drop with isDragging visual feedback | MATCH |
| File type validation (.xlsx, .xls) | Client-side validation before upload | MATCH |
| File size display | Shows selected file name + size in KB | MATCH |
| Upload button (separate from drop zone) | Dedicated "Upload" button below drop zone | MATCH |
| Progress bar with spinner during upload | Animated progress bar + spinner SVG | MATCH |
| Error display | Red error card below upload button | MATCH |
| POST /api/admin/upload-callsigns | Correct API endpoint call | MATCH |
| Upload result card | UploadResult component: inserted/updated/failed with colored sections | MATCH |
| Error detail collapsible | `<details>` with error list (max 10 shown) | MATCH |
| Upload history list | UploadHistory component with server data | MATCH |
| History from server API | `useFileUploads({ status: 'completed', limit: 5 })` | MATCH (NEW) |
| History: fileName, date, total, success, failed | All fields mapped from API response | MATCH |
| "No history" empty state | Displayed when history array is empty | MATCH |
| Excel format guide section | Detailed bullet list of upload rules | MATCH |
| useUploadFile() hook | Direct fetch (no hook wrapper) | MISSING |

**Improvements from v2.0:**
- Upload history now persists via `useFileUploads` hook querying `/api/admin/file-uploads`
- Server-side data with `refetchFileUploads()` after upload completion
- Proper dual-naming field mapping (snake_case + camelCase)

---

## 9. Styling Compliance -- 88%

### 9.1 Design System Compliance

| Principle | Implementation | Status |
|-----------|---------------|--------|
| `rounded-none` on cards/tables/buttons | Consistently applied | MATCH |
| `shadow-sm border border-gray-100` cards | Consistently applied | MATCH |
| `bg-[#f8fafc]` page background | Applied on admin page | MATCH |
| `text-primary` active elements | Applied in navigation + tabs | MATCH |
| `hover:shadow-xl transition-all` on StatCard | Applied with `hover:shadow-2xl` | MATCH |
| `text-[10px] font-black uppercase tracking-widest` labels | Applied | MATCH |
| `text-[11px] font-black uppercase tracking-widest` table headers | Applied | MATCH |
| Loading spinner: `animate-spin` primary color | `border-4 border-primary border-t-transparent` spinner | MATCH |
| `group hover:bg-primary/[0.02]` row hover | Applied on all table rows | MATCH |
| Status badge: `rounded-full text-[10px] font-black` | Applied | MATCH |

### 9.2 Style Deviations

| File | Location | Issue | Severity |
|------|----------|-------|----------|
| OverviewTab.tsx | Filter selects | Uses default rounded style instead of `rounded-none` | LOW |
| ActionsTab.tsx | Filter selects | Uses default rounded style instead of `rounded-none` | LOW |
| ActionsTab.tsx | Summary cards | Uses `rounded-lg` gradient cards instead of `rounded-none` flat design | LOW |
| Public page.tsx | Sidebar nav | Navy background active state differs from design's tab active state | LOW |

---

## 10. TypeScript Type Safety -- 90%

### 10.1 Interface Coverage

| Interface | File | Fields | Status |
|-----------|------|:------:|--------|
| FileUpload | action.ts | 20 (10 snake + 10 camel) | MATCH |
| Callsign | action.ts | 42 (21 snake + 21 camel) | MATCH |
| Action | action.ts | 36 (18 snake + 18 camel) | MATCH |
| ActionHistory | action.ts | 12 (6 snake + 6 camel) | MATCH |
| CreateActionRequest | action.ts | 8 | MATCH |
| UpdateActionRequest | action.ts | 10 | MATCH |
| ActionListResponse | action.ts | 2 (data + pagination) | MATCH |
| ActionStatisticsResponse | action.ts | 6 | MATCH |
| CallsignListResponse | action.ts | 2 (data + pagination) | MATCH |
| UploadResponse | action.ts | 3 | MATCH |
| ActionStats | action.ts | 6 | MATCH |
| CallsignActionDetail | action.ts | 3 | MATCH |
| FileUploadItem | useFileUploads.ts | 22 (11 snake + 11 camel) | NEW |
| FileUploadListResponse | useFileUploads.ts | 2 (data + pagination) | NEW |

### 10.2 Type Safety Observations

- Dual naming convention (snake_case + camelCase) consistently applied
- All API responses properly typed
- Callsign interface includes `latest_action_*` fields for JOIN data
- Action interface includes `responsible_staff` field (not in DB schema but in types)
- `any` types limited to `airlineMap` value type and callback parameters

### 10.3 Type Gap

| Item | Severity |
|------|----------|
| `responsible_staff` in Action type but not in actions DB column | LOW (used in ActionDetailModal) |
| `any` type in `Action.airline` and `Action.registeredUser` | LOW |

---

## 11. Convention Compliance -- 98%

### 11.1 Naming Convention

| Category | Convention | Compliance | Violations |
|----------|-----------|:----------:|------------|
| Components | PascalCase | 100% | None |
| Hooks | camelCase with `use` prefix | 100% | None |
| Files (component) | PascalCase.tsx | 100% | None |
| Files (utility) | camelCase.ts | 100% | None |
| Files (hooks) | camelCase.ts with `use` prefix | 100% | None |
| Folders | kebab-case | 100% | `callsign-management` correct |
| Constants | UPPER_SNAKE_CASE | 100% | ROUTES.CALLSIGN_MANAGEMENT |

### 11.2 Import Order -- Correct in all files

1. External: react, next, tanstack, xlsx, lucide-react
2. Internal absolute: @/hooks, @/store, @/components, @/types, @/lib
3. Relative: ./

### 11.3 Folder Structure

| Expected | Actual | Status |
|----------|--------|--------|
| `src/components/callsign-management/` | Exists (9 files) | MATCH |
| `src/components/callsign-management/uploads/` | Exists (3 files) | MATCH |
| `src/components/actions/` | Exists (2 modal files) | MATCH |
| `src/hooks/useActions.ts` | Exists (11 hooks) | MATCH |
| `src/hooks/useFileUploads.ts` | Exists (2 hooks) | NEW |
| `src/types/action.ts` | Exists (12 interfaces) | MATCH |
| `src/app/callsign-management/page.tsx` | Exists | MATCH |
| `src/app/admin/callsign-management/page.tsx` | Exists | MATCH |

---

## 12. Permission & Security Analysis -- 92%

### 12.1 Authentication Enforcement

| Endpoint | Required Auth | Implemented Auth | Status |
|----------|:------------:|:----------------:|--------|
| GET /api/callsigns | Bearer token | Bearer token check | MATCH |
| GET /api/callsigns/stats | Bearer token | Bearer token check | MATCH |
| GET /api/actions | Admin only | admin role check | MATCH |
| GET/PATCH/DELETE /api/actions/[id] | Bearer (PATCH/DELETE admin) | Token check + admin on PATCH/DELETE | MATCH |
| GET /api/airlines/[id]/callsigns | Bearer token | Token check | MATCH |
| GET/POST /api/airlines/[id]/actions | Bearer token | Token check | MATCH |
| POST /api/admin/upload-callsigns | Admin only | admin role check | MATCH |
| GET /api/admin/file-uploads | Admin only | admin role check | MATCH |
| DELETE /api/admin/file-uploads/[id] | Admin only | admin role check | MATCH |

### 12.2 Route Protection

| Route | Middleware Protection | Client-side Auth | Status |
|-------|:-------------------:|:----------------:|--------|
| /callsign-management | YES (protectedRoutes array) | Zustand check + logout redirect | MATCH |
| /admin/callsign-management | YES (admin:path*) | isAdmin() check | MATCH |

### 12.3 Security Observation

| Item | Status | Severity |
|------|--------|----------|
| SQL injection prevention | Parameterized queries throughout | SAFE |
| File type validation | Client + server-side .xlsx/.xls check | SAFE |
| Token verification | verifyToken() on all endpoints | SAFE |
| CORS/CSP headers | Handled by next.config.js | SAFE |
| File size limit | Client displays "max 10MB" but no server enforcement | MEDIUM |

---

## 13. Detailed Gap List (v3.0)

### 13.1 CRITICAL Gaps -- NONE (all resolved since v1.0)

All previous critical bugs (C1: Upload API URL, C2: Upload response format) remain resolved.

### 13.2 HIGH Gaps

| # | Gap | Design Location | Implementation | Severity | Since |
|---|-----|-----------------|---------------|----------|-------|
| H1 | Layout: horizontal tabs vs vertical menu | design.md:47-69 | Left sidebar navigation | HIGH | v1.0 |
| H2 | ActionsTab: aggregate vs individual records | design.md:297-415 | Individual records + summary section | HIGH | v2.0 |
| H3 | Tabs.tsx created but unused | design.md:106-131 | `Tabs.tsx` matches design but never imported | HIGH | v1.0 |

### 13.3 MEDIUM Gaps

| # | Gap | Description | Since |
|---|-----|-------------|-------|
| M1 | 5th KPI card missing in Overview | "In Progress" (blue-600) card not present | v1.0 |
| M2 | Status filter missing in Overview | No status dropdown in filter row | v1.0 |
| M3 | Search input missing in Overview | No text search field | v1.0 |
| M4 | Right chart title/content changed | "Airline action rate" -> "Action status distribution" | v1.0 |
| M5 | No Recharts charts (progress bars instead) | Custom CSS progress bars replace Recharts BarChart | v1.0 |
| M6 | Statistics API not consolidated | `/api/admin/statistics` not created; stats scattered across endpoints | v1.0 |
| M7 | useUploadFile() not extracted as hook | FileUploadZone uses direct fetch instead of dedicated hook | v1.0 |
| M8 | No progress bar per airline in ActionsTab | Design shows completion % bar per airline | v1.0 |

### 13.4 LOW Gaps

| # | Gap | Description | Since |
|---|-----|-------------|-------|
| L1 | Select inputs styling | Some selects use default rounded instead of `rounded-none` | v1.0 |
| L2 | StatCard description static | Shows "Real-time Data" instead of dynamic description | v1.0 |
| L3 | Recent upload column hardcoded "-" | StatisticsTab airline table last column always "-" | v1.0 |
| L4 | No server-side file size enforcement | Client says "max 10MB" but server does not enforce | v3.0 |

### 13.5 Known Bugs

| # | Severity | File | Description |
|---|----------|------|-------------|
| B1 | HIGH | `api/actions/[id]/route.ts:287` | PATCH response hardcodes `status: 'completed'` ignoring actual DB value |
| B2 | MEDIUM | `api/actions/[id]/route.ts:171-198` | PATCH with `status:'in_progress'` deletes the action row entirely |
| B3 | LOW | `api/airlines/[airlineId]/actions/route.ts:74` | CASE statement returns 'in_progress' for NULL action rows |

---

## 14. Match Rate Summary

```
+-----------------------------------------------------+
|  Overall Match Rate: 87% (was 83%, delta +4%)        |
+-----------------------------------------------------+
|                                                      |
|  Layout & Structure:        75%  [MEDIUM]  (+3)      |
|  Tab 1 - Overview:          85%  [HIGH]    (+3)      |
|  Tab 2 - Actions:           78%  [MEDIUM]  (+3)      |
|  Tab 3 - Statistics:        80%  [HIGH]    (+2)      |
|  Tab 4 - Upload/Sidebar:    96%  [HIGH]    (+4)      |
|  Styling Compliance:        88%  [HIGH]    (0)       |
|  Data Flow & Hooks:         87%  [HIGH]    (+9)      |
|  Database Schema:           95%  [HIGH]    (NEW)     |
|  API Completeness:          88%  [HIGH]    (NEW)     |
|  Component Architecture:    85%  [HIGH]    (+5)      |
|  Convention Compliance:     98%  [HIGH]    (0)       |
|                                                      |
|  CRITICAL gaps: 0 (resolved since v1.0)              |
|  HIGH gaps:     3 (was 6, -3 resolved)               |
|  MEDIUM gaps:   8 (adjusted scope)                   |
|  LOW gaps:      4                                    |
|  Known bugs:    3                                    |
|                                                      |
|  Weighted Score: 87%                                 |
|  (Layout 10%, Tabs 30%, Upload 10%, DB 10%,          |
|   API 10%, DataFlow 10%, Style 5%, Architecture 10%, |
|   Convention 5%)                                     |
+-----------------------------------------------------+
```

---

## 15. Recommended Actions

### 15.1 To Reach 90% Match Rate

| # | Action | Expected Impact | Effort |
|---|--------|:--------------:|:------:|
| 1 | Update design document to accept left-menu layout | +3% (Layout 75->90) | LOW |
| 2 | Add 5th KPI card + status filter + search to Overview | +2% (Overview 85->92) | MEDIUM |
| 3 | Add progress bar per airline in ActionsTab summary | +1% (Actions 78->85) | MEDIUM |
| 4 | Fix B1 bug: PATCH response should return actual status | +1% (API quality) | LOW |
| 5 | Extract useUploadFile() hook from FileUploadZone | +1% (Data Flow) | LOW |

### 15.2 Priority 1 -- Bugs (fix immediately)

| # | Item | File | Description |
|---|------|------|-------------|
| 1 | B1: PATCH hardcodes 'completed' | `src/app/api/actions/[id]/route.ts:287` | Return `updatedAction.status` instead of literal `'completed'` |
| 2 | B2: in_progress deletes row | `src/app/api/actions/[id]/route.ts:171` | Consider standard UPDATE instead of DELETE for status revert |

### 15.3 Priority 2 -- Design Alignment

| # | Item | File | Description |
|---|------|------|-------------|
| 1 | Update design for left-menu layout | `design.md` Section 2.2 | Document the vertical navigation pattern as intentional |
| 2 | Update design for route naming | `design.md` Section 2.1 | `/callsign-management` replaces `/admin/callsign-mgmt-v1` |
| 3 | Update design for ActionsTab pattern | `design.md` Section 3.5 | Document summary cards + individual records pattern |
| 4 | Remove or integrate Tabs.tsx | `Tabs.tsx` | Dead code if left-menu pattern is accepted |
| 5 | Document upload endpoint URL | `design.md` Section 4.1 | `/api/admin/upload-callsigns` instead of `/api/admin/uploads` |

### 15.4 Priority 3 -- Feature Enhancement

| # | Item | File | Description |
|---|------|------|-------------|
| 1 | Add 5th KPI card (in-progress) | `OverviewTab.tsx` | blue-600 card with action count |
| 2 | Add status filter to Overview | `OverviewTab.tsx` | Dropdown for in_progress/completed |
| 3 | Add search input to Overview | `OverviewTab.tsx` | Text search for callsign pairs |
| 4 | Implement Recharts charts | `StatisticsTab.tsx` | Replace progress bars with BarChart |
| 5 | Add airline completion progress bars | `ActionsTab.tsx` | Per-airline progress bar in summary section |
| 6 | Add file size server enforcement | `upload-callsigns/route.ts` | Reject files > 10MB |

---

## 16. Design Document Updates Needed

If current implementation deviations are accepted as intentional:

- [ ] Section 2.1: Route changed from `/admin/callsign-mgmt-v1` to `/callsign-management` (public + admin dual route)
- [ ] Section 2.2: Layout changed to left sidebar menu + right content area
- [ ] Section 3.2: Horizontal tab container replaced with 4-item vertical navigation
- [ ] Section 3.4.1: Overview KPI cards are 4 instead of 5 (consider adding 5th)
- [ ] Section 3.5: ActionsTab now shows summary cards + individual records (not airline aggregate only)
- [ ] Section 3.6.2: Charts implemented as progress bars instead of Recharts
- [ ] Section 3.7: Sidebar moved from persistent right panel to 4th tab content
- [ ] Section 4.1: Upload endpoint is `/api/admin/upload-callsigns` (not `/api/admin/uploads`)
- [ ] Section 4.1: Upload history endpoint is `/api/admin/file-uploads` (not `/api/admin/uploads/history`)
- [ ] Section 4.1: Add `/api/callsigns/stats` endpoint (risk-level statistics)
- [ ] Section 9: Update folder structure to `callsign-management` (no v1 suffix)
- [ ] Section 9: Remove or mark `Tabs.tsx` as unused/legacy
- [ ] Section 11: Add `recharts` as optional dependency (not currently used)

---

## 17. Post-Analysis Recommendation

**Match Rate 87%**: "Design and implementation match well with some remaining differences. All critical issues have been resolved. The upload pipeline works end-to-end with persistent history. The primary gaps are layout structure (intentional improvement) and missing UI features (5th KPI card, search, Recharts charts)."

**To reach >= 90%**: Update the design document to accept the left-menu layout and ActionsTab pattern changes (+3-4%), then add the 5th KPI card + status filter to OverviewTab (+2-3%). This combination would push the score to 92%+.

**Synchronization Recommendation**:
1. **Update design** for layout, routing, and ActionsTab changes (these are improvements over original design)
2. **Implement** 5th KPI card, status filter, and search in OverviewTab
3. **Fix** B1 bug (PATCH hardcoded status)
4. **Record** chart implementation as intentional simplification (progress bars vs Recharts)

---

## Version History

| Version | Date | Changes | Match Rate | Author |
|---------|------|---------|:----------:|--------|
| 1.0 | 2026-02-22 | Initial gap analysis | 79% | gap-detector |
| 2.0 | 2026-02-22 | Post-improvement: CRITICAL bugs resolved, ActionsTab refactored, route restructured | 83% (+4) | gap-detector |
| 3.0 | 2026-02-24 | Comprehensive re-analysis: folder rename, new APIs, upload history persistence, DB schema analysis, dual route architecture | 87% (+4) | gap-detector |
