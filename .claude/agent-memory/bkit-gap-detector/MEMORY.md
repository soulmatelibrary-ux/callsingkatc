# Gap Detector Memory - KATC1 Project

## Project Overview
- **Stack**: Next.js 14 + SQLite 3 (better-sqlite3, no ORM) -- MIGRATED from PostgreSQL 2026-02-27
- **Auth**: JWT (1h access, 7d refresh httpOnly cookie) + bcryptjs
- **State**: Zustand (client), better-sqlite3 singleton (server)
- **DB**: `src/lib/db/sqlite-schema.ts` (11 tables, runtime init), WAL mode, foreign_keys ON
- **Airlines**: 11 (KAL, AAR, JJA, JNA, TWB, ABL, ASV, EOK, FGW, APZ, ESR)

## SQLite Migration v3.0 FINAL (2026-02-27 Post-Fix)
- **Overall: 92% PASS** (above 90% threshold)
- Auth API: 98%, Schema: 98%, Migration: 93%, API Endpoints: 90%, Bug Fixes: 83%
- $N params: 0 in source (was 66 in v1.0, 18 in v2.0)
- ILIKE/::type/INTERVAL(SQL)/NULLS LAST/FILTER: all 0
- **1 file still has PostgreSQL syntax**: `announcements/[id]/route.ts:80` (ANY+string_to_array)
- **1 syntax error introduced**: `actions/[id]/route.ts:291` (missing comma)
- Dynamic WHERE/SET `?` pattern affects ~7 files (structural, not PG-specific)
- Search `%?%` literal bug in 4 files (matches "?" not search term)
- `result.rows` after INSERT/UPDATE/DELETE in 6 files (returns undefined)
- See: [v3 analysis](../docs/03-analysis/katc1-sqlite-final-v3.analysis.md)

## Prior Versions
- v2.0 (2026-02-27): 87% FAIL, 8 files with PG syntax
- v1.0 (2026-02-27): 86% FAIL, 66 $N across 12 files

## Phase Analysis History (latest first)
- Full System v4.0: 84% WARNING (CRITICAL: deletedAction ref error, 20+ console.log, announcement level mismatch)
- Password Reset & Force Change v2.0 FINAL: 93% PASS (all 4 fixes verified)
- Password Reset & Force Change v1.0: 88% WARNING (4 priority issues found)
- SQLite Migration v3.0 FINAL: 92% PASS
- SQLite Migration v2.0: 87% FAIL
- SQLite Migration v1.0: 86% FAIL
- Phase 6 callsign-management v3.0: 87%
- Phase 5 announcement-system: 94%
- Phase 4 airline-data-action v2.0: 75%
- v5.0 full system: 65%, v4.0 auth-only: 92%

## Known Remaining Issues (v3.0)
1. CRITICAL: `actions/[id]/route.ts:291` missing comma (won't compile)
2. CRITICAL: `announcements/[id]/route.ts:80` PostgreSQL ANY(string_to_array) + param count mismatch
3. MEDIUM: ~7 files use `?` as dynamic SQL fragment (WHERE ?, SET ?)
4. MEDIUM: 4 files have `%?%` search bug (matches literal "?" not search term)
5. MEDIUM: 6 files access `result.rows` after INSERT/UPDATE/DELETE (undefined)
6. LOW: `42703` PG error code checks in 2 airline route files (dead code)
7. LOW: `.bak` file in source tree

## Resolved Bugs (from v2.0)
- Bug #1 (hardcoded status): FIXED (but syntax error introduced)
- Bug #2 (result.rows after UPDATE): FIXED (uses changes + separate SELECT)
- Bug #3 (in_progress deletes row): INTENTIONAL design
- Bug #5 (test-callsigns param count): FIXED (2 params now)

## Core Infrastructure
- `src/lib/db/sqlite.ts` - better-sqlite3 driver (clean, SELECT=rows, else=changes)
- `src/lib/db/queries/auth.ts` - 4 auth queries (all ? params)
- `src/lib/jwt.ts` - JWT gen/verify (1h access, 7d refresh)
- `src/lib/db/sqlite-schema.ts` - 11 tables, 39 indexes, sample data

## Resolved Issues (Password Reset feature, 2026-02-28)
- FIXED: `auth.ts:getUserByEmail` now includes `last_password_changed_at` - 90-day expiry functional
- FIXED: `LoginForm.tsx:74` now uses `?forced=true` param - forced mode UI works on client redirect
- FIXED: console.log removed from login route + middleware (CLAUDE.md compliant)
- FIXED: metadata export removed from 'use client' page

## Remaining Low-Priority (Password Reset)
- LOW: console.log in logout/route.ts, refresh/route.ts, Providers.tsx
- MEDIUM: refresh/route.ts forceChangePassword uses only is_default_password (missing OR password_change_required)

## Full System v4.0 Key Findings (2026-02-28)
1. CRITICAL: `actions/[id]/route.ts:185` - `deletedAction` never defined (ReferenceError at runtime)
2. HIGH: Announcement levels mismatch: design=critical/urgent/normal/info, impl=warning/info/success
3. HIGH: API URL paths differ significantly from design (10+ endpoints)
4. MEDIUM: 20+ console.log/warn violations of CLAUDE.md
5. MEDIUM: 2 .bak files in source tree
6. MEDIUM: Inconsistent response format (data[] vs users[] vs announcements[])
7. LOW: 3 PostgreSQL error code checks (42703) - dead code
8. Match Rate: 84% WARNING (below 90% threshold)

## Analysis Reports
- `katc1-full-system-v4.analysis.md` - Full System v4.0 (84% WARNING)
- `password-reset-force-change.analysis.md` - Password Reset v2.0 (93% PASS)
- `katc1-sqlite-final-v3.analysis.md` - v3.0 FINAL (92% PASS)
- `katc1-sqlite-cleanup-v2.analysis.md` - v2.0 (87% FAIL)
- `katc1-auth-sqlite-migration.analysis.md` - v1.0 (86% FAIL)
- Previous phase reports: see docs/03-analysis/
