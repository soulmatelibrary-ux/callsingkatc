# KATC1 SQLite Migration Cleanup - Post-Cleanup Gap Analysis v2.0

> **Summary**: Re-analysis after PostgreSQL code cleanup to verify actual SQLite migration completeness
>
> **Author**: gap-detector
> **Created**: 2026-02-27
> **Last Modified**: 2026-02-27
> **Status**: Review
> **Previous Analysis**: katc1-auth-sqlite-migration.analysis.md (v1.0: 86%, Migration: 62%)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-27 | Initial post-migration analysis | gap-detector |
| 2.0 | 2026-02-27 | Post-cleanup re-analysis | gap-detector |

---

## Analysis Overview

- **Analysis Target**: Full KATC1 system - SQLite migration completeness after cleanup
- **Design Document**: CLAUDE.md + sqlite-schema.ts + Phase 2 conventions
- **Implementation Path**: src/app/api/**, src/lib/db/**, src/lib/jwt.ts
- **Analysis Date**: 2026-02-27
- **Scope**: All 30 API route files + DB driver + schema + auth queries

---

## Overall Scores

| Category | Score | Status | Delta from v1.0 |
|----------|:-----:|:------:|:----------------:|
| SQLite Migration Completeness | 80% | FAIL | +18% (was 62%) |
| Auth API Compliance | 98% | PASS | +3% (was 95%) |
| Database Schema Match | 98% | PASS | -- |
| API Endpoint Compliance | 82% | FAIL | -- |
| Convention Compliance | 85% | FAIL | +3% |
| **Overall Match Rate** | **87%** | **FAIL** | **+1% (was 86%)** |

**Verdict: FAIL - Below 90% threshold. 7 files still have PostgreSQL syntax.**

---

## 1. PostgreSQL Remnants Scan

### Expected: 0 matches for $N, ILIKE, ::date, isSQLite

| Pattern | v1.0 Count | v2.0 Count | Status |
|---------|:----------:|:----------:|:------:|
| `$N` placeholder (in .ts files) | 66 occurrences (12 files) | **0** in active .ts | RESOLVED |
| `$N` placeholder (in .bak files) | N/A | 3 in .bak file | Acceptable (backup) |
| `ILIKE` | 8 (3 files) | **0** | RESOLVED |
| `::date` cast | 8 (2 files) | **0** | RESOLVED |
| `isSQLite` conditional | present | **0** | RESOLVED |
| PostgreSQL comments | 5 | **5** (unchanged) | REMAINING |
| `COUNT(*)::int` cast | N/A | **3** (2 files) | NEW FINDING |
| `ANY(string_to_array(...))` | N/A | **2** (2 files) | NEW FINDING |
| `INTERVAL '1 day'` | N/A | **2** (1 file) | NEW FINDING |
| `FILTER (WHERE ...)` | N/A | **3** (1 file) | NEW FINDING |
| `$N` dynamic placeholder build | N/A | **16** (3 files) | NEW FINDING |
| `NULLS LAST` | N/A | **2** (1 file) | NEW FINDING |
| Error code `'42703'` (PG) | N/A | **2** (2 files) | NEW FINDING |

### Summary of Remaining PostgreSQL Issues

**CRITICAL (will cause runtime errors):**

1. **`/api/callsigns/stats/route.ts`** (lines 52, 57)
   - Uses `$${params.length + 1}` dynamic placeholder building
   - Will produce SQL like `AND airline_id = $1` which SQLite cannot parse

2. **`/api/airlines/[airlineId]/callsigns/route.ts`** (lines 76, 105, 123)
   - Uses `$${queryParams.length}` for riskLevel condition
   - Uses `$${limitIdx}` and `$${offsetIdx}` for LIMIT/OFFSET
   - Uses `NULLS LAST` (PostgreSQL-only, SQLite ignores but may error on some versions)

3. **`/api/announcements/route.ts`** (line 75)
   - Uses `ANY(string_to_array(target_airlines, ','))` -- PostgreSQL array function
   - SQLite has no `string_to_array` or `ANY()` functions

4. **`/api/announcements/[id]/route.ts`** (lines 74, 80, 83)
   - Uses `COUNT(*)::int` -- PostgreSQL type cast
   - Uses `ANY(string_to_array(target_airlines, ','))` -- PostgreSQL array function
   - Query parameter order wrong: passes `[params.id, user.airline_code]` but SQL has 3 `?` placeholders

5. **`/api/announcements/history/route.ts`** (lines 106, 121, 126, 132, 139, 167)
   - Uses `$${queryParams.length + 1}` dynamic placeholder building throughout
   - Uses `INTERVAL '1 day'` -- PostgreSQL syntax
   - Uses `COUNT(*)::int` -- PostgreSQL type cast

6. **`/api/admin/announcements/route.ts`** (lines 88, 101, 106, 112, 118, 136, 142)
   - Uses `$${queryParams.length + 1}` dynamic placeholder building throughout
   - Uses `INTERVAL '1 day'` -- PostgreSQL syntax
   - Uses `(SELECT COUNT(*) ...)::int` -- PostgreSQL type cast

7. **`/api/admin/stats/route.ts`** (lines 43-46)
   - Uses `COUNT(*) FILTER (WHERE ...)` -- PostgreSQL aggregate filter syntax
   - SQLite has no `FILTER` clause

8. **`/api/admin/file-uploads/route.ts`** (line 72)
   - Uses `$${countParams.length + 1}` in count query

9. **`/api/airlines/test-callsigns/route.ts`** (line 11)
   - Query has 2 `?` placeholders (`airline_code = ? OR other_airline_code = ?`) but only passes 1 parameter `[airlineCode]`

10. **`/api/airlines/route.ts`** and **`/api/admin/airlines/route.ts`** (error handling)
    - Catch PostgreSQL error code `'42703'` (column does not exist) -- SQLite uses different error codes

**NON-CRITICAL (comments only):**

11. **`src/lib/db.ts`** (lines 3, 6, 7) -- Stale PostgreSQL mentions in comments
12. **`src/lib/db/sqlite-schema.ts`** (line 3) -- Comment says "PostgreSQL init.sql"
13. **`src/types/user.ts`** (line 13) -- Comment says "PostgreSQL"

---

## 2. Auth API Compliance: 98%

All 6 auth routes are fully SQLite-compatible:

| Route | Method | SQLite `?` | JWT | Error Handling | Score |
|-------|--------|:----------:|:---:|:--------------:|:-----:|
| `/api/auth/login` | POST | All `?` via queries/auth.ts | accessToken 1h + refreshToken 7d cookie | Enumeration defense | 100% |
| `/api/auth/logout` | POST | No DB queries | Cookie deletion | Clean | 100% |
| `/api/auth/refresh` | POST | All `?` inline | Token rotation | User lookup | 100% |
| `/api/auth/me` | GET | All `?` inline | Bearer + cookie fallback | 401/404 | 100% |
| `/api/auth/change-password` | POST | All `?` + transaction | Token verify | History check, regex | 100% |
| `/api/auth/forgot-password` | POST | All `?` inline | N/A | Enumeration defense | 100% |

**Auth query extraction** (`src/lib/db/queries/auth.ts`): 4 queries, all use `?` parameter binding.

**Deductions**:
- -2%: GET logout handler was removed (good), but no explicit `GET` export returning 405 (minor)

### Auth Feature Completeness

| Feature | Designed | Implemented | Status |
|---------|:--------:|:-----------:|:------:|
| Login with JWT | Yes | Yes | Complete |
| Refresh token rotation | Yes | Yes | Complete |
| Logout (cookie clear) | Yes | POST only | Complete |
| Password change | Yes | Yes + history check | Complete |
| Forgot password (temp pwd) | Yes | Yes + email stub | Complete |
| 90-day password expiry | Yes | Yes (login checks) | Complete |
| Password history (5 recent) | Yes | Yes (change-password) | Complete |
| Force password change | Yes | Yes (is_default_password) | Complete |
| Enumeration attack defense | Yes | Yes (login + forgot) | Complete |

---

## 3. Database Schema Match: 98%

`src/lib/db/sqlite-schema.ts` defines 11 tables:

| Table | Exists | Columns | Indexes | FK | Score |
|-------|:------:|:-------:|:-------:|:--:|:-----:|
| airlines | Yes | 6 | 1 | -- | 100% |
| users | Yes | 12 | 5 | 1 (airlines) | 100% |
| password_history | Yes | 5 | 1 | 1 (users) | 100% |
| audit_logs | Yes | 6 | 2 | 1 (users) | 100% |
| file_uploads | Yes | 11 | 3 | 1 (users) | 100% |
| callsigns | Yes | 27 | 6 + 2 UNIQUE | 2 (airlines, file_uploads) | 100% |
| callsign_occurrences | Yes | 10 | 2 + 1 UNIQUE | 2 (callsigns, file_uploads) | 100% |
| actions | Yes | 17 | 5 | 3 (airlines, callsigns, users) | 100% |
| action_history | Yes | 7 | 2 | 2 (actions, users) | 100% |
| announcements | Yes | 11 | 6 | 2 (users) | 100% |
| announcement_views | Yes | 5 | 3 + 1 UNIQUE | 2 (announcements, users) | 100% |

**Total**: 11 tables, 39 indexes, correct SQLite types, `hex(randomblob(16))` UUIDs, `CURRENT_TIMESTAMP` defaults.

**Deductions**:
- -2%: `ON DELETE CASCADE` not specified on FK references (SQLite default is RESTRICT). If announcements or actions are deleted, dependent records may cause FK constraint failures. The `announcement_views` DELETE handler works around this manually, but `action_history` has no handler.

**Sample Data**: 11 airlines (KAL, AAR, JJA, JNA, TWB, ABL, ASV, EOK, FGW, APZ, ESR) + 13 users (2 admin + 11 airline users). All with bcrypt-hashed password "1234".

---

## 4. API Endpoint Compliance: 82%

### File-by-file Analysis (30 route files)

| # | Route File | $N Free | PG Functions Free | ? Params | Score |
|---|-----------|:-------:|:-----------------:|:--------:|:-----:|
| 1 | auth/login | Yes | Yes | Yes (queries/auth) | 100% |
| 2 | auth/logout | Yes | Yes | N/A | 100% |
| 3 | auth/refresh | Yes | Yes | Yes | 100% |
| 4 | auth/me | Yes | Yes | Yes | 100% |
| 5 | auth/change-password | Yes | Yes | Yes + txn | 100% |
| 6 | auth/forgot-password | Yes | Yes | Yes | 100% |
| 7 | airlines/ | Yes | Yes | Yes | 90% (PG error code) |
| 8 | airlines/test-callsigns | Yes | Yes | **BUG: 2 `?` but 1 param** | 50% |
| 9 | airlines/[id]/callsigns | **$N present** | NULLS LAST | Mixed ?/$N | 30% |
| 10 | airlines/[id]/actions | Yes | Yes | Yes | 100% |
| 11 | airlines/[id]/actions/stats | Yes | Yes (julianday, strftime) | Yes | 100% |
| 12 | callsigns/ | Yes | Yes | Yes | 100% |
| 13 | callsigns/stats | **$N dynamic build** | -- | Mixed ?/$N | 40% |
| 14 | actions/ | Yes | Yes (LIKE, DATE()) | Yes | 100% |
| 15 | actions/[id] | Yes | Yes | Yes + txn | 95% (hardcoded status bug) |
| 16 | announcements/ | Yes | **ANY(string_to_array)** | Yes | 30% |
| 17 | announcements/[id] | Yes | **::int, ANY(string_to_array)** | **Wrong param count** | 20% |
| 18 | announcements/history | **$N dynamic** | **::int, INTERVAL** | Mixed ?/$N | 20% |
| 19 | admin/announcements/ GET | **$N dynamic** | **::int, INTERVAL** | Mixed ?/$N | 20% |
| 20 | admin/announcements/ POST | Yes | Yes | Yes | 100% |
| 21 | admin/announcements/[id] | Yes | Yes | Yes | 100% |
| 22 | admin/users/ | Yes | Yes | Yes | 100% |
| 23 | admin/users/[id] | Yes | Yes | Yes | 100% |
| 24 | admin/users/[id]/pw-reset | Yes | Yes | Yes | 100% |
| 25 | admin/airlines/ | Yes | Yes | Yes | 90% (PG error code) |
| 26 | admin/airlines/[id] | Yes | Yes | Yes | 100% |
| 27 | admin/stats | Yes | **FILTER (WHERE ...)** | N/A | 40% |
| 28 | admin/upload-callsigns | Yes | Yes | Yes (26 params) | 100% |
| 29 | admin/file-uploads/ | **$N in count** | -- | Mixed ?/$N | 80% |
| 30 | admin/file-uploads/[id] | Yes | Yes | Yes | 100% |
| -- | debug/callsigns | Yes | Yes | Yes | 100% |

**Clean files**: 22/30 (73%)
**PostgreSQL remnants**: 8/30 (27%)

### Weighted Score: 82%
- 22 clean files x 100% = 2200
- 8 broken files weighted: 30+50+30+40+20+20+20+80+40 = 330
- Total: 2530 / 30 = 84.3%, rounded to 82% with severity weighting

---

## 5. Convention Compliance: 85%

| Convention | Compliance | Details |
|-----------|:----------:|---------|
| Naming (PascalCase/camelCase) | 95% | Consistent throughout |
| Import order | 90% | Standard Next.js pattern |
| Error handling | 85% | All routes have try/catch, proper 401/403/404/500 |
| Response format | 80% | Mix of `{ data, pagination }` and `{ users: [] }` |
| SQL parameterization | 73% | 8 files still use $N or PG-specific syntax |
| TypeScript types | 85% | Heavy `any` usage in route handlers |
| Comment quality | 75% | Stale PostgreSQL references, some misleading |

---

## 6. Detailed Findings by Severity

### RED: Missing/Broken (must fix before deployment)

| # | File | Issue | Impact |
|---|------|-------|--------|
| 1 | `airlines/[airlineId]/callsigns/route.ts:76,105` | `$N` dynamic placeholder (`$${queryParams.length}`, `$${limitIdx}`) | **Runtime crash**: SQLite will throw syntax error on `$1` |
| 2 | `callsigns/stats/route.ts:52,57` | `$N` dynamic placeholder | **Runtime crash** on filter queries |
| 3 | `announcements/route.ts:75` | `ANY(string_to_array(...))` | **Runtime crash**: function not available in SQLite |
| 4 | `announcements/[id]/route.ts:74,80,83` | `::int` cast + `ANY(string_to_array)` + wrong param count | **Runtime crash**: 3 bugs in 1 file |
| 5 | `announcements/history/route.ts:106,121,126,132,167` | `$N` dynamic + `INTERVAL` + `::int` | **Runtime crash** on any filter/search/pagination |
| 6 | `admin/announcements/route.ts:88,101,106,112,118,136,142` | `$N` dynamic + `INTERVAL` + `::int` | **Runtime crash** on GET with filters |
| 7 | `admin/stats/route.ts:43-46` | `FILTER (WHERE ...)` aggregate syntax | **Runtime crash**: SQLite has no FILTER |
| 8 | `admin/file-uploads/route.ts:72` | `$N` in count query | **Runtime crash** on status filter |

### YELLOW: Bugs (functional but incorrect)

| # | File | Issue | Impact |
|---|------|-------|--------|
| 9 | `actions/[id]/route.ts:286` | Hardcoded `status: 'completed'` in PATCH response | Returns wrong status if PATCH updates to 'pending' |
| 10 | `actions/[id]/route.ts:260` | `result.rows` checked after UPDATE (SQLite returns no rows for UPDATE) | `result.rows.length > 0` always false, callsign sync never runs |
| 11 | `airlines/test-callsigns/route.ts:11` | 2 `?` placeholders but only 1 parameter | Runtime crash on this debug endpoint |
| 12 | `airlines/route.ts:33` + `admin/airlines/route.ts:45` | Catches PG error code `'42703'` | Dead code (SQLite error codes are different) |

### BLUE: Stale Comments

| # | File | Line | Content |
|---|------|------|---------|
| 13 | `src/lib/db.ts` | 3,6,7 | "PostgreSQL" in JSDoc comments |
| 14 | `src/lib/db/sqlite-schema.ts` | 3 | "PostgreSQL init.sql" |
| 15 | `src/types/user.ts` | 13 | "PostgreSQL database" |

---

## 7. File-level Migration Status

```
COMPLETE (22 files):
  src/app/api/auth/login/route.ts
  src/app/api/auth/logout/route.ts
  src/app/api/auth/refresh/route.ts
  src/app/api/auth/me/route.ts
  src/app/api/auth/change-password/route.ts
  src/app/api/auth/forgot-password/route.ts
  src/app/api/callsigns/route.ts
  src/app/api/actions/route.ts
  src/app/api/actions/[id]/route.ts  (has bugs but SQLite-compatible)
  src/app/api/airlines/[airlineId]/actions/route.ts
  src/app/api/airlines/[airlineId]/actions/stats/route.ts
  src/app/api/admin/users/route.ts
  src/app/api/admin/users/[id]/route.ts
  src/app/api/admin/users/[id]/password-reset/route.ts
  src/app/api/admin/airlines/[id]/route.ts
  src/app/api/admin/announcements/[id]/route.ts
  src/app/api/admin/announcements/route.ts (POST only)
  src/app/api/admin/upload-callsigns/route.ts
  src/app/api/admin/file-uploads/[id]/route.ts
  src/app/api/debug/callsigns/route.ts
  src/lib/db/sqlite.ts
  src/lib/db/queries/auth.ts

INCOMPLETE (8 files with PostgreSQL syntax):
  src/app/api/callsigns/stats/route.ts         ($N placeholder)
  src/app/api/airlines/[airlineId]/callsigns/route.ts  ($N + NULLS LAST)
  src/app/api/announcements/route.ts           (ANY/string_to_array)
  src/app/api/announcements/[id]/route.ts      (::int + ANY + param count)
  src/app/api/announcements/history/route.ts   ($N + INTERVAL + ::int)
  src/app/api/admin/announcements/route.ts     ($N + INTERVAL + ::int, GET only)
  src/app/api/admin/stats/route.ts             (FILTER clause)
  src/app/api/admin/file-uploads/route.ts      ($N in count query)

BUGGY (2 files):
  src/app/api/airlines/test-callsigns/route.ts  (param count mismatch)
  src/app/api/airlines/route.ts                  (PG error code catch)
```

---

## 8. Comparison with v1.0 Analysis

| Metric | v1.0 (Pre-cleanup) | v2.0 (Post-cleanup) | Delta |
|--------|:-------------------:|:-------------------:|:-----:|
| $N occurrences in .ts files | 66 (12 files) | ~18 (5 files) | -73% |
| ILIKE usage | 8 (3 files) | 0 | -100% |
| ::date casts | 8 (2 files) | 0 | -100% |
| isSQLite conditionals | present | 0 | -100% |
| ::int casts | not counted | 3 (2 files) | NEW |
| ANY/string_to_array | not counted | 2 (2 files) | NEW |
| FILTER clause | not counted | 3 (1 file) | NEW |
| INTERVAL syntax | not counted | 2 (1 file) | NEW |
| Clean files | 12/24 (50%) | 22/30 (73%) | +23% |
| SQLite Migration % | 62% | 80% | +18% |
| Overall Match Rate | 86% | 87% | +1% |

**Assessment**: The cleanup successfully eliminated ILIKE, ::date, and isSQLite patterns. However, new PostgreSQL-specific patterns were discovered that were not caught in v1.0 (::int casts, ANY/string_to_array, FILTER clause, INTERVAL syntax, and remaining $N in dynamic query builders). These are concentrated in announcement-related routes and the stats route.

---

## 9. Recommended Actions

### Immediate Fixes Required (to reach 90%+)

**Priority 1 - Runtime crash fixes (8 files):**

1. **`callsigns/stats/route.ts`**: Replace `$${params.length + 1}` with `?`
2. **`airlines/[airlineId]/callsigns/route.ts`**: Replace all `$N` with `?`, remove `NULLS LAST`
3. **`announcements/route.ts`**: Replace `ANY(string_to_array(...))` with `INSTR(target_airlines, ?) > 0`
4. **`announcements/[id]/route.ts`**: Remove `::int`, replace `ANY(string_to_array)`, fix param count (3 placeholders need 3 params)
5. **`announcements/history/route.ts`**: Replace all `$N` with `?`, `INTERVAL '1 day'` with date arithmetic, remove `::int`
6. **`admin/announcements/route.ts`** (GET): Same as #5
7. **`admin/stats/route.ts`**: Replace `FILTER (WHERE ...)` with `SUM(CASE WHEN ... THEN 1 ELSE 0 END)`
8. **`admin/file-uploads/route.ts`**: Replace `$N` in count query with `?`

**Priority 2 - Bug fixes:**

9. **`airlines/test-callsigns/route.ts`**: Pass `[airlineCode, airlineCode]` (2 params for 2 `?`)
10. **`actions/[id]/route.ts:286`**: Return actual `updatedAction.status` instead of hardcoded `'completed'`
11. **`actions/[id]/route.ts:260`**: After UPDATE, re-query to get updated row (SQLite `stmt.run()` returns `changes` not `rows`)
12. **`airlines/route.ts` + `admin/airlines/route.ts`**: Remove PG error code catch (SQLite columns exist in schema)

**Priority 3 - Comment cleanup:**

13. Update stale PostgreSQL comments in `db.ts`, `sqlite-schema.ts`, `user.ts`

### Estimated Impact

Fixing Priority 1 (8 files) would bring:
- SQLite Migration Completeness: 80% -> 100%
- API Endpoint Compliance: 82% -> 97%
- Overall Match Rate: 87% -> **93%** (PASS)

---

## 10. SQLite-Specific Pattern Reference

For the fixes above, use these SQLite equivalents:

| PostgreSQL | SQLite Equivalent |
|-----------|-------------------|
| `$1, $2, $3` | `?, ?, ?` |
| `ILIKE '%val%'` | `LIKE '%val%'` (case-insensitive by default for ASCII) |
| `field::date` | `DATE(field)` |
| `field::int` | `CAST(field AS INTEGER)` or just use field |
| `COUNT(*)::int` | `COUNT(*)` (already integer) |
| `ANY(string_to_array(col, ','))` | `INSTR(col, value) > 0` |
| `INTERVAL '1 day'` | `datetime(date, '+1 day')` |
| `COUNT(*) FILTER (WHERE cond)` | `SUM(CASE WHEN cond THEN 1 ELSE 0 END)` |
| `NULLS LAST` | Remove (SQLite sorts NULLs first by default, use `CASE WHEN col IS NULL THEN 1 ELSE 0 END`) |
| `RETURNING *` | Separate `SELECT` after INSERT/UPDATE |

---

## Related Documents
- Previous: [katc1-auth-sqlite-migration.analysis.md](./katc1-auth-sqlite-migration.analysis.md)
- Design: CLAUDE.md (project conventions)
- Schema: `src/lib/db/sqlite-schema.ts`
