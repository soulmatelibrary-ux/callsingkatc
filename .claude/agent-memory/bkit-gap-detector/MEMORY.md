# Gap Detector Memory - KATC1 Project

## Project Overview
- **Stack**: Next.js 14 + SQLite 3 (better-sqlite3, no ORM) -- MIGRATED from PostgreSQL 2026-02-27
- **Auth**: JWT (1h access, 7d refresh httpOnly cookie) + bcryptjs
- **State**: Zustand (client), better-sqlite3 singleton (server)
- **DB**: `src/lib/db/sqlite-schema.ts` (11 tables, runtime init), WAL mode, foreign_keys ON
- **Airlines**: 11 (KAL, AAR, JJA, JNA, TWB, ABL, ASV, EOK, FGW, APZ, ESR)

## SQLite Migration v2.0 (2026-02-27 Post-Cleanup)
- **Overall: 87%** (FAIL, below 90% threshold)
- Auth API: 98% PASS, Schema: 98% PASS, Migration: 80%, API Endpoints: 82%
- Cleanup resolved: ILIKE (0), ::date (0), isSQLite (0), bulk $N reduced 73%
- **8 files still have PostgreSQL syntax** (concentrated in announcements + stats):
  - `callsigns/stats` ($N), `airlines/[id]/callsigns` ($N+NULLS LAST)
  - `announcements/` (ANY/string_to_array), `announcements/[id]` (::int+ANY+param count)
  - `announcements/history` ($N+INTERVAL+::int), `admin/announcements` GET ($N+INTERVAL+::int)
  - `admin/stats` (FILTER clause), `admin/file-uploads` ($N in count)
- Fix estimate: 8 files -> 93%+ PASS
- See: [sqlite-cleanup-v2 detail file](sqlite-cleanup-v2-detail.md)

## Prior SQLite Migration v1.0 (2026-02-27 Pre-Cleanup)
- Overall: 86%, Auth: 95%, Migration: 62% (66 $N across 12 files)

## Phase Analysis History (latest first)
- Phase 6 callsign-management v3.0: 87%
- Phase 5 announcement-system: 94%
- Phase 4 airline-data-action v2.0: 75%
- v5.0 full system: 65%, v4.0 auth-only: 92%

## Known Persistent Bugs
1. HIGH: `actions/[id]/route.ts:286` hardcodes status:'completed' in PATCH response
2. HIGH: `actions/[id]/route.ts:260` checks result.rows after UPDATE (SQLite returns no rows)
3. MEDIUM: PATCH status:'in_progress' deletes action row entirely
4. LOW: Airline actions query returns 'in_progress' for NULL action rows
5. BUG: `airlines/test-callsigns/route.ts` - 2 ? placeholders but 1 param passed

## Core Infrastructure
- `src/lib/db/sqlite.ts` - better-sqlite3 driver (clean)
- `src/lib/db/queries/auth.ts` - 4 auth queries (all ? params)
- `src/lib/jwt.ts` - JWT gen/verify (1h access, 7d refresh)
- `src/lib/db/sqlite-schema.ts` - 11 tables, 39 indexes, sample data

## Analysis Reports
- `katc1-sqlite-cleanup-v2.analysis.md` - Post-cleanup (87%, 8 files remaining)
- `katc1-auth-sqlite-migration.analysis.md` - Pre-cleanup (86%)
- `callsign-management-v1.analysis.md` - Phase 6 v3.0 (87%)
- `announcement-system.analysis.md` - Phase 5 (94%)
- `airline-data-action-management.analysis.md` - Phase 4 v2.0 (75%)
- `katc1-full-gap-v5.md` - v5.0 full system (65%)
- `katc1-auth-gap.md` - v4.0 auth-focused (92%)
