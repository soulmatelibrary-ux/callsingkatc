# Gap Detector Memory - KATC1 Project

## Project Overview
- **Stack**: Next.js 14 + PostgreSQL 15 (direct, no ORM)
- **Auth**: JWT (1h access, 7d refresh httpOnly cookie) + bcryptjs
- **State**: Zustand (client), pg.Pool (server)
- **DB Init**: `scripts/init.sql` (8 tables: airlines, users, password_history, audit_logs, file_uploads, callsigns, actions, action_history)
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
- Implemented: /admin, /admin/users, /admin/password-reset, /admin/airlines, /admin/actions (6)
- Missing: /admin/bulk-register, /admin/approval, /admin/access-control, /admin/audit-logs, /admin/settings (5)

## Analysis Reports
- `docs/03-analysis/features/katc1-auth-gap.md` - v4.0 auth-focused (92%)
- `docs/03-analysis/features/katc1-full-gap-v5.md` - v5.0 full system (65%)
- `docs/03-analysis/features/airline-data-action-management.analysis.md` - Phase 4 (63%)

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
