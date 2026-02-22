# Gap Detector Memory - KATC1 Project

## Project Overview
- **Stack**: Next.js 14 + PostgreSQL 15 (direct, no ORM)
- **Auth**: JWT (1h access, 7d refresh httpOnly cookie) + bcryptjs
- **State**: Zustand (client), pg.Pool (server)
- **DB Init**: `scripts/init.sql` (11 tables: airlines, users, password_history, audit_logs, file_uploads, callsigns, callsign_occurrences, actions, action_history, announcements, announcement_views)
- **Airlines**: Design says 11, DB has 9 (ESR->EOK, ARK/APZ missing)

## Key Findings (2026-02-20 v5.0 Extended Scope Analysis)
- Extended Match Rate: 65% (expanded scope: routing + flows + filtering + admin)
- Auth-only Match Rate: 92% (same as v4.0, no regression)
- Critical discovery: TWO login entry points (/ and /login) with different behaviors
- DB has NO pending status (only active/suspended) - design assumed pending workflow
- callsign_warnings API/table not implemented - airline page uses hardcoded mockup data
- Admin sidebar not implemented, 5 of 10 admin features missing

## Phase 4 Gap Analysis (2026-02-20) - airline-data-action-management
- **Match Rate: 63%** (weighted across 7 categories)
- DB Schema: 82% (UUID FKs good, enum format shifted EN->KR)
- API Endpoints: 50% (5/10 endpoints missing: upload, stats, export)
- Types: 90% (11 interfaces, dual snake/camelCase naming)
- Hooks: 65% (3/6 hooks missing: statistics, upload, upload status)
- Frontend: 45% (airline page all hardcoded mock data, admin missing dashboard)
- Architecture: 70% (clean where connected, airline page bypasses all layers)
- Convention: 80% (good naming, simplified error format)

## Phase 4 Critical Bugs
1. Admin airline filter uses codes (KAL) but API expects UUIDs - filter broken
2. Only 5/9 airlines in admin filter dropdown
3. Airline page mock ActionModal (console.log only) shadows real component
4. Airline page INC constant uses ESR (should be EOK), includes ARK/APZ not in DB

## Phase 4 Missing Features (P0)
- Excel upload pipeline (API + hook + UI) - entire feature absent
- Statistics API + dashboard (StatCards, charts) - absent
- Excel export - absent
- Airline user page real data connection - uses hardcoded INC[]

## Phase 4 URL Pattern Shift
- Design: `/api/airline/callsigns`, `/api/airline/actions` (role-based)
- Impl: `/api/callsigns`, `/api/actions`, `/api/airlines/[id]/...` (resource-based)
- Response: `{ data: [...], pagination: {...} }` (design: `{ callsigns: [...], total, page }`)

## v5.0 Score Breakdown (weighted)
- Page Routing: 61% (11/18 pages)
- Login Flow: 65% (dual entry point inconsistency)
- Session Management: 95% (JWT + Zustand + interceptor solid)
- Data Filtering: 35% (hardcoded mockup, no API, no server-side filter)
- Admin Features: 55% (5/10 functions, no sidebar)
- Data Model: 80% (pending removed, airline_id added, approved_at/by missing)

## Critical Gaps (P0)
1. Airlines DB mismatch: init.sql has 9 (EOK), design/frontend has 11 (ESR/ARK/APZ)
2. / page login doesn't use Zustand setAuth -> state lost on navigation
3. /login (LoginForm) has no admin role redirect -> admin goes to /airline

## Login Entry Points Architecture
- `/` (page.tsx): Airline/Admin toggle, direct fetch, role-based routing, NO status/forceChange handling
- `/login` (LoginForm.tsx): Zustand setAuth, status+forceChange handling, NO role-based routing
- Middleware: refreshToken cookie + user cookie for route protection

## Design Model Shift (Intentional)
- Original: User self-signup -> pending -> admin approve -> active
- Current: Admin pre-registration -> active immediately, forceChangePassword on first login
- This means /pending page exists but DB can't produce pending users

## Admin Pages Status
- Implemented: /admin, /admin/users, /admin/password-reset, /admin/airlines, /admin/actions, /admin/announcements (7)
- Missing: /admin/bulk-register, /admin/approval, /admin/access-control, /admin/audit-logs, /admin/settings (5)
- Note: /admin/announcements NOT linked in AdminSidebar or admin dashboard

## Phase 5 Gap Analysis (2026-02-22) - announcement-system
- **Match Rate: 94%** (weighted across 9 categories)
- DB Schema: 100% (all columns, constraints, indexes, sample data)
- API Endpoints: 93% (8/8 endpoints, one URL path deviation: view endpoint)
- Types: 90% (11 interfaces, targetAirlines type CSV vs string[])
- Hooks: 98% (4 query + 4 mutation, query key factory, cache invalidation)
- Components: 96% (3/3 components, missing targetAirlines UI in form)
- Pages: 100% (2/2 pages with role-based redirects)
- Layout: 100% (AnnouncementModal in Providers.tsx)
- Constants: 100% (ANNOUNCEMENT_LEVEL, STATUS, COLORS, ROUTES)
- Navigation: 50% (no sidebar/header links to announcements)

## Phase 5 Bug Found
1. History route JOIN: `av.user_id = $1` uses airline_id instead of user_id - isViewed always false

## Phase 5 Missing Features
- targetAirlines multi-select dropdown in AnnouncementForm
- Admin sidebar link for announcement management
- Header navigation link for user announcements
- AnnouncementErrorCode enum not exported

## Phase 5 File Map
- `src/app/api/announcements/route.ts` - GET active announcements
- `src/app/api/announcements/[id]/route.ts` - GET detail + POST view
- `src/app/api/announcements/history/route.ts` - GET history with filters
- `src/app/api/admin/announcements/route.ts` - GET list + POST create
- `src/app/api/admin/announcements/[id]/route.ts` - PATCH + DELETE
- `src/hooks/useAnnouncements.ts` - 8 hooks + query key factory
- `src/types/announcement.ts` - 11 interfaces
- `src/components/announcements/AnnouncementModal.tsx` - Global popup
- `src/components/announcements/AnnouncementTable.tsx` - History table
- `src/components/announcements/AnnouncementForm.tsx` - Create/edit form
- `src/app/announcements/page.tsx` - User history page
- `src/app/admin/announcements/page.tsx` - Admin management page

## Phase 6 Gap Analysis (2026-02-22) - callsign-management-v1
- **Match Rate: 79%** (weighted across 9 categories)
- Layout & Structure: 70% (horizontal tabs -> vertical left menu, sidebar -> 4th tab)
- Tab 1 Overview: 82% (missing 5th KPI card, status column, status filter, search)
- Tab 2 Actions: 90% (near-perfect, missing Reset button only)
- Tab 3 Statistics: 78% (progress bars instead of Recharts, right chart changed)
- Tab 4 Upload: 80% (works but API URL mismatch, history not persisted)
- Styling: 88% (rounded-none consistent, select inputs use rounded-lg)
- Data Flow: 72% (5/7 design hooks missing, client-side stats calc)
- Architecture: 75% (Tabs.tsx created but unused, FileUploadZone direct fetch)
- Convention: 98% (naming, imports, folder structure all correct)

## Phase 6 Critical Bugs
1. FileUploadZone calls `/api/admin/uploads` but actual API is `/api/admin/upload-callsigns` - upload broken
2. UploadResult expects `{success_count, updated_count, failed_count}` but API returns `{inserted, updated, failed}` - display wrong

## Phase 6 Key Architectural Change
- Design: Horizontal tabs (3) + persistent right sidebar for upload
- Implementation: Vertical left menu (4 items) + content area, upload as 4th tab
- Tabs.tsx component implements exact design spec but page.tsx doesn't use it

## Phase 6 Missing Features
- Statistics API (`/api/admin/statistics`) - not implemented
- Upload history API (`/api/admin/uploads/history`) - not implemented
- 5 dedicated hooks (useStatistics, useAirlineStats, useChartData, useUploadFile, useUploadHistory)
- Overview: status filter, search input, status table column, 5th KPI card
- Statistics: Recharts charts (replaced with progress bars)

## Phase 6 File Map
- `src/app/admin/callsign-mgmt-v1/page.tsx` - Main page (left menu layout)
- `src/components/callsign-mgmt-v1/OverviewTab.tsx` - Tab 1: callsigns + KPI
- `src/components/callsign-mgmt-v1/ActionsTab.tsx` - Tab 2: airline action status
- `src/components/callsign-mgmt-v1/StatisticsTab.tsx` - Tab 3: statistics + charts
- `src/components/callsign-mgmt-v1/Sidebar.tsx` - Tab 4: upload container
- `src/components/callsign-mgmt-v1/StatCard.tsx` - Reusable KPI card
- `src/components/callsign-mgmt-v1/Tabs.tsx` - UNUSED horizontal tabs (matches design)
- `src/components/callsign-mgmt-v1/uploads/FileUploadZone.tsx` - Drag & drop upload
- `src/components/callsign-mgmt-v1/uploads/UploadResult.tsx` - Upload result display
- `src/components/callsign-mgmt-v1/uploads/UploadHistory.tsx` - Upload history list
- `src/app/api/admin/upload-callsigns/route.ts` - POST Excel upload API
- Header.tsx:132 - Link to callsign-mgmt-v1 page

## Analysis Reports
- `docs/03-analysis/features/katc1-auth-gap.md` - v4.0 auth-focused (92%)
- `docs/03-analysis/features/katc1-full-gap-v5.md` - v5.0 full system (65%)
- `docs/03-analysis/features/airline-data-action-management.analysis.md` - Phase 4 (63%)
- `docs/03-analysis/features/announcement-system.analysis.md` - Phase 5 (94%)
- `docs/03-analysis/features/callsign-management-v1.analysis.md` - Phase 6 (79%)

## Implementation File Map
- `src/app/page.tsx` - Portal login (airline/admin toggle)
- `src/app/(auth)/login/page.tsx` - Dedicated login page (uses LoginForm)
- `src/app/(main)/airline/page.tsx` - Callsign warnings (HARDCODED data + mock modal)
- `src/app/admin/actions/page.tsx` - Admin action management (API-connected)
- `src/components/actions/ActionModal.tsx` - Real ActionModal (create+edit)
- `src/hooks/useActions.ts` - 7 hooks (actions + callsigns CRUD)
- `src/types/action.ts` - 11 interfaces (dual naming)
- `src/app/api/actions/route.ts` - GET actions list (admin)
- `src/app/api/actions/[id]/route.ts` - GET/PATCH/DELETE single action
- `src/app/api/callsigns/route.ts` - GET callsigns list
- `src/app/api/airlines/[airlineId]/actions/route.ts` - POST create action
- `src/app/api/airlines/[airlineId]/callsigns/route.ts` - GET airline callsigns
- `src/middleware.ts` - Route protection (refreshToken + user cookie)
- `src/store/authStore.ts` - Zustand auth state
- `src/lib/api/client.ts` - apiFetch with 401 interceptor
- `src/lib/jwt.ts` - JWT generation/verification
- `src/lib/db.ts` - pg.Pool query + transaction
- `scripts/init.sql` - DB schema (9 airlines, 8 tables, sample data)
