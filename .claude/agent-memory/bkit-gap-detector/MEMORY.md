# Gap Detector Memory - KATC1 Project

## Project Overview
- **Stack**: Next.js 14 + PostgreSQL 15 (direct, no ORM)
- **Auth**: JWT (1h access, 7d refresh httpOnly cookie) + bcryptjs
- **State**: Zustand (client), pg.Pool (server)
- **DB Init**: `scripts/init.sql` (11 tables: airlines, users, password_history, audit_logs, file_uploads, callsigns, callsign_occurrences, actions, action_history, announcements, announcement_views)
- **Airlines**: DB now has 11 (includes both EOK and ESR for Eastar Jet, plus APZ)

## Key Findings (2026-02-20 v5.0 Extended Scope Analysis)
- Extended Match Rate: 65% (expanded scope: routing + flows + filtering + admin)
- Auth-only Match Rate: 92% (same as v4.0, no regression)
- Critical discovery: TWO login entry points (/ and /login) with different behaviors
- DB has NO pending status (only active/suspended) - design assumed pending workflow
- callsign_warnings API/table not implemented - airline page uses hardcoded mockup data
- Admin sidebar not implemented, 5 of 10 admin features missing

## Phase 4 Gap Analysis - airline-data-action-management
- **v1.0 (2026-02-20): 63%** -> **v2.0 (2026-02-22): 75%** (+12%)
- DB Schema: 85% (+3) (UUID FKs good, callsign_occurrences added, enum KR)
- API Endpoints: 68% (+18) (7/10 design endpoints exist, 3 missing: upload status/history/export)
- Types: 88% (-2) (12 interfaces, dual snake/camelCase naming)
- Hooks: 72% (+7) (10 hooks total, 3 design hooks missing: global stats, upload, upload status)
- Frontend: 70% (+25) (callsign-management pages, dashboard, upload UI all new)
- Architecture: 78% (+8) (upload flow still bypasses hook layer)
- Convention: 82% (+2) (naming excellent, error format simplified)

## Phase 4 v2.0 Bugs (4 found, 1 resolved in v3.0)
1. HIGH: PATCH response hardcodes status:'completed' at api/actions/[id]/route.ts:287
2. RESOLVED (v3.0): Upload history now server-persisted via useFileUploads hook + /api/admin/file-uploads
3. MEDIUM: PATCH with status:'in_progress' deletes action row entirely (unconventional)
4. LOW: Airline actions query returns 'in_progress' for NULL action rows (should be 'pending')

## Phase 4 v1.0 Critical Bugs - ALL 4 RESOLVED in v2.0
1. RESOLVED: Admin filter now uses useAirlines() hook with UUIDs
2. RESOLVED: All 9 airlines in dropdown via useAirlines()
3. RESOLVED: ActionDetailModal + ActionModal properly used
4. RESOLVED: Constants updated, EOK correct

## Phase 4 v2.0->v3.0 Missing Features (4 remaining, down from 6)
- Upload status polling API (design: async 202 + polling)
- ~~Upload history API~~ RESOLVED v3.0: /api/admin/file-uploads + useFileUploads hook
- Server-side Excel export API
- ~~Global admin statistics API~~ RESOLVED v3.0: /api/callsigns/stats
- TimelineGraph chart component
- FilePreview before upload

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
1. RESOLVED: Airlines DB now has 11 (EOK+ESR+APZ all present in init.sql)
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

## Phase 6 Gap Analysis (2026-02-24) - callsign-management-v1
- **v1.0: 79%** -> **v2.0: 83%** -> **v3.0: 87%** (+4%)
- Layout & Structure: 75% (horizontal tabs -> vertical left menu, sidebar -> 4th tab)
- Tab 1 Overview: 85% (missing 5th KPI card, status filter, search; has server stats)
- Tab 2 Actions: 78% (individual records + airline stats hybrid, Excel export works)
- Tab 3 Statistics: 80% (progress bars instead of Recharts, server stats via /api/callsigns/stats)
- Tab 4 Upload: 96% (upload + server-persisted history via useFileUploads)
- Styling: 88% (rounded-none consistent, select inputs use rounded-lg)
- Data Flow: 87% (upload history persisted, callsign stats API, 4/7 design hooks remain missing)
- DB Schema: 95% (all tables match, 11 airlines now correct)
- API Endpoints: 88% (9 endpoints, missing: upload status polling, server Excel export)
- Architecture: 85% (dual route public+admin, middleware protection, force-dynamic)
- Convention: 98% (naming, imports, folder structure all correct)

## Phase 6 Bugs
- v2.0 bugs (FileUploadZone URL, UploadResultData format): ALL RESOLVED
- v3.0 remaining bugs (3, inherited from Phase 4):
  1. HIGH: PATCH response hardcodes status:'completed' at api/actions/[id]/route.ts:287
  2. MEDIUM: PATCH with status:'in_progress' deletes action row entirely
  3. LOW: Airline actions query returns 'in_progress' for NULL action rows

## Phase 6 Key Changes (v3.0)
- Folder renamed: `callsign-mgmt-v1` -> `callsign-management` (components + routes)
- Dual routes: `/callsign-management` (public, useSearchParams) + `/admin/callsign-management` (admin, useState)
- Legacy redirects: `/callsign-mgmt-v1` -> `/callsign-management`
- New APIs: `/api/callsigns/stats`, `/api/admin/file-uploads`, `/api/admin/file-uploads/[id]`
- New hook: `useFileUploads` (src/hooks/useFileUploads.ts) for server-persisted upload history
- ROUTES.CALLSIGN_MANAGEMENT = '/callsign-management'
- Both pages export `force-dynamic` for prerendering stability

## Phase 6 Remaining Gaps (v3.0) - 15 items
- HIGH (3): Layout architecture deviation (design: horizontal tabs), ActionsTab design divergence, Tabs.tsx unused
- MEDIUM (8): 5th KPI card missing, Overview status/search filters, Recharts not used, consolidated stats API, useUploadFile hook, airline progress bars, upload status polling API, server-side Excel export API
- LOW (4): Header nav admin-only, airline detail table uses code not name, Tabs.tsx cleanup, select rounded-lg inconsistency
- Resolved since v2.0: Statistics API (now /api/callsigns/stats), Upload history API (now /api/admin/file-uploads), useFileUploads hook added

## Phase 6 File Map (v3.0) - renamed callsign-mgmt-v1 -> callsign-management
- `src/app/callsign-management/page.tsx` - Public page (left menu, useSearchParams tabs)
- `src/app/callsign-management/layout.tsx` - AppShell layout wrapper
- `src/app/admin/callsign-management/page.tsx` - Admin page (useState tabs, isAdmin check)
- `src/app/callsign-mgmt-v1/page.tsx` - Legacy redirect to /callsign-management
- `src/app/admin/callsign-mgmt-v1/page.tsx` - Legacy redirect to /admin/callsign-management
- `src/components/callsign-management/OverviewTab.tsx` - Tab 1: callsigns + 4 KPI + server stats
- `src/components/callsign-management/ActionsTab.tsx` - Tab 2: actions + airline stats + Excel export
- `src/components/callsign-management/StatisticsTab.tsx` - Tab 3: stats + progress bars + airline table
- `src/components/callsign-management/Sidebar.tsx` - Tab 4: upload + server-persisted history
- `src/components/callsign-management/StatCard.tsx` - Reusable KPI card
- `src/components/callsign-management/Tabs.tsx` - UNUSED horizontal tabs (matches design)
- `src/components/callsign-management/uploads/FileUploadZone.tsx` - Drag & drop upload
- `src/components/callsign-management/uploads/UploadResult.tsx` - Upload result display
- `src/components/callsign-management/uploads/UploadHistory.tsx` - Server-persisted history list
- `src/hooks/useFileUploads.ts` - useFileUploads + useDeleteFileUpload (NEW v3.0)
- `src/app/api/callsigns/stats/route.ts` - GET risk-level statistics (NEW v3.0)
- `src/app/api/admin/file-uploads/route.ts` - GET upload history (NEW v3.0)
- `src/app/api/admin/file-uploads/[id]/route.ts` - DELETE upload record (NEW v3.0)
- `src/app/api/admin/upload-callsigns/route.ts` - POST Excel upload API
- Header.tsx - Link to /callsign-management (admin-only)

## Analysis Reports
- `docs/03-analysis/features/katc1-auth-gap.md` - v4.0 auth-focused (92%)
- `docs/03-analysis/features/katc1-full-gap-v5.md` - v5.0 full system (65%)
- `docs/03-analysis/features/airline-data-action-management.analysis.md` - Phase 4 v2.0 (75%, was 63%)
- `docs/03-analysis/features/announcement-system.analysis.md` - Phase 5 (94%)
- `docs/03-analysis/features/callsign-management-v1.analysis.md` - Phase 6 v3.0 (87%, was 83%, was 79%)

## Core Infrastructure Files
- `src/middleware.ts` - Route protection (refreshToken + user cookie)
- `src/store/authStore.ts` - Zustand auth state
- `src/lib/api/client.ts` - apiFetch with 401 interceptor
- `src/lib/jwt.ts` - JWT generation/verification
- `src/lib/db.ts` - pg.Pool query + transaction
- `scripts/init.sql` - DB schema (11 airlines, 11 tables, sample data)
- `src/hooks/useActions.ts` - 11 hooks (actions + callsigns CRUD + stats)
- `src/hooks/useFileUploads.ts` - useFileUploads + useDeleteFileUpload
- `src/types/action.ts` - 12 interfaces (dual naming)
