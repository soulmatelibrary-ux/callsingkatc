# callsign-management-v1 Analysis Report

> **Analysis Type**: Gap Analysis (Design vs Implementation)
>
> **Project**: KATC1 - Callsign Management V1
> **Version**: 1.0.0
> **Analyst**: gap-detector agent
> **Date**: 2026-02-22
> **Design Doc**: [callsign-management-v1.design.md](../../02-design/features/callsign-management-v1.design.md)

---

## 1. Analysis Overview

### 1.1 Analysis Purpose

Compare the Callsign Management V1 design document with the actual implementation to identify gaps, deviations, and verify compliance with UI/UX specifications, data flow, and coding conventions.

### 1.2 Analysis Scope

- **Design Document**: `docs/02-design/features/callsign-management-v1.design.md`
- **Implementation Path**: `src/app/admin/callsign-mgmt-v1/page.tsx` + `src/components/callsign-mgmt-v1/`
- **Analysis Date**: 2026-02-22
- **Files Analyzed**: 10 implementation files

---

## 2. Overall Scores

| Category | Score | Status |
|----------|:-----:|:------:|
| Layout & Structure | 70% | MEDIUM |
| Tab Content (Overview) | 82% | MEDIUM |
| Tab Content (Actions) | 90% | HIGH |
| Tab Content (Statistics) | 78% | MEDIUM |
| Sidebar / Upload | 80% | MEDIUM |
| Styling Compliance | 88% | HIGH |
| Data Flow & Hooks | 72% | MEDIUM |
| Component Architecture | 75% | MEDIUM |
| **Overall Match Rate** | **79%** | MEDIUM |

---

## 3. Layout & Structure Comparison

### 3.1 Page Architecture

| Design | Implementation | Status | Severity |
|--------|---------------|--------|----------|
| Horizontal tabs (top bar with 3 tabs) | Left sidebar menu (4 vertical buttons) | CHANGED | HIGH |
| Left area: Tabs container (lg:col-span-4) | Left area: Menu sidebar (md:col-span-1) | CHANGED | HIGH |
| Right area: Sidebar/Upload (lg:col-span-2) | Right area: Tab content (md:col-span-3) | CHANGED | HIGH |
| 3 tabs: overview, actions, stats | 4 menu items: overview, actions, stats, upload | CHANGED | MEDIUM |
| Upload in persistent right sidebar | Upload as 4th tab content ("excel input") | CHANGED | MEDIUM |
| Grid: `lg:grid-cols-6` (4+2 split) | Grid: `md:grid-cols-4` (1+3 split) | CHANGED | LOW |

**Analysis**: The fundamental layout architecture has been **significantly changed** from the design. The design specifies a horizontal tab bar at the top of the main content area with a persistent right sidebar for file upload. The implementation instead uses a left vertical navigation menu with content rendered to the right, and file upload has been moved from a persistent sidebar into a dedicated 4th tab.

This is an intentional architectural deviation that could be considered an improvement for usability (vertical menu is cleaner for 4+ items), but it differs from the design document.

### 3.2 Page Header

| Design | Implementation | Status |
|--------|---------------|--------|
| Blue bar + "SYSTEM MANAGEMENT" text | Blue bar + "SYSTEM MANAGEMENT" text | MATCH |
| h1: "callsign management V1" | h1: "callsign management V1" | MATCH |
| Description text | Description text | MATCH |
| `border-b border-gray-200 pb-8` | `border-b border-gray-200 pb-8 mb-8` | MATCH (minor `mb-8` addition) |

**Score**: 98% -- Near-perfect match on page header.

### 3.3 Navigation / Tab System

| Design (Section 3.2) | Implementation | Status |
|----------------------|---------------|--------|
| Horizontal tab bar (`flex border-b border-gray-100`) | Vertical sidebar nav (`divide-y divide-gray-50`) | CHANGED |
| Active: `border-b-2 border-primary text-primary` | Active: `bg-primary/10 text-primary border-l-4 border-primary` | CHANGED |
| Inactive: `border-transparent text-gray-500 hover:text-gray-900` | Inactive: `text-gray-700 hover:bg-gray-50 border-l-4 border-transparent` | CHANGED |
| 3 tabs only | 4 menu items (added "excel input") | CHANGED |
| No icons in tabs | Icons per menu item (emoji) | ADDED |
| Tab container wraps tab content + header in one card | Menu is separate from content area | CHANGED |
| `Tabs.tsx` component exists but unused in page | `Tabs.tsx` created but not imported by page.tsx | UNUSED |

**Key Finding**: The `Tabs.tsx` component (`/Users/sein/Desktop/katc1/src/components/callsign-mgmt-v1/Tabs.tsx`) implements the exact design-spec horizontal tab pattern, but the main `page.tsx` does NOT use it. Instead, `page.tsx` implements its own left sidebar menu. This suggests the horizontal tabs were built first (matching design), then replaced with a vertical menu layout.

---

## 4. Tab Content Comparison

### 4.1 Tab 1: Overview (overview)

| Design Item | Implementation | Status | Severity |
|-------------|---------------|--------|----------|
| 5 KPI cards (`sm:grid-cols-5`) | 4 KPI cards (`sm:grid-cols-4`) | MISSING | MEDIUM |
| Card: "total callsigns" (gray-900) | Card: "total callsigns" (gray-900) | MATCH | - |
| Card: "very high" (red-600) | Card: "very high" (red-600) | MATCH | - |
| Card: "high" (amber-600) | Card: "high" (amber-600) | MATCH | - |
| Card: "low" (emerald-600) | Card: "low" (emerald-600) | MATCH | - |
| Card: "in progress" (blue-600) | NOT IMPLEMENTED | MISSING | MEDIUM |
| 4-column filter grid (airline, risk, status, search) | 2-column filter (airline, risk) | MISSING | MEDIUM |
| Status filter dropdown | NOT IMPLEMENTED | MISSING | MEDIUM |
| Search input placeholder "callsign search..." | NOT IMPLEMENTED | MISSING | MEDIUM |
| Table column: status | NOT IMPLEMENTED | MISSING | HIGH |
| Table: 5 columns (airline, callsign, risk, status, date) | Table: 4 columns (airline, callsign, risk, date) | MISSING | HIGH |
| Pagination: "page 1 / 5 (total 245)" format | Pagination: "page {N}" only (no total) | PARTIAL | LOW |
| `useCallsigns` hook | `useCallsigns` hook | MATCH | - |
| Table hover: `hover:bg-primary/[0.02]` | Table hover: `hover:bg-primary/[0.02]` | MATCH | - |
| Risk badge: `rounded-full text-[10px] font-black border` | Risk badge: `rounded-full text-[10px] font-black border` | MATCH | - |
| Select styling: `rounded-none` | Select styling: `rounded-lg` | DEVIATION | LOW |

**Score**: 82% -- Missing the 5th KPI card ("in progress"), status column in table, status filter, and search input.

### 4.2 Tab 2: Airline Actions (actions)

| Design Item | Implementation | Status | Severity |
|-------------|---------------|--------|----------|
| Section header "airline action status" | Section header "airline action status" | MATCH | - |
| 7-column table | 7-column table | MATCH | - |
| Progress bar with color coding | Progress bar with color coding | MATCH | - |
| Status badge: >=80% emerald, 50-80% amber, <50% red | Status logic: >=80% emerald, >=50% amber, <50% red | MATCH | - |
| Status labels: "excellent"/"good"/"caution" | Status labels: "excellent"/"good"/"caution" | MATCH | - |
| Footer: Reset button + Excel export | Footer: Excel export only (no Reset button) | MISSING | LOW |
| Excel export with XLSX library | Excel export with XLSX library | MATCH | - |
| `useAllActions` + `useAirlines` hooks | `useAllActions` + `useAirlines` hooks | MATCH | - |
| Sort by completion rate (low first) | Sort by completion rate (low first) | MATCH | - |
| Data source: `GET /api/admin/statistics?type=airline` | Data source: Client-side calculation from actions list | CHANGED | MEDIUM |

**Score**: 90% -- Very close to design. Missing only the "Reset" button in footer.

### 4.3 Tab 3: Statistics (stats)

| Design Item | Implementation | Status | Severity |
|-------------|---------------|--------|----------|
| 4 KPI cards (`sm:grid-cols-4`) | 4 KPI cards (`sm:grid-cols-4`) | MATCH | - |
| KPI labels match design | KPI labels match (minor: "not actioned" vs "not actioned (Pending)") | MATCH | - |
| Left chart: "risk level status" | Left chart area: "risk level status" (bar chart) | MATCH | - |
| Right chart: "airline action rate" | Right chart: "action status distribution" | CHANGED | MEDIUM |
| Recharts BarChart or SVG | Custom progress bars (no Recharts) | CHANGED | MEDIUM |
| Airline detailed statistics table | Airline detailed statistics table | MATCH | - |
| Table: 5 columns (airline, callsign, rate, avg time, recent upload) | Table: 5 columns matching design | MATCH | - |
| Average response time calculation | Average response time calculation | MATCH | - |
| "Recent upload" column data | "Recent upload" column: hardcoded "-" | PARTIAL | LOW |
| Data source: `GET /api/admin/statistics?type=summary` | Data source: Client-side calc from callsigns+actions | CHANGED | MEDIUM |
| Data source: `GET /api/admin/statistics?type=chart` | NOT IMPLEMENTED (no statistics API) | MISSING | MEDIUM |

**Score**: 78% -- Charts implemented as progress bars instead of Recharts. Right chart changed from "airline action rate" to "action status distribution". No dedicated statistics API endpoint.

### 4.4 Tab 4: Excel Upload (Sidebar)

| Design Item | Implementation | Status | Severity |
|-------------|---------------|--------|----------|
| Persistent right sidebar | 4th tab content area | CHANGED | HIGH |
| File upload drag & drop zone | File upload drag & drop zone | MATCH | - |
| Upload progress bar with spinner | Upload progress bar with spinner | MATCH | - |
| Upload result card (added/modified/failed) | Upload result card (added/modified/failed) | MATCH | - |
| Error detail collapsible section | Error detail collapsible section | MATCH | - |
| Upload history list | Upload history list | MATCH | - |
| `POST /api/admin/uploads` endpoint | `POST /api/admin/uploads` (actual: `/api/admin/upload-callsigns`) | DEVIATION | HIGH |
| Upload history from API: `GET /api/admin/uploads/history` | Upload history: client-side state (no API) | MISSING | HIGH |
| `useUploadFile()` hook | Direct fetch in FileUploadZone | CHANGED | MEDIUM |
| `useUploadHistory()` hook | Not implemented (local state) | MISSING | MEDIUM |
| Response format: `{success_count, failed_count, updated_count}` | API response: `{success, total, inserted, updated, failed, errors}` | DEVIATION | MEDIUM |

**Score**: 80% -- Upload mechanics work correctly but API endpoint URL differs, upload history is client-side only (not persisted), and response format differs from design.

---

## 5. Styling Compliance

### 5.1 Design System Compliance

| Design Principle | Implementation | Status |
|-----------------|---------------|--------|
| `rounded-none` throughout | `rounded-none` on cards, tables, buttons | MATCH (with exceptions) |
| `shadow-sm border border-gray-100` on cards | Consistently applied | MATCH |
| `bg-[#f8fafc]` page background | `bg-[#f8fafc]` applied | MATCH |
| `max-w-7xl mx-auto px-6 pt-8 pb-10` container | `max-w-7xl w-full mx-auto px-6 pt-8 pb-10` | MATCH |
| `text-primary` for active elements | Consistently applied | MATCH |
| `hover:shadow-xl transition-all` on cards | Applied on StatCard | MATCH |
| `text-[10px] font-black uppercase tracking-widest` labels | Applied on StatCard, pagination | MATCH |
| `text-[11px] font-black text-gray-400 uppercase tracking-widest` table headers | Consistently applied | MATCH |
| Select inputs: no explicit design style | `rounded-lg` used (not `rounded-none`) | DEVIATION |
| Loading spinner: `animate-spin` with primary color | `border-4 border-primary border-t-transparent rounded-full animate-spin` | MATCH |

**Exceptions found**:
- Filter select inputs use `rounded-lg` instead of `rounded-none` (file: OverviewTab.tsx lines 87, 102)
- This is a minor inconsistency with the "rounded-none everywhere" principle

**Score**: 88%

### 5.2 Color Palette Compliance

| Color Role | Design | Implementation | Status |
|-----------|--------|---------------|--------|
| Primary | navy (text-primary, bg-primary) | text-primary, bg-primary | MATCH |
| Total (gray) | text-gray-900 | text-gray-900 | MATCH |
| Completed (emerald) | text-emerald-600 | text-emerald-600 | MATCH |
| In Progress (blue) | text-blue-600 | text-blue-600 | MATCH |
| Pending (amber) | text-amber-600 | text-amber-600 | MATCH |
| High Risk (red) | text-red-600 | text-red-600 | MATCH |
| Very High Risk (red) | text-red-600 | text-red-600 | MATCH |

**Score**: 100%

---

## 6. Data Flow & Hook Usage

### 6.1 API Endpoint Mapping (Design vs Actual)

| Design Endpoint | Actual Endpoint | Hook | Status |
|----------------|----------------|------|--------|
| GET /api/callsigns | GET /api/callsigns | useCallsigns() | MATCH |
| GET /api/admin/statistics?type=summary | NOT IMPLEMENTED | useStatistics() (missing) | MISSING |
| GET /api/admin/statistics?type=airline | NOT IMPLEMENTED | useAirlineStats() (missing) | MISSING |
| GET /api/admin/statistics?type=chart | NOT IMPLEMENTED | useChartData() (missing) | MISSING |
| POST /api/admin/uploads | POST /api/admin/upload-callsigns | useUploadFile() (missing) | DEVIATION |
| GET /api/admin/uploads/history | NOT IMPLEMENTED | useUploadHistory() (missing) | MISSING |
| GET /api/actions | GET /api/actions | useAllActions() | MATCH |

### 6.2 Hook Implementation Status

| Design Hook | Implementation | Status |
|-------------|---------------|--------|
| useCallsigns() | Implemented in `src/hooks/useActions.ts` | MATCH |
| useStatistics() | NOT IMPLEMENTED | MISSING |
| useAirlineStats() | NOT IMPLEMENTED (client-side calc instead) | MISSING |
| useChartData() | NOT IMPLEMENTED | MISSING |
| useUploadFile() | NOT IMPLEMENTED (direct fetch in FileUploadZone) | MISSING |
| useUploadHistory() | NOT IMPLEMENTED (local useState) | MISSING |
| useAllActions() | Implemented in `src/hooks/useActions.ts` | MATCH |
| useAirlines() | Implemented in `src/hooks/useAirlines.ts` | MATCH (not in design but used) |

**Score**: 72% -- Most statistics and upload hooks are missing. Data is calculated client-side rather than through dedicated API endpoints.

### 6.3 State Management

| Design State | Implementation | Status |
|-------------|---------------|--------|
| activeTab: 'overview' / 'actions' / 'stats' | activeTab: 'overview' / 'actions' / 'stats' / 'upload' | MATCH (extended) |
| selectedAirline filter | Implemented in OverviewTab | MATCH |
| selectedRiskLevel filter | Implemented in OverviewTab | MATCH |
| selectedStatus filter | NOT IMPLEMENTED | MISSING |
| page pagination | Implemented in OverviewTab | MATCH |

---

## 7. Component Architecture

### 7.1 Design vs Implementation File Structure

| Design Path | Implementation Path | Status |
|-------------|-------------------|--------|
| `src/app/admin/callsign-mgmt-v1/page.tsx` | `src/app/admin/callsign-mgmt-v1/page.tsx` | MATCH |
| `src/components/callsign-mgmt-v1/Tabs.tsx` | Created but NOT USED by page.tsx | UNUSED |
| `src/components/callsign-mgmt-v1/OverviewTab.tsx` | Implemented | MATCH |
| `src/components/callsign-mgmt-v1/ActionsTab.tsx` | Implemented | MATCH |
| `src/components/callsign-mgmt-v1/StatisticsTab.tsx` | Implemented | MATCH |
| `src/components/callsign-mgmt-v1/StatCard.tsx` | Implemented | MATCH |
| `src/components/callsign-mgmt-v1/Sidebar.tsx` | Implemented (as tab content, not sidebar) | CHANGED |
| `src/components/uploads/FileUploadZone.tsx` | `src/components/callsign-mgmt-v1/uploads/FileUploadZone.tsx` | PATH CHANGED |
| `src/components/uploads/UploadResult.tsx` | `src/components/callsign-mgmt-v1/uploads/UploadResult.tsx` | PATH CHANGED |
| `src/components/uploads/UploadHistory.tsx` | `src/components/callsign-mgmt-v1/uploads/UploadHistory.tsx` | PATH CHANGED |
| `src/app/api/admin/statistics/route.ts` | NOT IMPLEMENTED | MISSING |
| `src/lib/api/statistics.ts` | NOT IMPLEMENTED | MISSING |

### 7.2 Upload Component Path

The design specifies upload components in `src/components/uploads/` (shared/reusable location), but implementation places them in `src/components/callsign-mgmt-v1/uploads/` (feature-scoped). This is actually a reasonable deviation -- keeping feature-specific components together is acceptable in the Dynamic architecture level.

**Score**: 75%

---

## 8. Detailed Gap List

### 8.1 CRITICAL Gaps (Must Fix)

| # | Gap | Design Location | Impl Location | Description |
|---|-----|-----------------|---------------|-------------|
| C1 | Upload API URL mismatch | design.md:656 | FileUploadZone.tsx:46 | Design says `POST /api/admin/uploads`, actual API is `POST /api/admin/upload-callsigns`. FileUploadZone calls `/api/admin/uploads` which will 404. |
| C2 | Upload response format mismatch | design.md:548-592 | upload-callsigns/route.ts:311-318 | Design expects `{success_count, failed_count, updated_count, total_rows}`, API returns `{success, total, inserted, updated, failed, errors}` |

### 8.2 HIGH Gaps (Should Fix)

| # | Gap | Design Location | Impl Location | Description |
|---|-----|-----------------|---------------|-------------|
| H1 | Layout architecture changed | design.md:47-69 | page.tsx:40-74 | Horizontal tabs + right sidebar changed to vertical left menu + right content |
| H2 | Status column missing from Overview table | design.md:248-253 | OverviewTab.tsx:117-130 | Table has 4 columns instead of 5 (missing "status" column) |
| H3 | Upload history not persisted | design.md:596-639 | Sidebar.tsx:18-32 | Upload history uses local state instead of API, lost on page refresh |
| H4 | Statistics API not implemented | design.md:651-654 | N/A | `/api/admin/statistics` route does not exist |
| H5 | Tabs.tsx component created but unused | design.md:106-131 | Tabs.tsx | Implements exact design spec horizontal tabs but page.tsx does not import it |

### 8.3 MEDIUM Gaps (Consider Fixing)

| # | Gap | Design Location | Impl Location | Description |
|---|-----|-----------------|---------------|-------------|
| M1 | 5th KPI card missing ("in progress") | design.md:200-205 | OverviewTab.tsx:53-58 | Overview has 4 KPI cards, design specifies 5 |
| M2 | Status filter missing | design.md:230 | OverviewTab.tsx:79-110 | No status dropdown in filter section |
| M3 | Search input missing | design.md:231 | OverviewTab.tsx:79-110 | No search text input in filter section |
| M4 | Right chart changed | design.md:447-451 | StatisticsTab.tsx:138-197 | "airline action rate" changed to "action status distribution" |
| M5 | No dedicated hooks for statistics | design.md:651-656 | useActions.ts | useStatistics, useAirlineStats, useChartData, useUploadFile, useUploadHistory not implemented |
| M6 | Actions tab: data via client-side calc | design.md:652 | ActionsTab.tsx:13-29 | Design expects dedicated API, implementation calculates from all-actions list |
| M7 | Upload response field name mapping | design.md:563-574 | UploadResult.tsx:2-8 | UploadResult expects `success_count` but API returns `inserted` |

### 8.4 LOW Gaps (Nice to Have)

| # | Gap | Design Location | Impl Location | Description |
|---|-----|-----------------|---------------|-------------|
| L1 | Select inputs use rounded-lg | design.md:17-18 | OverviewTab.tsx:87 | `rounded-lg` instead of `rounded-none` |
| L2 | Pagination missing total count | design.md:281 | OverviewTab.tsx:171-172 | Shows "page N" instead of "page N / M (total X)" |
| L3 | Reset button missing in Actions tab | design.md:407-409 | ActionsTab.tsx:176-183 | Footer only has Excel export, no reset button |
| L4 | StatCard description text says "Total" | design.md:158 | StatCard.tsx:28 | Design shows dynamic description, impl shows static "Total" |
| L5 | Recent upload column hardcoded | design.md:492 | StatisticsTab.tsx:243 | Always shows "-" instead of actual date |

---

## 9. Convention Compliance

### 9.1 Naming Convention

| Category | Convention | Compliance | Violations |
|----------|-----------|:----------:|------------|
| Components | PascalCase | 100% | None |
| Hooks | camelCase (use prefix) | 100% | None |
| Files (component) | PascalCase.tsx | 100% | None |
| Files (utility) | camelCase.ts | 100% | None |
| Folders | kebab-case | 100% | `callsign-mgmt-v1` correct |
| Constants | UPPER_SNAKE_CASE | 100% | None |

### 9.2 Import Order

All files follow correct import order:
1. External libraries (react, next, xlsx, tanstack)
2. Internal absolute imports (@/hooks, @/store, @/components)
3. Relative imports (./)

**Score**: 100%

### 9.3 Architecture Layer Compliance

| Layer | Expected | Actual | Status |
|-------|----------|--------|--------|
| Presentation | components/callsign-mgmt-v1/ | Correctly placed | MATCH |
| Application | hooks/useActions.ts | Correctly placed | MATCH |
| Domain | types/action.ts | Correctly placed | MATCH |
| Infrastructure | Direct fetch in FileUploadZone | VIOLATION (should use hook/service) | DEVIATION |

**Note**: `FileUploadZone.tsx` directly calls `fetch('/api/admin/uploads')` instead of using a dedicated hook. This violates the presentation-to-infrastructure rule. The design specifies `useUploadFile()` hook.

---

## 10. Match Rate Summary

```
+---------------------------------------------+
|  Overall Match Rate: 79%                     |
+---------------------------------------------+
|                                              |
|  Layout & Structure:     70%  [MEDIUM]       |
|  Tab 1 - Overview:       82%  [MEDIUM]       |
|  Tab 2 - Actions:        90%  [HIGH]         |
|  Tab 3 - Statistics:     78%  [MEDIUM]       |
|  Tab 4 - Upload/Sidebar: 80%  [MEDIUM]       |
|  Styling Compliance:     88%  [HIGH]         |
|  Data Flow & Hooks:      72%  [MEDIUM]       |
|  Component Architecture: 75%  [MEDIUM]       |
|  Convention Compliance:  98%  [HIGH]         |
|                                              |
|  CRITICAL gaps: 2                            |
|  HIGH gaps:     5                            |
|  MEDIUM gaps:   7                            |
|  LOW gaps:      5                            |
+---------------------------------------------+
```

---

## 11. Recommended Actions

### 11.1 Immediate (CRITICAL -- within hours)

| Priority | Item | File | Description |
|----------|------|------|-------------|
| C1 | Fix upload API URL | `src/components/callsign-mgmt-v1/uploads/FileUploadZone.tsx:46` | Change `/api/admin/uploads` to `/api/admin/upload-callsigns` OR create a route alias |
| C2 | Fix upload response mapping | `src/components/callsign-mgmt-v1/Sidebar.tsx:20-32` | Map API response `{inserted, updated, failed}` to UploadResult expected format `{success_count, updated_count, failed_count, total_rows}` |

### 11.2 Short-term (HIGH -- within 1 day)

| Priority | Item | File | Description |
|----------|------|------|-------------|
| H1 | Decide layout: use Tabs.tsx or keep menu | `page.tsx`, `Tabs.tsx` | Either delete unused Tabs.tsx or switch back to horizontal tabs per design |
| H2 | Add status column to Overview table | `OverviewTab.tsx` | Add 5th column "status" with badge styling |
| H3 | Implement upload history API | New: `src/app/api/admin/uploads/history/route.ts` | Query file_uploads table for history |
| H4 | Create statistics API endpoint | New: `src/app/api/admin/statistics/route.ts` | Aggregate callsign + action data server-side |
| H5 | Remove or integrate Tabs.tsx | `Tabs.tsx` | Remove dead code or integrate into layout |

### 11.3 Medium-term (MEDIUM -- within 1 week)

| Priority | Item | File | Description |
|----------|------|------|-------------|
| M1 | Add 5th KPI card "in progress" | `OverviewTab.tsx` | Add blue-600 card for in-progress actions |
| M2 | Add status filter dropdown | `OverviewTab.tsx` | Add 3rd select for status filtering |
| M3 | Add search input | `OverviewTab.tsx` | Add text input for callsign search |
| M4 | Right chart: airline action rate | `StatisticsTab.tsx` | Change from "action status distribution" to "airline action rate" per design |
| M5 | Create dedicated hooks | `src/hooks/useActions.ts` or new file | Add useStatistics, useUploadFile, useUploadHistory hooks |
| M6 | Use statistics API in ActionsTab | `ActionsTab.tsx` | Replace client-side calc with server-side API |
| M7 | Create useUploadFile hook | `src/hooks/useActions.ts` | Move fetch logic out of FileUploadZone component |

### 11.4 Low Priority (backlog)

| Item | File | Description |
|------|------|-------------|
| L1 | Fix select rounded-lg to rounded-none | OverviewTab.tsx | Minor styling inconsistency |
| L2 | Show total count in pagination | OverviewTab.tsx | "page 1 / 5 (total 245)" format |
| L3 | Add Reset button in Actions tab footer | ActionsTab.tsx | Per design spec |
| L4 | Dynamic StatCard description | StatCard.tsx | Pass description as prop |
| L5 | Populate "recent upload" column | StatisticsTab.tsx | Query file_uploads for last upload date per airline |

---

## 12. Design Document Updates Needed

If the implementation deviations are intentional, the following design updates are required:

- [ ] Update Section 2.2 Layout Structure: Document vertical left menu instead of horizontal tabs
- [ ] Update Section 3.2 Tab Container: Document 4-item menu with icons
- [ ] Update Section 3.7 Sidebar: Document upload as 4th tab instead of persistent sidebar
- [ ] Update Section 4.1 API Mapping: Correct upload endpoint URL to `/api/admin/upload-callsigns`
- [ ] Update Section 4.1 API Mapping: Document client-side statistics calculation approach
- [ ] Add Section: Document the upload API response format `{success, total, inserted, updated, failed, errors}`
- [ ] Remove Tabs.tsx from Section 9 folder structure (or document its intended use)

---

## 13. Synchronization Recommendation

**Match Rate: 79%** -- "There are some differences. Document update and implementation fixes are recommended."

Recommended approach:
1. **Fix CRITICAL bugs immediately** (C1, C2) -- upload is currently broken due to URL mismatch
2. **Decide on layout direction** -- if left menu is preferred, update design document
3. **Implement missing features** -- status column, search, 5th KPI card
4. **Create statistics API** -- reduce client-side computation, improve scalability
5. **Update design document** to reflect intentional changes

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-22 | Initial gap analysis | gap-detector |
