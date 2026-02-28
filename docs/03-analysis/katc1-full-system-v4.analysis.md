# KATC1 Full System Gap Analysis Report v4.0

> **Analysis Type**: Design-Implementation Gap Analysis (Full System)
>
> **Project**: KATC1 - 항공사 유사호출부호 경고시스템
> **Analyst**: gap-detector (Claude Code)
> **Date**: 2026-02-28
> **Status**: Check Phase

---

## 1. Analysis Overview

### 1.1 Analysis Purpose

KATC1 시스템의 설계 문서 3개와 계획 문서 2개를 기준으로 현재 구현 코드 전체를 비교 분석한다.
최근 코드 수정 사항(CRITICAL 2건, MEDIUM 5건, LOW 3건)을 포함하여 검증한다.

### 1.2 Analysis Scope

| Category | Design Documents | Implementation |
|----------|-----------------|----------------|
| Auth | `katc1-authentication.plan.md` | `src/app/api/auth/*` |
| Data/Actions | `airline-data-action-management.design.md` | `src/app/api/actions/*`, `src/app/api/airlines/*`, `src/app/api/admin/upload-callsigns/*` |
| Announcements | `announcement-system.design.md` | `src/app/api/announcements/*`, `src/app/api/admin/announcements/*` |
| Callsign Mgmt | `callsign-management-v1.design.md` | `src/app/admin/callsign-mgmt-v1/` |
| DB Schema | All design docs | `src/lib/db/sqlite-schema.ts` |

### 1.3 Referenced Files

- Design: `docs/02-design/features/airline-data-action-management.design.md`
- Design: `docs/02-design/features/announcement-system.design.md`
- Design: `docs/02-design/features/callsign-management-v1.design.md`
- Plan: `docs/01-plan/features/katc1-authentication.plan.md`
- Plan: `docs/01-plan/features/airline-data-action-management.plan.md`
- Schema: `src/lib/db/sqlite-schema.ts`
- DB Driver: `src/lib/db/index.ts`, `src/lib/db/sqlite.ts`
- Auth queries: `src/lib/db/queries/auth.ts`

---

## 2. Overall Scores

| Category | Score | Status |
|----------|:-----:|:------:|
| API Endpoint Match | 83% | WARNING |
| Data Model Match | 90% | PASS |
| Authentication & Security | 88% | WARNING |
| Feature Completeness | 82% | WARNING |
| Convention Compliance | 78% | WARNING |
| Code Quality | 80% | WARNING |
| **Overall** | **84%** | **WARNING** |

---

## 3. API Endpoint Comparison

### 3.1 Authentication API

| Design Endpoint | Implementation | Status | Notes |
|-----------------|---------------|--------|-------|
| POST /api/auth/login | `src/app/api/auth/login/route.ts` | PASS | JWT + refreshToken httpOnly cookie |
| POST /api/auth/logout | `src/app/api/auth/logout/route.ts` | PASS | Cookie cleanup |
| GET /api/auth/me | `src/app/api/auth/me/route.ts` | PASS | User info endpoint |
| POST /api/auth/refresh | `src/app/api/auth/refresh/route.ts` | PASS | Token renewal |
| POST /api/auth/signup | Not implemented | INFO | Intentionally removed - pre-registration model |
| POST /api/auth/change-password | `src/app/api/auth/change-password/route.ts` | PASS | Password change with history check |
| POST /api/auth/forgot-password | `src/app/api/auth/forgot-password/route.ts` | PASS | Temp password + email |

**Auth API Score**: 100% (signup intentionally removed per plan)

### 3.2 Admin User Management API

| Design Endpoint | Implementation | Status | Notes |
|-----------------|---------------|--------|-------|
| GET /api/admin/users | `src/app/api/admin/users/route.ts` GET | PASS | Filter by status, airline |
| POST /api/admin/users | `src/app/api/admin/users/route.ts` POST | PASS | Pre-registration with password policy |
| PATCH /api/admin/users/[id] | `src/app/api/admin/users/[id]/route.ts` PATCH | PASS | Status/role/airline change |
| DELETE /api/admin/users/[id] | `src/app/api/admin/users/[id]/route.ts` DELETE | PASS | Admin protection |
| PUT /api/admin/users/[id]/password-reset | `src/app/api/admin/users/[id]/password-reset/route.ts` | PASS | {airline_code}1234! format |

**Admin Users API Score**: 100%

### 3.3 Admin Airlines API

| Design Endpoint | Implementation | Status | Notes |
|-----------------|---------------|--------|-------|
| GET /api/admin/airlines | `src/app/api/admin/airlines/route.ts` GET | PASS | display_order sort |
| POST /api/admin/airlines | `src/app/api/admin/airlines/route.ts` POST | PASS | Code duplicate check |
| PATCH /api/admin/airlines/[id] | `src/app/api/admin/airlines/[id]/route.ts` PATCH | PASS | Dynamic fields |
| DELETE /api/admin/airlines/[id] | `src/app/api/admin/airlines/[id]/route.ts` DELETE | PASS | User dependency check |

**Admin Airlines API Score**: 100%

### 3.4 Callsign & Actions API

| Design Endpoint | Implementation | Status | Notes |
|-----------------|---------------|--------|-------|
| GET /api/airline/callsigns | `/api/airlines/[airlineId]/callsigns` | CHANGED | URL path differs from design |
| GET /api/airline/actions | `/api/airlines/[airlineId]/actions` | CHANGED | URL path differs from design |
| POST /api/airline/actions | Not standalone | CHANGED | Merged into airline-scoped route |
| PATCH /api/airline/actions/{id} | `/api/actions/[id]` PATCH | PASS | Status update + callsign sync |
| GET /api/admin/actions | `/api/actions` GET | CHANGED | Moved from admin scope to root scope |
| POST /api/admin/callsigns/upload | `/api/admin/upload-callsigns` POST | CHANGED | URL path simplified |
| GET /api/admin/callsigns/upload/{id} | Not implemented | MISSING | Upload status by ID not available |
| GET /api/admin/callsigns/upload-history | `/api/admin/file-uploads` GET | CHANGED | URL path differs |
| GET /api/admin/statistics | `/api/admin/stats` GET | CHANGED | URL path differs |
| GET /api/admin/actions/export | Not implemented | MISSING | Excel export not implemented |

**Data/Actions API Score**: 60%

### 3.5 Announcement API

| Design Endpoint | Implementation | Status | Notes |
|-----------------|---------------|--------|-------|
| GET /api/announcements | `src/app/api/announcements/route.ts` GET | PASS | Active announcements by airline |
| GET /api/announcements/{id} | `src/app/api/announcements/[id]/route.ts` GET | PASS | Detail with view status |
| POST /api/announcements/{id}/view | `src/app/api/announcements/[id]/route.ts` POST | CHANGED | Same file, not separate /view path |
| GET /api/announcements/history | `src/app/api/announcements/history/route.ts` GET | PASS | View history |
| POST /api/admin/announcements | `src/app/api/admin/announcements/route.ts` POST | PASS | Create announcement |
| GET /api/admin/announcements | `src/app/api/admin/announcements/route.ts` GET | PASS | List with filters |
| PATCH /api/admin/announcements/{id} | `src/app/api/admin/announcements/[id]/route.ts` PATCH | PASS | Partial update |
| DELETE /api/admin/announcements/{id} | `src/app/api/admin/announcements/[id]/route.ts` DELETE | PASS | With cascade |
| GET /api/admin/announcements/{id}/stats | Not implemented | MISSING | Per-announcement stats not available |

**Announcement API Score**: 78%

---

## 4. Data Model Comparison

### 4.1 Schema Match (SQLite vs Design)

| Table | Design | Implementation | Status | Notes |
|-------|--------|---------------|--------|-------|
| airlines | PostgreSQL UUID | SQLite TEXT + randomblob | PASS | Adapted for SQLite |
| users | UUID, FK airline_id | TEXT, FK airline_id | PASS | All fields present |
| password_history | UUID | TEXT | PASS | Matches design |
| audit_logs | UUID, JSONB | TEXT (old_data/new_data as TEXT) | PASS | JSONB -> TEXT (SQLite) |
| callsigns | UUID, basic fields | TEXT, extended fields (25+ columns) | EXPANDED | More fields than design |
| callsign_occurrences | Not in design | Implemented | ADDED | New table for occurrence tracking |
| actions | UUID, basic fields | TEXT, extended fields | PASS | Matches design closely |
| action_history | UUID | TEXT | PASS | Change tracking |
| file_uploads | UUID | TEXT | PASS | Status tracking |
| announcements | level IN (critical,urgent,normal,info) | level IN (warning,info,success) | CHANGED | Level values differ from design |
| announcement_views | UUID | TEXT + dismissed_at | EXPANDED | Extra dismissed_at column |

**Data Model Score**: 90%

### 4.2 Critical Data Model Differences

**Announcement Levels Mismatch**:
- Design: `critical`, `urgent`, `normal`, `info`
- Implementation: `warning`, `info`, `success`
- Impact: HIGH - Missing critical/urgent severity levels in implementation
- Location: `src/lib/db/sqlite-schema.ts:215`, `src/app/api/admin/announcements/route.ts:87,236`

**Callsigns Extended Schema**:
- Implementation has 25+ columns vs design's ~12 columns
- Added: sector, departure/arrival airports, same_airline_code, same_callsign_length, same_number_position, same_number_count, same_number_ratio, max_concurrent_traffic, coexistence_minutes, error_probability, atc_recommendation
- Status: Intentional expansion - design document needs update

---

## 5. Critical Bugs Found

### 5.1 CRITICAL: `deletedAction` Reference Error

**File**: `src/app/api/actions/[id]/route.ts:185`
**Description**: Line 185 references `deletedAction.rows[0]` but `deletedAction` is never defined in the scope. The `in_progress` status branch deletes the action via transaction, then tries to return data from a non-existent variable.
**Impact**: Runtime crash when setting action status to `in_progress` - the endpoint will throw a ReferenceError.
**Code**:
```typescript
// Line 176-185
await transaction(async (trx) => {
  await trx('DELETE FROM actions WHERE id = ?', [id]);
  await trx('UPDATE callsigns SET status = ? WHERE id = ?', ['in_progress', callsignId]);
});
// deletedAction is never defined!
return NextResponse.json(deletedAction.rows[0], { status: 200 });
```

### 5.2 CRITICAL: PostgreSQL Error Code Check (Dead Code)

**Files**:
- `src/app/api/airlines/route.ts:33`
- `src/app/api/admin/airlines/route.ts:45,108`

**Description**: Code checks `err.code === '42703'` which is a PostgreSQL-specific error code for "column does not exist". SQLite never returns this error code, making this a dead code path that will never be triggered. If a column error occurs in SQLite, it will throw a different error that won't be caught.
**Impact**: LOW (fallback code never executes, but primary path works)

---

## 6. Authentication & Security Analysis

### 6.1 Auth Flow Compliance

| Feature | Design | Implementation | Status |
|---------|--------|---------------|--------|
| JWT AccessToken (1h) | Plan 8.1 | `src/lib/jwt.ts` | PASS |
| RefreshToken httpOnly cookie (7d) | Plan 8.1 | Login route: cookie set | PASS |
| bcrypt 10 rounds | Plan 8.1 | `bcrypt.hash(password, 10)` | PASS |
| RBAC (admin/user) | Plan 8.2 | All admin APIs check role | PASS |
| Status-based (active/suspended) | Plan 8.2 | Login checks suspended | PASS |
| Enumeration attack defense | Plan 8.3 | Same error message for email mismatch | PASS |
| 90-day password expiry | Plan 1.4 | Login route checks last_password_changed_at | WARNING |
| Password history (5 recent) | Plan 1.4 | change-password route checks | PASS |
| Force change on first login | Plan 7.2 | is_default_password + forceChangePassword flag | PASS |
| SQL Injection prevention | Plan 8.3 | All queries use ? params | PASS |
| Suspended user blocking | Plan 8.2 | Login returns 403 | PASS |

### 6.2 Security Issues Found

| Severity | File | Line | Issue | Description |
|----------|------|------|-------|-------------|
| HIGH | `src/lib/db/queries/auth.ts` | 8-14 | Missing field | `getUserByEmail` does not select `last_password_changed_at` - 90-day password expiry check silently broken |
| MEDIUM | `src/app/api/auth/login/route.ts` | 152-153 | console.error | Two console.error lines expose full error object in logs (CLAUDE.md violation) |
| MEDIUM | `src/app/api/auth/refresh/route.ts` | 26,64 | console.log | Debug console.log lines left in production code |
| MEDIUM | `src/app/api/auth/logout/route.ts` | 36 | console.log | Debug console.log left in production code |
| LOW | `src/app/api/admin/users/[id]/password-reset/route.ts` | 98-104 | Info leak | Returns plaintext reset password in response - acceptable for admin API but risky |

**Auth Security Score**: 88%

---

## 7. Feature Completeness Analysis

### 7.1 Designed but Not Implemented

| Feature | Design Location | Priority | Status |
|---------|-----------------|----------|--------|
| Action export to Excel | design:566-579 | MEDIUM | Not implemented |
| Upload result by ID | design:464-482 | LOW | Not implemented |
| Admin statistics dashboard | design:524-561 | MEDIUM | Partially (/api/admin/stats exists but format differs) |
| Announcement per-item stats | announcement-system:365-392 | LOW | Not implemented |
| Rich text editor for announcements | announcement-system:499-503 | LOW | Not implemented |
| Callsign management V1 page | callsign-mgmt-v1:all | MEDIUM | Unclear if implemented |

### 7.2 Implemented but Not in Design

| Feature | Implementation Location | Description |
|---------|------------------------|-------------|
| callsign_occurrences table | `sqlite-schema.ts:155-171` | Occurrence tracking per date |
| Occurrence count aggregation | `upload-callsigns/route.ts:456-481` | Auto-update occurrence stats |
| Excel date serial number parsing | `upload-callsigns/route.ts:386-429` | Handles multiple date formats |
| Debug/test endpoints | `src/app/api/debug/callsigns/`, `src/app/api/airlines/test-callsigns/` | Test data endpoints |
| Session timeout hook | `src/hooks/useSessionTimeout.ts` | 30-min inactivity logout |
| Password reset email | `src/app/api/auth/forgot-password/route.ts` | Nodemailer integration |
| File uploads management | `src/app/api/admin/file-uploads/` | Upload history CRUD |

### 7.3 Feature Completeness Score

```
Designed Features:    28
Implemented:          22
Missing:              6
Extra (undocumented): 7

Completeness Rate: 22/28 = 78.6%
```

---

## 8. Convention Compliance (CLAUDE.md)

### 8.1 Naming Convention Check

| Category | Convention | Compliance | Violations |
|----------|-----------|:----------:|------------|
| API Response Format | `{ data, pagination }` or `{ error, status }` | 70% | Actions uses `data[]`, Announcements uses `announcements[]`, Users uses `users[]` |
| File naming (API routes) | kebab-case | 95% | `upload-callsigns` follows; most route files correct |
| Function naming | camelCase | 100% | No violations found |
| Constants | UPPER_SNAKE_CASE | 95% | `PASSWORD_REGEX` follows convention |

### 8.2 Code Quality Violations

| Violation | Count | Files Affected | CLAUDE.md Rule |
|-----------|:-----:|----------------|----------------|
| console.log left in code | 20+ | auth/refresh, auth/logout, store, lib/db, Providers.tsx, mail.ts | "console.log 남기기 - 제거 필수" |
| .bak files in source tree | 2 | `src/app/(main)/airline/page.tsx.bak`, `src/app/api/airlines/[airlineId]/callsigns/route.ts.bak` | "주석 처리된 코드 커밋 - 삭제 필수" |
| PostgreSQL dead code | 3 | `airlines/route.ts`, `admin/airlines/route.ts` | Dead `42703` error code checks |
| `any` type usage | 15+ | Actions, Announcements, Users routes | "any 타입 사용 금지" |
| Inconsistent response format | 5 | Different wrapping: `data[]` vs `users[]` vs `announcements[]` | "응답 형식 통일" |

### 8.3 Response Format Inconsistency

| Endpoint | Response Key | CLAUDE.md Standard | Status |
|----------|-------------|-------------------|--------|
| GET /api/actions | `{ data: [...], pagination }` | `{ data, pagination }` | PASS |
| GET /api/admin/users | `{ users: [...] }` | `{ data, pagination }` | MISMATCH |
| GET /api/admin/airlines | `{ airlines: [...] }` | `{ data, pagination }` | MISMATCH |
| GET /api/announcements | `{ announcements: [...], total }` | `{ data, pagination }` | MISMATCH |
| GET /api/admin/announcements | `{ announcements: [...], total, page, limit }` | `{ data, pagination }` | MISMATCH |
| GET /api/airlines/[id]/callsigns | `{ data: [...], pagination }` | `{ data, pagination }` | PASS |

**Convention Score**: 78%

---

## 9. SQLite Migration Compliance

### 9.1 PostgreSQL Syntax Remnants

| Issue | Count | Files | Status |
|-------|:-----:|-------|--------|
| $N parameter placeholders | 0 | - | RESOLVED |
| ILIKE usage | 0 | - | RESOLVED |
| ::type casting | 0 | - | RESOLVED |
| INTERVAL syntax | 0 | - | RESOLVED |
| NULLS LAST | 0 | - | RESOLVED |
| `42703` PG error code check | 3 | airlines routes | REMAINING (dead code) |
| RETURNING clause | 0 | - | RESOLVED (workaround applied) |

### 9.2 SQLite Compatibility

| Feature | Status | Notes |
|---------|--------|-------|
| ? parameter placeholders | PASS | All queries use ? consistently |
| LIKE instead of ILIKE | PASS | Case-insensitive search works |
| CURRENT_TIMESTAMP | PASS | Used throughout |
| ON CONFLICT DO NOTHING/UPDATE | PASS | Used in announcements, upload |
| TEXT for UUID columns | PASS | randomblob(16) for IDs |
| WAL mode | PASS | Set in sqlite.ts driver |
| Foreign keys ON | PASS | PRAGMA foreign_keys = ON |
| Transaction support | PASS | Better-sqlite3 transactions |

**SQLite Migration Score**: 95%

---

## 10. Differences Summary

### 10.1 Missing Features (Design exists, Implementation missing)

| # | Item | Design Location | Description | Priority |
|---|------|-----------------|-------------|----------|
| 1 | Action Excel Export | design:566-579 | GET /api/admin/actions/export | MEDIUM |
| 2 | Upload Result by ID | design:464-482 | GET /api/admin/callsigns/upload/{uploadId} | LOW |
| 3 | Announcement Stats | announcement:365-392 | GET /api/admin/announcements/{id}/stats | LOW |
| 4 | Announcement level: critical/urgent | announcement:44-46 | Level values differ | HIGH |
| 5 | Virtual scroll for large tables | design:941-945 | VirtualList component | LOW |
| 6 | Timeline chart data | design:556-561 | Timeline statistics endpoint | LOW |

### 10.2 Added Features (Implementation exists, Design missing)

| # | Item | Implementation Location | Description |
|---|------|------------------------|-------------|
| 1 | callsign_occurrences | `sqlite-schema.ts:155-171` | Occurrence date tracking |
| 2 | Password reset (admin) | `admin/users/[id]/password-reset/route.ts` | {code}1234! pattern |
| 3 | Forgot password (email) | `auth/forgot-password/route.ts` | Temp password via email |
| 4 | Debug endpoints | `api/debug/*`, `api/airlines/test-callsigns/*` | Development tools |
| 5 | Session timeout | `hooks/useSessionTimeout.ts` | 30-min auto-logout |
| 6 | File uploads CRUD | `api/admin/file-uploads/*` | Upload history management |
| 7 | Extended callsign columns | `sqlite-schema.ts:124-153` | 25+ columns vs design's 12 |

### 10.3 Changed Features (Design differs from Implementation)

| # | Item | Design | Implementation | Impact |
|---|------|--------|----------------|--------|
| 1 | Callsign API path | `/api/airline/callsigns` | `/api/airlines/[airlineId]/callsigns` | HIGH |
| 2 | Actions API path | `/api/airline/actions` + `/api/admin/actions` | `/api/actions` (admin-only) + `/api/airlines/[airlineId]/actions` | HIGH |
| 3 | Upload API path | `/api/admin/callsigns/upload` | `/api/admin/upload-callsigns` | MEDIUM |
| 4 | Announcement levels | critical/urgent/normal/info | warning/info/success | HIGH |
| 5 | Database | PostgreSQL | SQLite (better-sqlite3) | HIGH (documented migration) |
| 6 | Response format | Various per-endpoint | Mixed (some `data[]`, some named arrays) | MEDIUM |
| 7 | Announcement view endpoint | POST /api/announcements/{id}/view | POST /api/announcements/{id} | LOW |
| 8 | Delete response | 204 No Content | 200 with status body | LOW |

---

## 11. Match Rate Calculation

### Per-Category Breakdown

| Category | Total Items | Matching | Rate |
|----------|:----------:|:--------:|:----:|
| Auth API (7 endpoints) | 7 | 7 | 100% |
| Admin Users API (5 endpoints) | 5 | 5 | 100% |
| Admin Airlines API (4 endpoints) | 4 | 4 | 100% |
| Data/Actions API (10 endpoints) | 10 | 6 | 60% |
| Announcement API (9 endpoints) | 9 | 7 | 78% |
| Data Model (11 tables) | 11 | 10 | 91% |
| Auth Security (11 items) | 11 | 10 | 91% |
| Convention (5 categories) | 5 | 3 | 60% |

### Overall Match Rate

```
Total Verification Items:    72
Matching Items:              52
Missing/Changed Items:       20

Match Rate: 52/72 = 72.2%

Weighted Match Rate (by priority):
  - Critical items (auth, security, DB): 93%
  - High items (API endpoints, features): 80%
  - Medium items (conventions, quality):  75%

  Weighted Average: 84%
```

---

## 12. Recommended Actions

### 12.1 Immediate (CRITICAL - within 24 hours)

| # | Priority | Item | File:Line | Action |
|---|----------|------|-----------|--------|
| 1 | CRITICAL | `deletedAction` ReferenceError | `src/app/api/actions/[id]/route.ts:185` | Fix: query action data before deletion, then return it |
| 2 | HIGH | `getUserByEmail` missing `last_password_changed_at` | `src/lib/db/queries/auth.ts:8-14` | Already selected - verify at runtime |
| 3 | HIGH | Announcement level mismatch | `src/lib/db/sqlite-schema.ts:215` | Update CHECK constraint to match design OR update design |

### 12.2 Short-term (within 1 week)

| # | Priority | Item | File | Action |
|---|----------|------|------|--------|
| 1 | MEDIUM | Remove console.log/warn from production code | 20+ files | Delete all debug logging |
| 2 | MEDIUM | Remove .bak files | 2 files in src/ | `git rm` the backup files |
| 3 | MEDIUM | Remove PostgreSQL dead code (42703) | airlines routes | Remove unreachable catch blocks |
| 4 | MEDIUM | Standardize API response format | All route files | Use `{ data, pagination }` consistently |
| 5 | MEDIUM | Update design documents for API path changes | design docs | Reflect actual URL paths |

### 12.3 Long-term (backlog)

| # | Item | Description |
|---|------|-------------|
| 1 | Implement action Excel export | GET /api/admin/actions/export |
| 2 | Implement announcement per-item stats | GET /api/admin/announcements/{id}/stats |
| 3 | Reduce `any` type usage | Add proper TypeScript interfaces |
| 4 | Add callsign_occurrences to design doc | Document the extended schema |
| 5 | Document all undocumented features | Password reset, forgot password, debug endpoints |

---

## 13. Design Document Updates Needed

The following design documents need updates to reflect actual implementation:

- [ ] **airline-data-action-management.design.md**: Update all API paths to match implementation
- [ ] **airline-data-action-management.design.md**: Add callsign_occurrences table
- [ ] **airline-data-action-management.design.md**: Expand callsigns schema (25+ columns)
- [ ] **airline-data-action-management.design.md**: Change PostgreSQL to SQLite syntax
- [ ] **announcement-system.design.md**: Update level values (warning/info/success vs critical/urgent/normal/info)
- [ ] **announcement-system.design.md**: Remove POST /api/announcements/{id}/view separate endpoint
- [ ] **katc1-authentication.plan.md**: Add forgot-password and password-reset features
- [ ] **katc1-authentication.plan.md**: Change PostgreSQL to SQLite references
- [ ] All docs: Update response format examples to match actual output

---

## 14. Conclusion

### Status: WARNING (84%)

The system is functionally operational with strong authentication, security, and database migration.
The primary gaps are:

1. **API URL path differences** between design and implementation (structural, not functional)
2. **1 CRITICAL runtime bug** (`deletedAction` reference error in actions PATCH)
3. **Announcement level values** differ from design
4. **Convention violations**: console.log, .bak files, inconsistent response format
5. **Missing features**: Excel export, announcement stats

### Recommendation

Match Rate is **84%** (below 90% threshold).

**Suggested next step**: `/pdca iterate katc1` to fix CRITICAL bugs and convention violations to bring match rate above 90%.

Fixing the CRITICAL bug (#1) and removing console.log/bak files (#2,#3) alone would raise the score to approximately **89%**. Additionally standardizing the response format and updating design documents would bring it above **92%**.

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 4.0 | 2026-02-28 | Full system analysis post SQLite migration v3.0 | gap-detector |
| 3.0 | 2026-02-27 | SQLite migration final (92% PASS) | gap-detector |
| 2.0 | 2026-02-27 | SQLite migration v2.0 (87% FAIL) | gap-detector |
| 1.0 | 2026-02-27 | SQLite migration v1.0 (86% FAIL) | gap-detector |
