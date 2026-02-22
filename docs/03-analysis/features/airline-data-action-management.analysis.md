# airline-data-action-management Analysis Report

> **Analysis Type**: Gap Analysis (Design vs Implementation)
>
> **Project**: KATC1 - 항공사 유사호출부호 경고시스템
> **Version**: Phase 4+ (callsign-management 통합, v2.0)
> **Analyst**: gap-detector
> **Date**: 2026-02-22
> **Design Doc**: [airline-data-action-management.design.md](../../02-design/features/airline-data-action-management.design.md)

---

## 1. Analysis Overview

### 1.1 Analysis Purpose

Phase 4 설계 문서(airline-data-action-management.design.md)와 현재 실제 구현 코드 간의 일치도를 재검증한다. v1.0 분석(2026-02-20, 63%) 이후 상당한 구현 진전이 있었으므로 전체 재평가를 수행한다.

### 1.2 Analysis Scope

- **Design Document**: `docs/02-design/features/airline-data-action-management.design.md`
- **Implementation Files**:
  - DB: `scripts/init.sql` (Phase 4 section: lines 96-286)
  - Types: `src/types/action.ts` (265 lines, 11+ interfaces)
  - Hooks: `src/hooks/useActions.ts` (451 lines, 10 hooks)
  - API Routes:
    - `src/app/api/actions/route.ts` (GET admin actions)
    - `src/app/api/actions/[id]/route.ts` (GET/PATCH/DELETE)
    - `src/app/api/callsigns/route.ts` (GET global callsigns)
    - `src/app/api/airlines/[airlineId]/actions/route.ts` (GET/POST)
    - `src/app/api/airlines/[airlineId]/callsigns/route.ts` (GET)
    - `src/app/api/airlines/[airlineId]/actions/stats/route.ts` (GET stats)
    - `src/app/api/admin/upload-callsigns/route.ts` (POST upload)
  - Components:
    - `src/components/callsign-management/` (9 files)
    - `src/components/actions/ActionModal.tsx`, `ActionDetailModal.tsx`
  - Pages:
    - `src/app/callsign-management/page.tsx` (public)
    - `src/app/admin/callsign-management/page.tsx` (admin)
    - `src/app/admin/actions/page.tsx` (admin actions)
    - `src/app/dashboard/page.tsx` (user dashboard)
- **Analysis Date**: 2026-02-22

### 1.3 Changes Since v1.0 (2026-02-20)

Major implementation progress since last analysis:
- Excel upload API fully implemented (`/api/admin/upload-callsigns`)
- callsign-management dedicated pages with 4-tab layout created
- Upload UI components (FileUploadZone, UploadResult, UploadHistory)
- Per-airline statistics API implemented
- ActionDetailModal for edit/view
- Dashboard page with real API data connections
- Admin actions page now uses useAirlines() hook (UUID fix)
- callsign_occurrences table added for per-date tracking

---

## 2. Overall Scores

| Category | v1.0 Score | v2.0 Score | Change | Status |
|----------|:---------:|:---------:|:------:|:------:|
| Database Schema | 82% | 85% | +3 | Warning |
| API Endpoints | 50% | 68% | +18 | Warning |
| Type Definitions | 90% | 88% | -2 | Warning |
| React Query Hooks | 65% | 72% | +7 | Warning |
| Frontend Components | 45% | 70% | +25 | Warning |
| Architecture | 70% | 78% | +8 | Warning |
| Convention | 80% | 82% | +2 | Warning |
| **Overall** | **63%** | **75%** | **+12** | **Warning** |

Score Legend: 90%+ = Pass, 70-89% = Warning, <70% = Fail

---

## 3. Database Schema Gap Analysis

### 3.1 Table Comparison

| Design Table | Implementation | Status | Notes |
|-------------|---------------|--------|-------|
| callsigns | `init.sql:122-161` | Enhanced | +airline_id UUID FK, +other_airline_code, +file_upload_id, +uploaded_at, +status column |
| actions | `init.sql:198-225` | Enhanced | airline_code->airline_id FK, callsign_pair->callsign_id FK, +description, +review_comment |
| file_uploads | `init.sql:100-116` | Modified | uploaded_by: VARCHAR->UUID FK |
| action_history | `init.sql:234-250` | Match | Structure matches design |
| - | callsign_occurrences (`init.sql:170-196`) | Added | Per-date occurrence tracking (not in design) |

### 3.2 Enum Value Shift (Intentional)

| Design Value | Implementation Value |
|-------------|---------------------|
| `VERY_HIGH` / `HIGH` / `LOW` | `매우높음` / `높음` / `낮음` |
| `ATC` / `PILOT` / `NONE` | `관제사 오류` / `조종사 오류` / `오류 미발생` |

### 3.3 FK Strategy Improvement

Design used string references (airline_code, email). Implementation uses UUID FKs with ON DELETE CASCADE/SET NULL. This is a structural improvement over the design.

**DB Schema Score: 85%** -- Core schema solid. All design tables implemented with improvements. callsign_occurrences table added (not in design but valuable). Enum value format shifted EN->KR.

---

## 4. API Endpoints Gap Analysis

### 4.1 Endpoint Comparison

| # | Design Endpoint | Implementation | Status | Notes |
|---|----------------|---------------|--------|-------|
| 1 | `GET /api/airline/callsigns` | `GET /api/airlines/[airlineId]/callsigns` | Changed | Resource-based path |
| 2 | `GET /api/airline/actions` | `GET /api/airlines/[airlineId]/actions` | Changed | Resource-based path |
| 3 | `POST /api/airline/actions` | `POST /api/airlines/[airlineId]/actions` | Changed | Resource-based path |
| 4 | `PATCH /api/airline/actions/{id}` | `PATCH /api/actions/[id]` | Changed | Root actions path |
| 5 | `POST /api/admin/callsigns/upload` | `POST /api/admin/upload-callsigns` | Implemented | Different URL, synchronous |
| 6 | `GET /api/admin/callsigns/upload/{id}` | - | Missing | Upload status polling not implemented |
| 7 | `GET /api/admin/callsigns/upload-history` | - | Missing | No upload history API |
| 8 | `GET /api/admin/actions` | `GET /api/actions` | Changed | Admin-only via auth check |
| 9 | `GET /api/admin/statistics` | `GET /api/airlines/[airlineId]/actions/stats` | Changed | Per-airline instead of global |
| 10 | `GET /api/admin/actions/export` | - | Missing | Server-side export not implemented |
| - | `GET /api/callsigns` | Added | Global callsign list |
| - | `GET /api/actions/[id]` | Added | Action detail |
| - | `DELETE /api/actions/[id]` | Added | Action deletion |

### 4.2 URL Pattern Shift

- **Design**: Role-based paths (`/api/airline/`, `/api/admin/`)
- **Implementation**: Resource-based paths (`/api/callsigns`, `/api/actions`, `/api/airlines/[id]/...`)
- **Assessment**: Resource-based is better REST practice. Design should be updated.

### 4.3 Response Format Comparison

| Aspect | Design | Implementation | Status |
|--------|--------|---------------|--------|
| Data wrapper | `{ callsigns: [...] }` | `{ data: [...] }` | Changed (generic) |
| Pagination | Flat: `total, page, pageSize` | Nested: `{ pagination: { page, limit, total, totalPages } }` | Changed (more structured) |
| Upload response | `{ uploadId, status: "processing" }` (202) | `{ success, total, inserted, updated }` (200) | Changed (synchronous) |
| Error format | `{ error: { code, message } }` | `{ error: "message" }` | Simplified |

### 4.4 v1.0 -> v2.0 Improvement

- **Fixed**: Excel upload now implemented at `/api/admin/upload-callsigns`
- **Fixed**: Admin airline filter now uses `useAirlines()` hook with UUID values
- **Added**: Per-airline statistics at `/api/airlines/[airlineId]/actions/stats`
- **Still Missing**: Upload status polling (design specified async), upload history API, server-side export

**API Endpoints Score: 68%** -- 7/10 design endpoints exist (in different paths). 3 still missing (upload status, upload history, server-side export). Excel upload implemented but with different behavior (sync vs async).

---

## 5. Type Definitions Gap Analysis

### 5.1 Interface Comparison

| Design Interface | Impl Interface | Status | Location |
|-----------------|---------------|--------|----------|
| CallSign | Callsign | Match | action.ts:37-81 |
| Action | Action | Match | action.ts:87-136 |
| FileUpload | FileUpload | Match | action.ts:5-31 |
| CreateActionRequest | CreateActionRequest | Match | action.ts:164-173 |
| - | UpdateActionRequest | Added | action.ts:175-186 |
| - | ActionHistory | Added | action.ts:142-159 |
| - | ActionListResponse | Added | action.ts:191-199 |
| - | ActionStatisticsResponse | Added | action.ts:201-216 |
| - | CallsignListResponse | Added | action.ts:221-229 |
| - | UploadResponse | Added | action.ts:234-238 |
| - | ActionStats | Added | action.ts:243-250 |
| - | CallsignActionDetail | Added | action.ts:255-264 |

All design interfaces implemented. 8 additional interfaces added for API responses and detailed views. Dual snake_case/camelCase naming pattern used consistently.

**Types Score: 88%** -- All design types present with enhancements. Score slightly lower due to dual naming pattern complexity.

---

## 6. React Query Hooks Gap Analysis

### 6.1 Hook Comparison

| Design Hook | Impl Hook | Status | Location |
|------------|----------|--------|----------|
| `useAirlineCallsigns(airlineCode)` | `useAirlineCallsigns(airlineId, filters)` | Changed | useActions.ts:190 |
| `useActions(airlineCode, status?)` | `useAirlineActions(filters)` | Changed | useActions.ts:86 |
| `useCreateAction()` | `useCreateAction()` | Match | useActions.ts:320 |
| `useAdminStatistics()` | - | Missing | Not implemented as global hook |
| `useFileUpload()` | - | Missing | Inline fetch in components |
| `useUploadStatus(uploadId)` | - | Missing | Not applicable (sync upload) |
| - | `useAllActions(filters, options)` | Added | useActions.ts:27 |
| - | `useCallsigns(filters)` | Added | useActions.ts:145 |
| - | `useAirlineActionStats(airlineId, filters)` | Added | useActions.ts:239 |
| - | `useAction(actionId)` | Added | useActions.ts:286 |
| - | `useUpdateAction()` | Added | useActions.ts:366 |
| - | `useDeleteAction()` | Added | useActions.ts:413 |

### 6.2 Design vs Implementation Hook Architecture

- Design specifies direct `fetch()` calls in hooks. Implementation adds `accessToken` from Zustand authStore for auth.
- Design uses `staleTime: 5min / 2min`. Implementation uses `staleTime: 30s` (more responsive).
- 6 additional hooks beyond design, 3 design hooks not implemented (but 2 are covered differently).

**Hooks Score: 72%** -- 3/6 design hooks implemented (with changes). 3 missing (global stats, file upload, upload status). 6 useful additional hooks added.

---

## 7. Frontend Components Gap Analysis

### 7.1 Callsign Management Pages (NEW since v1.0)

| Design Component | Implementation | Status | Location |
|-----------------|---------------|--------|----------|
| CallSignTab > CallSignFilter | OverviewTab.tsx: airline + risk_level filters | Match | OverviewTab.tsx:78-108 |
| CallSignTab > CallSignTable | OverviewTab.tsx: table with airline, pair, risk, date | Match | OverviewTab.tsx:112-161 |
| CallSignTab > CallSignPagination | OverviewTab.tsx: prev/next pagination | Match | OverviewTab.tsx:168-189 |
| ActionHistoryTab > ActionFilter | ActionsTab.tsx: status filter | Partial | ActionsTab.tsx:83-107 |
| ActionHistoryTab > ActionTable | ActionsTab.tsx: 6-column table | Match | ActionsTab.tsx:110-170 |
| ActionHistoryTab > ExportButton | ActionsTab.tsx: Excel export button | Match | ActionsTab.tsx:184-189 |
| ActionRegistrationModal | ActionModal.tsx | Match | components/actions/ActionModal.tsx |
| - | ActionDetailModal.tsx | Added | components/actions/ActionDetailModal.tsx |
| ActionStatusBadge | Inline styled badges | Partial | Not separate component |

### 7.2 Admin Dashboard Components

| Design Component | Implementation | Status | Location |
|-----------------|---------------|--------|----------|
| StatCard (x4) | StatCard.tsx | Match | callsign-management/StatCard.tsx |
| CompletionChart | Progress bars (no Recharts) | Changed | StatisticsTab.tsx:88-193 |
| TimelineGraph | - | Missing | Not implemented |
| AirlineStatsTable | StatisticsTab airline table | Match | StatisticsTab.tsx:197-251 |
| ActionFilter (admin) | admin/actions/page.tsx filters | Match | admin/actions/page.tsx:72-164 |
| ActionTable (admin) | admin/actions/page.tsx table | Match | admin/actions/page.tsx:216-296 |
| ExportButton (admin) | Inline Excel export | Match | admin/actions/page.tsx:176-196 |
| ActionPagination | Prev/Next buttons | Match | admin/actions/page.tsx:299-322 |

### 7.3 Upload Components (NEW since v1.0)

| Design Component | Implementation | Status | Location |
|-----------------|---------------|--------|----------|
| FileDropZone | FileUploadZone.tsx | Match | uploads/FileUploadZone.tsx |
| FilePreview | - | Missing | No preview before upload |
| UploadProgressBar | Progress bar in FileUploadZone | Match | FileUploadZone.tsx:107-129 |
| UploadResultReport | UploadResult.tsx | Match | uploads/UploadResult.tsx |
| UploadHistoryTable | UploadHistory.tsx (client-side only) | Partial | uploads/UploadHistory.tsx |

### 7.4 Dashboard Page (NEW since v1.0)

| Feature | Status | Location |
|---------|--------|----------|
| Callsign list with filters | Match | dashboard/page.tsx:335-529 |
| Action history with status tabs | Match | dashboard/page.tsx:532-870 |
| Excel upload interface | Match | dashboard/page.tsx:873-990 |
| Action summary cards (3) | Match | dashboard/page.tsx:538-549 |
| Admin airline summary table | Match | dashboard/page.tsx:553-593 |
| ActionDetailModal integration | Match | dashboard/page.tsx:993-1001 |

### 7.5 Layout Architecture Shift

| Design Layout | Implementation Layout |
|-------------|---------------------|
| Horizontal tabs within `/airline` and `/admin` | Vertical left sidebar in dedicated pages |
| Airline page: `/(main)/airline` | User dashboard: `/dashboard` + `/callsign-management` |
| Admin page: tabs in `/admin` | Separate pages: `/admin/actions`, `/admin/callsign-management` |

### 7.6 v1.0 Critical Issues Resolution

| v1.0 Issue | v2.0 Status |
|-----------|------------|
| Airline page entirely hardcoded mock data | PARTIALLY RESOLVED -- dashboard/page.tsx uses API, but `/airline` page still has legacy mock |
| Admin airline filter code-vs-UUID mismatch | RESOLVED -- admin/actions/page.tsx now uses useAirlines() hook |
| Mock ActionModal on airline page | RESOLVED -- ActionDetailModal + ActionModal properly used |
| Missing upload feature | RESOLVED -- FileUploadZone + upload-callsigns API |

**Frontend Score: 70%** -- Major progress from v1.0 (45%). All core components implemented. Missing: TimelineGraph, FilePreview. Changed: horizontal tabs -> sidebar layout. Upload history client-side only.

---

## 8. Architecture Compliance

### 8.1 Layer Structure (Dynamic Level)

| Expected Layer | Actual Location | Status |
|---------------|----------------|--------|
| Presentation (Components) | `src/components/callsign-management/`, `src/components/actions/` | Match |
| Presentation (Pages) | `src/app/callsign-management/`, `src/app/admin/`, `src/app/dashboard/` | Match |
| Application (Hooks) | `src/hooks/useActions.ts` (10 hooks) | Match |
| Domain (Types) | `src/types/action.ts` (12 interfaces) | Match |
| Infrastructure (API) | `src/app/api/actions/`, `src/app/api/callsigns/`, `src/app/api/airlines/` | Match |
| Infrastructure (DB) | `src/lib/db.ts` (pg.Pool query + transaction) | Match |

### 8.2 Dependency Violations

| File | Issue | Severity |
|------|-------|----------|
| `dashboard/page.tsx:139` | Direct `fetch('/api/admin/upload-callsigns')` bypassing hooks | Medium |
| `uploads/FileUploadZone.tsx:48` | Direct `fetch('/api/admin/upload-callsigns')` bypassing hooks | Medium |
| `uploads/UploadHistory.tsx` | Client-side only (in-memory state, no API persistence) | Low |

**Architecture Score: 78%** -- Clean layer separation for actions/callsigns flows. Upload flow bypasses hook layer with direct fetch. Improved from v1.0 (70%) with airline page now using hooks.

---

## 9. Convention Compliance

### 9.1 Naming Convention

| Category | Convention | Compliance | Violations |
|----------|-----------|:----------:|------------|
| Components | PascalCase | 100% | None |
| Functions/Hooks | camelCase | 100% | None |
| Constants | UPPER_SNAKE_CASE | 100% | None |
| Files (component) | PascalCase.tsx | 100% | None |
| Files (hooks) | camelCase.ts | 100% | None |
| Folders | kebab-case | 100% | `callsign-management` correct |
| DB columns | snake_case | 100% | None |

### 9.2 Import Order (sampled across 10 files)

- [x] External libraries first (react, next, tanstack, xlsx, lucide-react)
- [x] Internal absolute imports second (`@/...`)
- [x] Relative imports third (`./...`)
- [x] Type imports where applicable

### 9.3 Error Response Format

| Standard | Implementation | Status |
|----------|---------------|--------|
| `{ error: { code, message, details? } }` | `{ error: "message" }` | Simplified |

Error response uses simplified string format throughout. Consistent but not matching Phase 4 standard.

**Convention Score: 82%** -- Naming and structure excellent. Error format simplified from standard. Dual snake_case/camelCase in API responses adds size but provides flexibility.

---

## 10. Differences Summary

### 10.1 Missing Features (Design O, Implementation X) -- 6 items

| Priority | Item | Design Location | Description |
|:--------:|------|-----------------|-------------|
| HIGH | Upload Status Polling API | design.md:464-481 | `GET /api/admin/callsigns/upload/{uploadId}` |
| HIGH | Upload History API | design.md:1004 | `GET /api/admin/callsigns/upload-history` |
| MEDIUM | Server-side Excel Export | design.md:566-579 | `GET /api/admin/actions/export` |
| MEDIUM | Global Admin Statistics | design.md:524-561 | `GET /api/admin/statistics` (cross-airline) |
| LOW | Timeline Graph | design.md:669 | TimelineGraph chart component |
| LOW | File Preview | design.md:679 | FilePreview before upload |

### 10.2 Added Features (Design X, Implementation O) -- 13 items

| Item | Location | Description |
|------|----------|-------------|
| callsign_occurrences table | `init.sql:170-196` | Per-date occurrence tracking |
| `GET /api/callsigns` | `api/callsigns/route.ts` | Global callsign list |
| `GET /api/actions/[id]` | `api/actions/[id]/route.ts` | Action detail endpoint |
| `DELETE /api/actions/[id]` | `api/actions/[id]/route.ts` | Action deletion |
| `GET /api/airlines/[id]/actions/stats` | `api/airlines/[airlineId]/actions/stats/route.ts` | Per-airline statistics |
| ActionDetailModal | `components/actions/ActionDetailModal.tsx` | Action detail/edit modal |
| Dashboard page | `app/dashboard/page.tsx` | User dashboard with 3 tabs |
| callsign-management pages | `app/callsign-management/` | Dedicated management UI |
| useAllActions hook | `hooks/useActions.ts:27` | Admin all-actions query |
| useAirlineActionStats hook | `hooks/useActions.ts:239` | Per-airline stats |
| useAction hook | `hooks/useActions.ts:286` | Action detail query |
| useUpdateAction hook | `hooks/useActions.ts:366` | Action update mutation |
| useDeleteAction hook | `hooks/useActions.ts:413` | Action delete mutation |

### 10.3 Changed Features (Design != Implementation) -- 11 items

| Item | Design | Implementation | Impact |
|------|--------|----------------|--------|
| URL Pattern | `/api/airline/*`, `/api/admin/*` | `/api/callsigns`, `/api/actions`, `/api/airlines/[id]/*` | Medium |
| Response wrapper | `{ callsigns: [...] }` | `{ data: [...], pagination }` | Low |
| Upload behavior | Async (202 + polling) | Synchronous (200) | Medium |
| Risk level values | `VERY_HIGH`, `HIGH`, `LOW` | `매우높음`, `높음`, `낮음` | Medium |
| Error type values | `ATC`, `PILOT`, `NONE` | `관제사 오류`, `조종사 오류`, `오류 미발생` | Medium |
| FK strategy | airline_code VARCHAR | airline_id UUID FK | Low (improvement) |
| Page layout | Horizontal tabs in existing pages | Vertical sidebar in new pages | Medium |
| Statistics | Global `/api/admin/statistics` | Per-airline `/api/airlines/[id]/actions/stats` | Medium |
| Error response | `{ error: { code, message } }` | `{ error: "message" }` | Low |
| Auth in callsign query | `airlineCode` param | `airlineId` path param | Low |
| Upload history | Server-side API | Client-side in-memory array | High |

---

## 11. Bugs Found

| # | Severity | Location | Description |
|---|----------|----------|-------------|
| 1 | HIGH | `api/actions/[id]/route.ts:287` | PATCH response hardcodes `status: 'completed'` regardless of actual DB value (`updatedAction.status` is available but overridden) |
| 2 | MEDIUM | `uploads/UploadHistory.tsx` + `Sidebar.tsx:19-33` | Upload history is client-side only (in-memory useState), lost on page refresh/navigation |
| 3 | MEDIUM | `api/actions/[id]/route.ts:171-198` | PATCH with `status: 'in_progress'` deletes the action row entirely and reverts callsign status; unconventional behavior for a PATCH |
| 4 | LOW | `api/airlines/[airlineId]/actions/route.ts:74` | CASE expression returns `'in_progress'` for NULL action rows, but design specifies 3 statuses including `'pending'` |

---

## 12. Match Rate Calculation

### Weighted Score Breakdown

| Category | Weight | Score | Weighted |
|----------|:------:|:-----:|:--------:|
| Database Schema | 15% | 85% | 12.75 |
| API Endpoints | 25% | 68% | 17.00 |
| Type Definitions | 10% | 88% | 8.80 |
| React Query Hooks | 15% | 72% | 10.80 |
| Frontend Components | 20% | 70% | 14.00 |
| Architecture | 10% | 78% | 7.80 |
| Convention | 5% | 82% | 4.10 |
| **Total** | **100%** | | **75.25%** |

```
+---------------------------------------------------+
|  Overall Match Rate: 75%              [Warning]    |
+---------------------------------------------------+
|  Database Schema:       85%  [Warning]             |
|  API Endpoints:         68%  [Warning]             |
|  Type Definitions:      88%  [Warning]             |
|  React Query Hooks:     72%  [Warning]             |
|  Frontend Components:   70%  [Warning]             |
|  Architecture:          78%  [Warning]             |
|  Convention:            82%  [Warning]             |
+---------------------------------------------------+
|  Missing Features:      6 items (down from 12)     |
|  Added Features:       13 items (up from 8)        |
|  Changed Features:     11 items (up from 8)        |
|  Bugs:                  4 items                    |
+---------------------------------------------------+
|  Improvement from v1.0: +12 percentage points      |
+---------------------------------------------------+
```

---

## 13. Recommended Actions

### 13.1 Immediate (P0) -- Bug Fixes

| # | Action | Target File | Description |
|---|--------|-------------|-------------|
| 1 | Fix PATCH status hardcoding | `src/app/api/actions/[id]/route.ts:287` | Return `updatedAction.status` instead of hardcoded `'completed'` |
| 2 | Implement upload history API | New: `src/app/api/admin/upload-history/route.ts` | Query file_uploads table for server-persisted history |

### 13.2 Short-term (P1)

| # | Action | Target | Description |
|---|--------|--------|-------------|
| 3 | Add useFileUpload hook | `src/hooks/useActions.ts` | Wrap upload fetch in TanStack mutation for consistency |
| 4 | Add global statistics API | New: `src/app/api/admin/statistics/route.ts` | Aggregate stats across all airlines |
| 5 | Add server-side export | New: `src/app/api/admin/actions/export/route.ts` | Server-generated Excel download |

### 13.3 Design Document Updates Needed

| # | Item | Description |
|---|------|-------------|
| 1 | URL patterns | Update all API paths to resource-based pattern |
| 2 | Response format | Update to `{ data, pagination }` generic format |
| 3 | Enum values | Update risk_level/error_type to Korean values |
| 4 | FK strategy | Update to UUID FK references |
| 5 | callsign_occurrences | Add new table to design |
| 6 | Page routing | Update to reflect `/callsign-management` routes |
| 7 | Additional endpoints | Add GET /api/callsigns, GET/DELETE /api/actions/[id] |
| 8 | Upload behavior | Document synchronous upload behavior |

---

## 14. Synchronization Recommendation

Based on 75% match rate (up from 63%):

**1. Modify implementation to match design (3 items):**
- Implement upload history API (design requirement, file_uploads data in DB)
- Fix PATCH response status hardcoding (bug)
- Add useFileUpload hook (architecture consistency)

**2. Update design to match implementation (8 items):**
- URL patterns (resource-based is better REST)
- Response format (generic `{ data, pagination }` is consistent)
- Enum values (Korean matches UI)
- FK strategy (UUID FK is better practice)
- callsign_occurrences table (valid addition)
- Page routing and layout (sidebar is functional)
- Additional endpoints (useful additions)
- Synchronous upload behavior

**3. Intentional differences to document:**
- Layout change from horizontal tabs to vertical sidebar (UX decision)
- Per-airline stats vs global stats (implementation covers the use case)

---

## 15. Progress Tracking (v1.0 -> v2.0)

### v1.0 P0 Issues Resolution

| v1.0 P0 Issue | v2.0 Status |
|---------------|------------|
| Airline filter UUID mismatch | RESOLVED -- uses useAirlines() hook |
| Airline page hardcoded data | PARTIALLY RESOLVED -- dashboard uses API, legacy /airline page still mock |
| Mock ActionModal on airline page | RESOLVED -- ActionDetailModal + ActionModal properly used |
| User-level action registration | PARTIALLY RESOLVED -- admin can create for any airline, user dashboard shows data |

### v1.0 P1 Issues Resolution

| v1.0 P1 Issue | v2.0 Status |
|---------------|------------|
| Statistics API | PARTIALLY RESOLVED -- per-airline stats exist, no global stats |
| Statistics dashboard | RESOLVED -- StatisticsTab with KPI cards and progress bars |
| Excel export | PARTIALLY RESOLVED -- client-side export (xlsx), no server-side endpoint |
| All 9 airlines in filter | RESOLVED -- uses useAirlines() hook |
| useAdminStatistics hook | RESOLVED -- useAirlineActionStats implemented |

### v1.0 P2 Issues Resolution

| v1.0 P2 Issue | v2.0 Status |
|---------------|------------|
| Excel upload | RESOLVED -- upload-callsigns API + FileUploadZone UI |
| Date range filter | RESOLVED -- dateFrom/dateTo filters on all relevant APIs |
| Normalize enum values | DOCUMENTED -- Korean values are intentional |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-20 | Initial Phase 4 gap analysis (63% match rate) | gap-detector |
| 2.0 | 2026-02-22 | Full re-analysis after major implementation progress (75% match rate, +12%) | gap-detector |
