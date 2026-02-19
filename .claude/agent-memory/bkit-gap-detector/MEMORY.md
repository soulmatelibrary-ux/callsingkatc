# Gap Detector Memory - KATC1 Project

## Project Overview
- **Stack**: Next.js 14 + PostgreSQL 15 (direct, no ORM)
- **Auth**: JWT (1h access, 7d refresh httpOnly cookie) + bcryptjs
- **State**: Zustand (client), pg.Pool (server)
- **DB Init**: `scripts/init.sql` (4 tables: airlines, users, password_history, audit_logs)
- **Airlines**: 11 Korean airlines hardcoded

## Key Findings (2026-02-19 v4.0 Post-P1-Fix) -- 90% TARGET ACHIEVED
- Match Rate: 92% (78% -> 85% -> 92%, total +14%p across P0+P1 fixes)
- All P0 (4) + P1 (4) issues resolved = 8 total fixes
- Backend 95-98%, frontend 73% (up from 57%)
- Design docs still have internal inconsistencies (needs ARCHITECTURE_DESIGN.md update)
- 4 of 7 admin pages now implemented (was 1/7)
- Audit logs table exists but no write logic

## P1 Fixes Verified (2026-02-19 v4.0)
1. apiFetch interceptor: 401 auto-refresh with singleton dedup (client.ts:20-113)
2. POST /api/auth/forgot-password: temp password + email stub + enum attack defense (forgot-password/route.ts)
3. /admin dashboard: stats API + 3 stat cards + recent logins table + system status (admin/page.tsx + api/admin/stats/route.ts)
4. /admin/password-reset: user search + password reset + temp password display (admin/password-reset/page.tsx + api/admin/users/[id]/password-reset/route.ts)

## P0 Fixes Verified (2026-02-19 v3.0)
1. SignupForm: airlineCode field + dropdown UI added
2. signup API: airlineCode/airlineId both supported
3. pending/page.tsx: Authorization Bearer header added
4. StatusBadge: type narrowed to 'active'|'suspended'
5. LoginForm: pending branch removed, only suspended check

## Score Breakdown (v4.0)
- API Endpoints: 95% (+5 from v3.0)
- Database Schema: 85% (no change)
- Frontend Pages: 73% (+13 from v3.0)
- Auth Flow: 98% (+3 from v3.0)
- Airlines Data: 95% (no change)
- Password Policy: 95% (no change)
- State Model: 92% (no change)
- Architecture: 92% (+2 from v3.0)

## Remaining P2/P3 Items (not blocking 90%)
- P2: /admin/users/bulk-register, /admin/access-control, /admin/approval, /admin/audit-logs
- P3: /admin/settings, /airline, /profile, Sidebar, audit_logs INSERT logic
- P3: PasswordStrength lowercase rule display, response field naming, approved_at/by fields

## Design Document Locations
- `docs/02-design/ARCHITECTURE_DESIGN.md` - Main architecture (needs update)
- `docs/02-design/SCREEN_STRUCTURE_DESIGN.md` - 14 pages + 7 admin
- `docs/02-design/LOGIN_SYSTEM_DESIGN.md` - Login flow detail
- `docs/02-design/AIRLINES_DATA.md` - 11 airlines spec

## Analysis Output
- `docs/03-analysis/features/katc1-auth-gap.md` - Full gap report v4.0

## Implementation File Map (v4.0 additions)
- `src/lib/api/client.ts` - apiFetch with 401 interceptor
- `src/lib/api/auth.ts` - forgotPasswordAPI, changePasswordAPI
- `src/app/api/auth/forgot-password/route.ts` - Forgot password API
- `src/app/api/admin/stats/route.ts` - Admin dashboard stats API
- `src/app/api/admin/users/[id]/password-reset/route.ts` - Admin password reset API
- `src/app/admin/page.tsx` - Admin dashboard page
- `src/app/admin/password-reset/page.tsx` - Admin password reset page
- `src/components/forms/ForgotPasswordForm.tsx` - Forgot password form
