# callsign-management-v1 Analysis Report (v2.0)

> **Analysis Type**: Gap Analysis (Design vs Implementation) -- Post-Improvement Re-analysis
>
> **Project**: KATC1 - Callsign Management V1
> **Version**: 2.0.0
> **Analyst**: gap-detector agent
> **Date**: 2026-02-22
> **Previous Analysis**: v1.0 (2026-02-22, Match Rate: 79%)
> **Design Doc**: [callsign-management-v1.design.md](../../02-design/features/callsign-management-v1.design.md)

---

## 1. Analysis Overview

### 1.1 Analysis Purpose

Re-analyze the Callsign Management V1 feature after the following improvements were applied:
1. **CRITICAL Bug Fix**: Upload API endpoint corrected from `/api/admin/uploads` to `/api/admin/upload-callsigns`
2. **CRITICAL Bug Fix**: Upload response format aligned (`UploadResultData` now uses `inserted`, `updated`, `failed`)
3. **ActionsTab Refactored**: Changed from aggregate airline statistics to actual action records with filtering, pagination, and Excel export
4. **Layout Stability**: `force-dynamic` export added, route redirect from `/admin/callsign-mgmt-v1` to `/callsign-mgmt-v1`

### 1.2 Analysis Scope

- **Design Document**: `docs/02-design/features/callsign-management-v1.design.md`
- **Implementation Path**: `src/app/callsign-mgmt-v1/page.tsx` + `src/components/callsign-mgmt-v1/`
- **Previous Analysis**: `docs/03-analysis/features/callsign-management-v1.analysis.md` (v1.0)
- **Files Analyzed**: 13 implementation files

### 1.3 Improvement Summary (v1.0 -> v2.0)

| Previous Gap | Resolution | Impact |
|-------------|-----------|--------|
| C1: Upload API URL mismatch | RESOLVED -- FileUploadZone now calls `/api/admin/upload-callsigns` | Upload functional |
| C2: Upload response format mismatch | RESOLVED -- UploadResultData interface matches API: `{success, inserted, updated, failed}` | Results display correctly |
| Sidebar response mapping | RESOLVED -- `handleUploadComplete` maps `inserted` to `successCount` properly | History displays correctly |
| ActionsTab content mismatch | REFACTORED -- Now shows actual action records instead of aggregate airline stats | Major functional improvement |
| Prerendering errors | RESOLVED -- `force-dynamic` export added to both page.tsx files | Build stability |

---

## 2. Overall Scores

| Category | v1.0 Score | v2.0 Score | Delta | Status |
|----------|:---------:|:---------:|:-----:|:------:|
| Layout & Structure | 70% | 72% | +2 | MEDIUM |
| Tab 1 - Overview | 82% | 82% | 0 | MEDIUM |
| Tab 2 - Actions | 90% | 75% | -15 | MEDIUM |
| Tab 3 - Statistics | 78% | 78% | 0 | MEDIUM |
| Tab 4 - Upload/Sidebar | 80% | 92% | +12 | HIGH |
| Styling Compliance | 88% | 88% | 0 | HIGH |
| Data Flow & Hooks | 72% | 78% | +6 | MEDIUM |
| Component Architecture | 75% | 80% | +5 | MEDIUM |
| Convention Compliance | 98% | 98% | 0 | HIGH |
| **Overall Match Rate** | **79%** | **83%** | **+4** | **MEDIUM** |

### Score Change Rationale

- **Tab 2 Actions (-15%)**: The previous ActionsTab (v1.0) was an airline aggregate statistics view closely matching the design's Section 3.5. The refactored ActionsTab now shows individual action records (closer to admin/actions page pattern), which deviates more from the design spec's airline-level summary table. However, this is arguably a functional improvement since it provides more granular data.
- **Upload/Sidebar (+12%)**: Both CRITICAL bugs resolved. Upload pipeline now works end-to-end correctly.
- **Data Flow (+6%)**: Sidebar now correctly maps API response fields.
- **Architecture (+5%)**: Route restructuring with `force-dynamic` and redirect improves stability.

---

## 3. CRITICAL Bug Verification

### 3.1 C1: Upload API Endpoint -- RESOLVED

**Previous**: `FileUploadZone.tsx` called `/api/admin/uploads` (404 error)
**Current**: `FileUploadZone.tsx:46` calls `/api/admin/upload-callsigns`

```typescript
// src/components/callsign-mgmt-v1/uploads/FileUploadZone.tsx:46
const res = await fetch('/api/admin/upload-callsigns', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
  body: formData,
});
```

**Verification**: The API route exists at `src/app/api/admin/upload-callsigns/route.ts` and handles POST requests. Endpoint match confirmed.

### 3.2 C2: Upload Response Format -- RESOLVED

**Previous**: `UploadResult` expected `{success_count, updated_count, failed_count}`, API returned `{inserted, updated, failed}`
**Current**: `UploadResult` interface aligned with API response

```typescript
// src/components/callsign-mgmt-v1/uploads/UploadResult.tsx:2-9
interface UploadResultProps {
  result: {
    success: boolean;
    total: number;
    inserted: number;  // matches API
    updated: number;   // matches API
    failed: number;    // matches API
    errors?: string[];
  };
}
```

**API Response** (`upload-callsigns/route.ts:311-317`):
```typescript
return NextResponse.json({
  success: true,
  total: rows.length,
  inserted: insertedCount,
  updated: updatedCount,
  failed: errors.length,
  errors: errors.slice(0, 10),
});
```

**Verification**: Field names match exactly. Display renders `result.inserted`, `result.updated`, `result.failed` correctly.

### 3.3 Sidebar Response Mapping -- RESOLVED

```typescript
// src/components/callsign-mgmt-v1/Sidebar.tsx:8-15
interface UploadResultData {
  success: boolean;
  total: number;
  inserted: number;
  updated: number;
  failed: number;
  errors?: string[];
}
```

The `handleUploadComplete` callback at line 21-33 correctly maps `result.inserted` to `successCount` and `result.failed` to `failedCount` for history display. The type interface chain is now consistent from API -> Sidebar -> UploadResult -> UploadHistory.

---

## 4. ActionsTab Refactoring Analysis

### 4.1 Design vs New Implementation

The design document Section 3.5 specifies an **airline-level aggregate view** with:
- 7 columns: airline, callsign count, action rate (progress bar), pending, in-progress, completed, status badge
- Data grouped by airline with completion percentages
- Status color coding per airline (excellent/good/caution)

The refactored ActionsTab now shows **individual action records** with:
- 6 columns: airline, callsign, action type, manager, status, registration date
- Per-action row display with status filtering and pagination
- Excel export of individual action records

| Design Spec (Section 3.5) | New Implementation | Status |
|---------------------------|-------------------|--------|
| Airline aggregate table (grouped by airline) | Individual action records table | CHANGED |
| 7 columns (airline, callsigns, rate, pending, in-progress, completed, status) | 6 columns (airline, callsign, type, manager, status, date) | CHANGED |
| Progress bar per airline (% completion) | Status badges per action | CHANGED |
| Status labels: excellent/good/caution | Status labels: pending/in-progress/completed | CHANGED |
| Section header: "airline action status" | Section header: "airline action status" | MATCH |
| Excel export button | Excel export button | MATCH |
| `useAllActions` + `useAirlines` hooks | `useAllActions` + `useAirlines` hooks | MATCH |
| No status filter | Status filter dropdown added | ADDED |
| No pagination | Pagination added | ADDED |
| Reset button in footer | Reset button in filter section | MOVED |
| bg-gray-50/30 footer styling | bg-gray-50/30 footer styling | MATCH |

### 4.2 ActionsTab Quality Assessment

Positive changes:
- Status filtering with state-controlled dropdown
- Pagination with disabled state handling
- Excel export with proper Korean column headers
- Loading spinner with design-consistent styling
- Empty state handling ("No Data")
- Proper `useMemo` for airlineMap and actions data

Negative changes relative to design:
- Loses airline-level aggregation view (the design's primary intent for this tab)
- No progress bar visualization
- No completion rate calculation per airline
- No status grade badges (excellent/good/caution)

### 4.3 ActionsTab Verdict

The refactored ActionsTab is **functionally solid** and provides valuable per-action data access, but it **diverges from the design intent**. The design envisioned this tab as an airline-level dashboard showing aggregate completion metrics. The current implementation is more akin to a filtered action list view.

**Recommendation**: Either update the design document to match the new action records pattern, or consider restoring the airline aggregate view as originally designed and moving the action records to a sub-view or modal. Score adjusted to 75% (down from 90%) due to the conceptual shift away from design intent.

---

## 5. Layout & Structure Comparison

### 5.1 Route Architecture (NEW finding)

| Design | Implementation | Status |
|--------|---------------|--------|
| `/admin/callsign-mgmt-v1` (admin-only) | `/callsign-mgmt-v1` (public with auth) | CHANGED |
| N/A | `/admin/callsign-mgmt-v1` redirects to `/callsign-mgmt-v1` | ADDED |
| Admin layout (AdminSidebar) | AppShell layout (via public layout.tsx) | CHANGED |
| `ROUTES.ADMIN_CALLSIGN_MGT_V1` | `ROUTES.CALLSIGN_MGT_V1 = '/callsign-mgmt-v1'` | CHANGED |

The page has been moved from admin-only routing to a public route (still authenticated via `useAuthStore`). The Header link navigates admins to `/callsign-mgmt-v1`. The admin path `/admin/callsign-mgmt-v1` now contains a redirect page. This is an intentional restructuring.

### 5.2 Page Structure (unchanged from v1.0)

| Design | Implementation | Status | Severity |
|--------|---------------|--------|----------|
| Horizontal tabs (top bar with 3 tabs) | Left sidebar menu (4 vertical buttons) | CHANGED | HIGH |
| Left area: Tabs container (lg:col-span-4) | Left area: Menu sidebar (md:col-span-1) | CHANGED | HIGH |
| Right area: Sidebar/Upload (lg:col-span-2) | Right area: Tab content (md:col-span-3) | CHANGED | HIGH |
| 3 tabs: overview, actions, stats | 4 menu items: overview, actions, stats, upload | CHANGED | MEDIUM |
| Upload in persistent right sidebar | Upload as 4th tab content | CHANGED | MEDIUM |

### 5.3 Page Header -- Near-perfect match

| Design | Implementation | Status |
|--------|---------------|--------|
| Blue bar + "SYSTEM MANAGEMENT" text | Blue bar + "SYSTEM MANAGEMENT" text | MATCH |
| h1: "callsign management V1" | h1: "callsign management V1" | MATCH |
| Description text | Description text | MATCH |
| `border-b border-gray-200 pb-8` | `border-b border-gray-200 pb-8 mb-8` | MATCH |

**Score**: 98%

### 5.4 Tabs.tsx -- Still Unused

`/Users/sein/Desktop/katc1/src/components/callsign-mgmt-v1/Tabs.tsx` implements the exact design-spec horizontal tab pattern with 3 tabs (overview, actions, stats), active state `border-b-2 border-primary text-primary`, and inactive state `border-transparent text-gray-500 hover:text-gray-900`. However, `page.tsx` continues to not import or use it.

---

## 6. Tab Content Comparison

### 6.1 Tab 1: Overview -- Unchanged (82%)

| Design Item | Implementation | Status | Severity |
|-------------|---------------|--------|----------|
| 5 KPI cards (sm:grid-cols-5) | 4 KPI cards (sm:grid-cols-4) | MISSING | MEDIUM |
| Card: "in progress" (blue-600) | NOT IMPLEMENTED | MISSING | MEDIUM |
| 4-column filter grid (airline, risk, status, search) | 2-column filter (airline, risk) | MISSING | MEDIUM |
| Status filter dropdown | NOT IMPLEMENTED | MISSING | MEDIUM |
| Search input | NOT IMPLEMENTED | MISSING | MEDIUM |
| Table: 5 columns with "status" column | Table: 4 columns (no status) | MISSING | HIGH |
| Pagination with total count | Pagination without total | PARTIAL | LOW |
| Reset button | Reset button | MATCH | - |
| useCallsigns hook | useCallsigns hook | MATCH | - |
| Risk level badges | Risk level badges | MATCH | - |
| Select styling: rounded-none | Select styling: rounded-lg | DEVIATION | LOW |

### 6.2 Tab 2: Actions -- Refactored (75%)

See Section 4 above for detailed comparison. Key deviation: design expects airline-aggregate table, implementation provides individual action records.

**What matches design:**
- Section header text
- Excel export functionality (XLSX library)
- bg-gray-50/30 styling on header/footer
- Data hook usage (useAllActions, useAirlines)
- Table header styling (text-[11px] font-black text-gray-400 uppercase tracking-widest)
- Row hover (hover:bg-primary/[0.02])

**What diverges:**
- Table structure (individual records vs airline aggregate)
- No progress bar per airline
- No status grade badges (excellent/good/caution)
- Added status filter (not in design)
- Added pagination (not in design for this tab)

### 6.3 Tab 3: Statistics -- Unchanged (78%)

| Design Item | Implementation | Status | Severity |
|-------------|---------------|--------|----------|
| 4 KPI cards | 4 KPI cards | MATCH | - |
| Left chart: "risk level status" (Recharts) | Progress bars (custom) | CHANGED | MEDIUM |
| Right chart: "airline action rate" | "action status distribution" | CHANGED | MEDIUM |
| Airline detailed statistics table | Airline detailed statistics table | MATCH | - |
| 5 table columns matching design | 5 table columns | MATCH | - |
| Avg response time calculation | Avg response time calculation | MATCH | - |
| Recent upload column | Hardcoded "-" | PARTIAL | LOW |
| Statistics API endpoint | Client-side calculation | CHANGED | MEDIUM |

### 6.4 Tab 4: Upload/Sidebar -- Improved (92%, was 80%)

| Design Item | Implementation | Status | Severity |
|-------------|---------------|--------|----------|
| File upload drag & drop | File upload drag & drop | MATCH | - |
| File type validation (.xlsx, .xls) | File type validation | MATCH | - |
| Upload progress bar with spinner | Upload progress bar with spinner | MATCH | - |
| POST /api/admin/upload-callsigns | POST /api/admin/upload-callsigns | MATCH (FIXED) | - |
| Upload result card (inserted/updated/failed) | Upload result card (inserted/updated/failed) | MATCH (FIXED) | - |
| Error detail collapsible section | Error detail collapsible section | MATCH | - |
| Error count display in summary | Error count display with "more" indicator | MATCH | - |
| Upload history list | Upload history list (client-side) | PARTIAL | MEDIUM |
| Upload history from API | Client-side state (not persisted) | MISSING | MEDIUM |
| useUploadFile() hook | Direct fetch in FileUploadZone | CHANGED | LOW |
| useUploadHistory() hook | Not implemented (local state) | MISSING | LOW |
| Persistent right sidebar position | 4th tab content | CHANGED | MEDIUM |

---

## 7. Styling Compliance -- 88% (unchanged)

### 7.1 Design System Compliance

| Design Principle | Implementation | Status |
|-----------------|---------------|--------|
| `rounded-none` throughout | Applied on cards, tables, buttons, error alerts | MATCH |
| `shadow-sm border border-gray-100` on cards | Consistently applied | MATCH |
| `bg-[#f8fafc]` page background | Applied | MATCH |
| `max-w-7xl mx-auto px-6 pt-8 pb-10` | Applied | MATCH |
| `text-primary` for active elements | Applied | MATCH |
| `hover:shadow-xl transition-all` on cards | Applied on StatCard | MATCH |
| `text-[10px] font-black uppercase tracking-widest` labels | Applied | MATCH |
| `text-[11px] font-black uppercase tracking-widest` table headers | Applied | MATCH |
| Loading spinner: primary color animate-spin | Applied with border-4 pattern | MATCH |

### 7.2 Exceptions

| File | Line | Issue | Severity |
|------|------|-------|----------|
| `OverviewTab.tsx` | 87 | Select uses `rounded-lg` instead of `rounded-none` | LOW |
| `OverviewTab.tsx` | 102 | Select uses `rounded-lg` instead of `rounded-none` | LOW |
| `ActionsTab.tsx` | 91 | Select uses `rounded-lg` instead of `rounded-none` | LOW |

### 7.3 Color Palette -- 100%

All status colors match design specification:
- gray-900 (total), red-600 (very high/danger), amber-600 (high/pending), emerald-600 (low/completed), blue-600 (in-progress)

---

## 8. Data Flow & Hook Usage -- 78% (was 72%)

### 8.1 API Endpoint Mapping

| Design Endpoint | Actual Endpoint | Hook/Usage | Status |
|----------------|----------------|------------|--------|
| GET /api/callsigns | GET /api/callsigns | useCallsigns() | MATCH |
| GET /api/actions | GET /api/actions | useAllActions() | MATCH |
| GET /api/admin/statistics?type=summary | NOT IMPLEMENTED | -- | MISSING |
| GET /api/admin/statistics?type=airline | NOT IMPLEMENTED | -- | MISSING |
| GET /api/admin/statistics?type=chart | NOT IMPLEMENTED | -- | MISSING |
| POST /api/admin/upload-callsigns | POST /api/admin/upload-callsigns | Direct fetch | MATCH (FIXED) |
| GET /api/admin/uploads/history | NOT IMPLEMENTED | -- | MISSING |

### 8.2 Hook Implementation Status

| Design Hook | Implementation | Status |
|-------------|---------------|--------|
| useCallsigns() | `src/hooks/useActions.ts` | MATCH |
| useAllActions() | `src/hooks/useActions.ts` | MATCH |
| useAirlines() | `src/hooks/useAirlines.ts` | MATCH (bonus) |
| useStatistics() | NOT IMPLEMENTED (client-side calc) | MISSING |
| useAirlineStats() | NOT IMPLEMENTED (client-side calc) | MISSING |
| useChartData() | NOT IMPLEMENTED | MISSING |
| useUploadFile() | NOT IMPLEMENTED (direct fetch) | MISSING |
| useUploadHistory() | NOT IMPLEMENTED (local useState) | MISSING |

**Improvement from v1.0**: The data flow from upload API response through Sidebar to UploadResult is now correctly typed and mapped. The 3 implemented hooks (useCallsigns, useAllActions, useAirlines) work correctly with proper staleTime, gcTime, and cache invalidation settings.

### 8.3 State Management

| Design State | Implementation | Status |
|-------------|---------------|--------|
| activeTab: 3 values | activeTab: 4 values (added 'upload') | MATCH (extended) |
| selectedAirline filter | OverviewTab local state | MATCH |
| selectedRiskLevel filter | OverviewTab local state | MATCH |
| selectedStatus filter | ActionsTab local state (NEW) | ADDED |
| page pagination | OverviewTab + ActionsTab | MATCH |
| uploadResult | Sidebar local state | MATCH |
| uploadHistory | Sidebar local state (not persisted) | PARTIAL |

---

## 9. Component Architecture -- 80% (was 75%)

### 9.1 File Structure

| Design Path | Implementation Path | Status |
|-------------|-------------------|--------|
| `src/app/admin/callsign-mgmt-v1/page.tsx` | `src/app/callsign-mgmt-v1/page.tsx` (main) | PATH CHANGED |
| -- | `src/app/admin/callsign-mgmt-v1/page.tsx` (redirect) | ADDED |
| `src/components/callsign-mgmt-v1/Tabs.tsx` | Created but NOT USED | UNUSED |
| `src/components/callsign-mgmt-v1/OverviewTab.tsx` | Implemented | MATCH |
| `src/components/callsign-mgmt-v1/ActionsTab.tsx` | Implemented (refactored) | MATCH |
| `src/components/callsign-mgmt-v1/StatisticsTab.tsx` | Implemented | MATCH |
| `src/components/callsign-mgmt-v1/StatCard.tsx` | Implemented | MATCH |
| `src/components/callsign-mgmt-v1/Sidebar.tsx` | Implemented (as tab content) | CHANGED |
| `src/components/uploads/FileUploadZone.tsx` | `src/components/callsign-mgmt-v1/uploads/FileUploadZone.tsx` | PATH CHANGED |
| `src/components/uploads/UploadResult.tsx` | `src/components/callsign-mgmt-v1/uploads/UploadResult.tsx` | PATH CHANGED |
| `src/components/uploads/UploadHistory.tsx` | `src/components/callsign-mgmt-v1/uploads/UploadHistory.tsx` | PATH CHANGED |
| `src/app/api/admin/statistics/route.ts` | NOT IMPLEMENTED | MISSING |
| `src/lib/api/statistics.ts` | NOT IMPLEMENTED | MISSING |

### 9.2 Architecture Layer Compliance

| Layer | Expected | Actual | Status |
|-------|----------|--------|--------|
| Presentation | components/callsign-mgmt-v1/ | Correctly placed (9 files) | MATCH |
| Application | hooks/useActions.ts | Correctly placed | MATCH |
| Domain | types/action.ts | Correctly placed (11 interfaces) | MATCH |
| Infrastructure | Direct fetch in FileUploadZone | VIOLATION (should use hook/service) | DEVIATION |

**Note**: `FileUploadZone.tsx` directly calls `fetch('/api/admin/upload-callsigns')` at line 46. While functionally correct, this violates the Presentation -> Application -> Infrastructure layer rule. The design specifies a `useUploadFile()` hook.

### 9.3 Route Architecture Improvement

The new route structure adds:
- `src/app/callsign-mgmt-v1/layout.tsx` -- Uses `AppShell` for consistent layout
- `src/app/admin/callsign-mgmt-v1/page.tsx` -- Redirect from legacy admin path
- Both pages export `force-dynamic` to prevent prerendering issues
- `ROUTES.CALLSIGN_MGT_V1` constant updated to `/callsign-mgmt-v1`

---

## 10. Convention Compliance -- 98% (unchanged)

### 10.1 Naming Convention

| Category | Convention | Compliance | Violations |
|----------|-----------|:----------:|------------|
| Components | PascalCase | 100% | None |
| Hooks | camelCase (use prefix) | 100% | None |
| Files (component) | PascalCase.tsx | 100% | None |
| Files (utility) | camelCase.ts | 100% | None |
| Folders | kebab-case | 100% | `callsign-mgmt-v1` correct |
| Constants | UPPER_SNAKE_CASE | 100% | None |

### 10.2 Import Order -- All files correct

1. External libraries (react, next, xlsx, tanstack)
2. Internal absolute imports (@/hooks, @/store, @/components)
3. Relative imports (./)

### 10.3 TypeScript Quality

- All components properly typed with interfaces
- `UploadResultData` interface in Sidebar matches API response
- `UploadResultProps` in UploadResult matches Sidebar data
- `UploadHistoryItem` interface properly typed
- `useMemo` used for derived data calculations
- No `any` types in core logic (only in `onUploadComplete` callback and `airlineMap` value)

---

## 11. Detailed Gap List (Updated)

### 11.1 CRITICAL Gaps -- ALL RESOLVED

| # | Gap | Previous Status | Current Status |
|---|-----|:--------------:|:--------------:|
| C1 | Upload API URL mismatch | OPEN | RESOLVED |
| C2 | Upload response format mismatch | OPEN | RESOLVED |

### 11.2 HIGH Gaps (Should Fix)

| # | Gap | Design Location | Impl Location | Description | v1.0 Status |
|---|-----|-----------------|---------------|-------------|:-----------:|
| H1 | Layout architecture changed | design.md:47-69 | page.tsx:39-70 | Horizontal tabs + right sidebar changed to vertical left menu + right content | UNCHANGED |
| H2 | Status column missing from Overview table | design.md:248-253 | OverviewTab.tsx:117-130 | Table has 4 columns instead of 5 (missing "status") | UNCHANGED |
| H3 | Upload history not persisted | design.md:596-639 | Sidebar.tsx:19 | Upload history uses local state, lost on page refresh | UNCHANGED |
| H4 | Statistics API not implemented | design.md:651-654 | N/A | /api/admin/statistics route does not exist | UNCHANGED |
| H5 | Tabs.tsx unused | design.md:106-131 | Tabs.tsx | Created matching design spec but not imported | UNCHANGED |
| H6 | ActionsTab diverges from design intent | design.md:297-415 | ActionsTab.tsx | Individual records instead of airline aggregate view | NEW |

### 11.3 MEDIUM Gaps (Consider Fixing)

| # | Gap | Design Location | Impl Location | Description | v1.0 Status |
|---|-----|-----------------|---------------|-------------|:-----------:|
| M1 | 5th KPI card missing | design.md:200-205 | OverviewTab.tsx:53-58 | Overview has 4 KPI cards, design specifies 5 | UNCHANGED |
| M2 | Status filter missing in Overview | design.md:230 | OverviewTab.tsx:79-110 | No status dropdown | UNCHANGED |
| M3 | Search input missing in Overview | design.md:231 | OverviewTab.tsx:79-110 | No search text input | UNCHANGED |
| M4 | Right chart changed | design.md:447-451 | StatisticsTab.tsx:138-197 | "airline action rate" vs "action status distribution" | UNCHANGED |
| M5 | No dedicated statistics/upload hooks | design.md:651-656 | useActions.ts | useStatistics, useUploadFile, useUploadHistory missing | UNCHANGED |
| M6 | Upload history not API-backed | design.md:656 | Sidebar.tsx:19 | Client-side only, not persisted to DB query | UNCHANGED |

### 11.4 LOW Gaps (Nice to Have)

| # | Gap | Description | v1.0 Status |
|---|-----|-------------|:-----------:|
| L1 | Select inputs use rounded-lg | OverviewTab.tsx:87,102 + ActionsTab.tsx:91 | UNCHANGED |
| L2 | Pagination missing total count | "page N" vs "page N / M (total X)" | UNCHANGED |
| L3 | StatCard description static "Total" | Should accept dynamic description prop | UNCHANGED |
| L4 | Recent upload column hardcoded "-" | StatisticsTab.tsx:243 | UNCHANGED |

---

## 12. Match Rate Summary

```
+-----------------------------------------------------+
|  Overall Match Rate: 83% (was 79%, delta +4%)        |
+-----------------------------------------------------+
|                                                      |
|  Layout & Structure:        72%  [MEDIUM]            |
|  Tab 1 - Overview:          82%  [MEDIUM]            |
|  Tab 2 - Actions:           75%  [MEDIUM] (changed)  |
|  Tab 3 - Statistics:        78%  [MEDIUM]            |
|  Tab 4 - Upload/Sidebar:    92%  [HIGH] (improved)   |
|  Styling Compliance:        88%  [HIGH]              |
|  Data Flow & Hooks:         78%  [MEDIUM] (improved) |
|  Component Architecture:    80%  [MEDIUM] (improved) |
|  Convention Compliance:     98%  [HIGH]              |
|                                                      |
|  CRITICAL gaps: 0 (was 2)   -- ALL RESOLVED         |
|  HIGH gaps:     6 (was 5)   -- 1 new (ActionsTab)   |
|  MEDIUM gaps:   6 (was 7)   -- 1 resolved           |
|  LOW gaps:      4 (was 5)   -- 1 resolved           |
|                                                      |
|  Weighted Score: 83%                                 |
|  (Layout 15%, Tabs 40%, Upload 15%,                  |
|   Styling 10%, DataFlow 10%, Convention 10%)         |
+-----------------------------------------------------+
```

---

## 13. Recommended Actions

### 13.1 Resolved Items (from v1.0)

| Item | Resolution | Verified |
|------|-----------|:--------:|
| Fix upload API URL (C1) | FileUploadZone.tsx:46 now uses `/api/admin/upload-callsigns` | YES |
| Fix upload response mapping (C2) | UploadResultData uses `{inserted, updated, failed}` | YES |
| Fix UploadResult display (M7) | UploadResult renders `result.inserted`, `result.updated` | YES |

### 13.2 Priority 1 -- HIGH (should address before next release)

| # | Item | File | Description |
|---|------|------|-------------|
| 1 | Decide ActionsTab direction | `ActionsTab.tsx` | Either: (a) restore airline aggregate view per design, or (b) update design document to match action records pattern |
| 2 | Add status column to Overview | `OverviewTab.tsx` | Add 5th column "status" with badge styling per design |
| 3 | Remove or integrate Tabs.tsx | `Tabs.tsx` | Either delete dead code or switch layout to horizontal tabs |
| 4 | Implement statistics API | New route file | Create `/api/admin/statistics` for server-side aggregation |
| 5 | Persist upload history | New route + Sidebar | Query `file_uploads` table instead of client-side state |

### 13.3 Priority 2 -- MEDIUM (within iteration cycle)

| # | Item | File | Description |
|---|------|------|-------------|
| 1 | Add 5th KPI card "in progress" | `OverviewTab.tsx` | blue-600 card counting in-progress actions |
| 2 | Add status filter + search | `OverviewTab.tsx` | Expand filter grid to 4 columns per design |
| 3 | Create dedicated hooks | `useActions.ts` or new file | useStatistics, useUploadFile, useUploadHistory |
| 4 | Fix right chart title | `StatisticsTab.tsx` | "airline action rate" per design spec |
| 5 | Fix select rounded-lg | `OverviewTab.tsx`, `ActionsTab.tsx` | Change to rounded-none for consistency |

### 13.4 Priority 3 -- LOW (backlog)

| # | Item | File | Description |
|---|------|------|-------------|
| 1 | Pagination total count | OverviewTab, ActionsTab | Show "page N / M (total X)" format |
| 2 | Dynamic StatCard description | StatCard.tsx | Accept description prop |
| 3 | Recent upload column data | StatisticsTab.tsx | Query file_uploads for last upload per airline |

---

## 14. Design Document Updates Needed

If the following deviations are intentional, update the design document:

- [ ] Section 2.1: Route changed from `/admin/callsign-mgmt-v1` to `/callsign-mgmt-v1`
- [ ] Section 2.2: Layout structure changed to left sidebar menu + right content
- [ ] Section 3.2: Tab container replaced with 4-item vertical navigation
- [ ] Section 3.5: ActionsTab content changed from airline aggregate to individual action records (if accepted)
- [ ] Section 3.7: Sidebar moved from persistent right panel to 4th tab
- [ ] Section 4.1: Upload endpoint confirmed as `/api/admin/upload-callsigns`
- [ ] Section 4.1: Document client-side statistics calculation approach (vs statistics API)
- [ ] Section 9: Update folder structure to reflect `/callsign-mgmt-v1` public route
- [ ] Remove Tabs.tsx from Section 9 folder structure (or document intended use)

---

## 15. Post-Analysis Recommendation

**Match Rate 83%**: "There are some differences. The CRITICAL bugs have been resolved and the upload pipeline now works correctly. The ActionsTab refactoring introduces a new pattern that needs design alignment. Additional tab content features (filters, search, KPI cards) remain incomplete."

**Synchronization Options**:
1. Update design document to match current implementation (recommended for layout, route changes)
2. Implement missing design features (status column, 5th KPI card, search, statistics API)
3. Decide ActionsTab direction (restore airline aggregate OR accept action records pattern)
4. Record layout change as intentional improvement

**To reach 90%+ Match Rate**, focus on:
- Resolving ActionsTab design alignment (+5% if design updated, +8% if restored to design spec)
- Adding status column to Overview table (+2%)
- Adding 5th KPI card and search/status filters (+3%)
- Creating statistics API or updating design to accept client-side calc (+2%)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-22 | Initial gap analysis (79%) | gap-detector |
| 2.0 | 2026-02-22 | Post-improvement re-analysis: CRITICAL bugs resolved, ActionsTab refactored, route restructured. Overall: 83% (+4%) | gap-detector |
