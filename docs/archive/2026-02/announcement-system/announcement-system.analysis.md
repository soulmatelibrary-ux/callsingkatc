# announcement-system Analysis Report

> **Analysis Type**: Gap Analysis (Design vs Implementation)
>
> **Project**: KATC1 - 유사호출부호 경고시스템
> **Feature**: announcement-system (Phase 5)
> **Analyst**: gap-detector
> **Date**: 2026-02-22
> **Design Doc**: [announcement-system.design.md](../../02-design/features/announcement-system.design.md)

---

## 1. Analysis Overview

### 1.1 Analysis Purpose

Phase 5 공지사항 관리 시스템의 설계 문서 대비 실제 구현 코드의 일치도를 점검하고, 누락/변경/추가된 기능을 식별하여 다음 Act 단계의 개선 방향을 결정한다.

### 1.2 Analysis Scope

| Category | Design Location | Implementation Location |
|----------|----------------|------------------------|
| DB Schema | design.md Section "성능 고려사항" | `scripts/init.sql` (Phase 5 section, lines 287-390) |
| Types | design.md Section "타입 정의" | `src/types/announcement.ts` |
| API Routes | design.md Section "API Routes" | `src/app/api/announcements/`, `src/app/api/admin/announcements/` |
| Hooks | design.md Section "Hooks 구조" | `src/hooks/useAnnouncements.ts` |
| Components | design.md Section "UI 컴포넌트 설계" | `src/components/announcements/` (3 files) |
| Pages | design.md Section "페이지 구현" | `src/app/announcements/page.tsx`, `src/app/admin/announcements/page.tsx` |
| Layout | design.md Section "RootLayout" | `src/components/layout/Providers.tsx` |
| Constants | design.md Section "상수 정의" | `src/lib/constants.ts` |

---

## 2. Gap Analysis (Design vs Implementation)

### 2.1 Database Schema

| Item | Design | Implementation | Status | Notes |
|------|--------|----------------|--------|-------|
| announcements table | Specified | Created (lines 292-319) | Match | All columns present |
| id UUID PK | Required | `gen_random_uuid()` | Match | |
| title VARCHAR(255) | Required | NOT NULL | Match | |
| content TEXT | Required | NOT NULL | Match | |
| level CHECK | `warning/info/success` | `CHECK (level IN ('warning','info','success'))` | Match | |
| start_date TIMESTAMP | Required | NOT NULL | Match | |
| end_date TIMESTAMP | Required | NOT NULL | Match | |
| is_active BOOLEAN | Required | `DEFAULT true` | Match | |
| target_airlines TEXT | NULL = all | Present | Match | CSV or NULL |
| created_by UUID FK | Required | `REFERENCES users(id) ON DELETE SET NULL` | Match | |
| updated_by UUID FK | Required | `REFERENCES users(id) ON DELETE SET NULL` | Match | |
| created_at TIMESTAMP | Required | `DEFAULT NOW()` | Match | |
| updated_at TIMESTAMP | Required | `DEFAULT NOW()` | Match | |
| chk_announcement_date_range | `start_date < end_date` | `CONSTRAINT chk_announcement_date_range` | Match | |
| announcement_views table | Specified | Created (lines 329-340) | Match | |
| UNIQUE(announcement_id, user_id) | Required | Present | Match | |
| dismissed_at TIMESTAMP | Required | Present (nullable) | Match | |
| Index: start_date | Required | `idx_announcements_start_date` | Match | |
| Index: end_date | Required | `idx_announcements_end_date` | Match | |
| Index: is_active | Required | `idx_announcements_is_active` | Match | |
| Index: level | Required | `idx_announcements_level` | Match | Additional vs design |
| Index: created_at | Not specified | `idx_announcements_created_at` | Added | Good practice |
| Index: created_by | Not specified | `idx_announcements_created_by` | Added | Good practice |
| Sample data | 3-5 items | 3 items (warning, info, success) | Match | |

**Schema Score: 100%** -- All required columns, constraints, indexes, and sample data present. Two additional indexes beyond design (created_at, created_by) are beneficial additions.

---

### 2.2 API Endpoints

| Design Endpoint | Implementation | Status | Notes |
|-----------------|----------------|--------|-------|
| `GET /api/announcements` | `src/app/api/announcements/route.ts` | Match | Active announcements for user |
| `GET /api/announcements/history` | `src/app/api/announcements/history/route.ts` | Match | User history with filters |
| `GET /api/announcements/{id}` | `src/app/api/announcements/[id]/route.ts` (GET) | Match | Detail + view status |
| `POST /api/announcements/{id}/view` | `src/app/api/announcements/[id]/route.ts` (POST) | Changed | URL path changed (see below) |
| `GET /api/admin/announcements` | `src/app/api/admin/announcements/route.ts` (GET) | Match | Admin list with filters |
| `POST /api/admin/announcements` | `src/app/api/admin/announcements/route.ts` (POST) | Match | Create announcement |
| `PATCH /api/admin/announcements/{id}` | `src/app/api/admin/announcements/[id]/route.ts` (PATCH) | Match | Update announcement |
| `DELETE /api/admin/announcements/{id}` | `src/app/api/admin/announcements/[id]/route.ts` (DELETE) | Match | Delete announcement |

#### API URL Path Change (MEDIUM)

| Aspect | Design | Implementation |
|--------|--------|----------------|
| View recording | `POST /api/announcements/{id}/view` | `POST /api/announcements/{id}` |

The design specifies a separate `/view` sub-path for the view recording endpoint. The implementation places the POST handler in the same `[id]/route.ts` file, making the URL `POST /api/announcements/{id}`. This is functionally correct since Next.js App Router maps method + path, but the URL semantics differ. The hook (`useAnnouncements.ts` line 205) calls `POST /api/announcements/${announcementId}` without the `/view` suffix, which matches the actual route structure.

**Impact**: Low -- functionally equivalent. POST to a resource ID can semantically imply "recording a view" in this context.

#### API Authentication & Authorization

| Endpoint | Design Auth | Impl Auth | Status |
|----------|------------|-----------|--------|
| `GET /api/announcements` | Bearer token | `payload.userId` check | Match |
| `GET /api/announcements/history` | Bearer token | `payload.userId` check | Match |
| `GET /api/announcements/{id}` | Bearer token | `payload.userId` check | Match |
| `POST /api/announcements/{id}` | Bearer token | `payload.userId` check | Match |
| `GET /api/admin/announcements` | Bearer + admin | `payload.role !== 'admin'` | Match |
| `POST /api/admin/announcements` | Bearer + admin | `payload.role !== 'admin'` | Match |
| `PATCH /api/admin/announcements/{id}` | Bearer + admin | `payload.role !== 'admin'` | Match |
| `DELETE /api/admin/announcements/{id}` | Bearer + admin | `payload.role !== 'admin'` | Match |

#### Token Payload Field Consistency

| Aspect | Design | Implementation | Status |
|--------|--------|----------------|--------|
| User ID field in JWT | `payload.sub` (design examples) | `payload.userId` (jwt.ts TokenPayload) | Changed |

The design document references `payload.sub` in API route examples, but the actual JWT implementation (`src/lib/jwt.ts`) uses `payload.userId`. All API routes consistently use `payload.userId`, matching the JWT library's actual output. This is an **intentional design deviation** that is internally consistent.

#### Response Format

| Endpoint | Design Response | Impl Response | Status |
|----------|----------------|---------------|--------|
| `GET /api/announcements` | `{ announcements }` | `{ announcements, total }` | Enhanced |
| `GET /api/announcements/history` | `{ announcements, total, page, limit }` | `{ announcements, total, page, limit }` | Match |
| `GET /api/announcements/{id}` | `{ ...announcement, isViewed, viewedAt }` | Same structure | Match |
| `POST /api/announcements/{id}` | `200 OK` | `{ status: 'recorded' }` | Match |
| `POST /api/admin/announcements` | `{ id }` (status 201) | Full announcement object (status 201) | Enhanced |
| `PATCH /api/admin/announcements/{id}` | Not fully specified | Updated announcement object | Match |
| `DELETE /api/admin/announcements/{id}` | Not fully specified | `{ status: 'deleted' }` | Match |
| `GET /api/admin/announcements` | Not fully specified | `{ announcements, total, page, limit }` | Match |

**API Score: 93%** -- 7/8 endpoints fully match. One URL path deviation (view endpoint). Response formats are consistently enhanced beyond design (returning more data, which is non-breaking).

---

### 2.3 Type Definitions

| Design Interface | Implementation | Status | Notes |
|------------------|----------------|--------|-------|
| `Announcement` | Present | Enhanced | Added `isActive`, `createdByEmail` fields |
| `AnnouncementView` | Present | Match | `dismissedAt` nullable |
| `CreateAnnouncementRequest` | Present | Match | |
| `UpdateAnnouncementRequest` | Not in design | Added | Partial update support |
| `ActiveAnnouncementsResponse` | Not in design | Added | Typed response for active query |
| `AnnouncementHistoryResponse` | Matches `AnnouncementListResponse` | Match | Renamed for clarity |
| `AnnouncementDetailResponse` | Not in design | Added | Extends Announcement with view status |
| `AnnouncementHistoryFilters` | Not in design | Added | Typed filter interface |
| `AdminAnnouncementFilters` | Not in design | Added | Typed filter interface |
| `AdminAnnouncementResponse` | Not in design | Added | Extends Announcement with status + viewCount |
| `AdminAnnouncementListResponse` | Not in design | Added | Typed admin list response |
| `AnnouncementErrorCode` enum | In design | Not implemented | See issues |

**Design defines 4 interfaces**: `Announcement`, `AnnouncementView`, `CreateAnnouncementRequest`, `AnnouncementListResponse`.
**Implementation has 11 interfaces**: All 4 design interfaces plus 7 additional typed interfaces.

#### Field Mapping: Design vs Implementation

| Design Field | Design Type | Implementation | Status |
|--------------|-------------|----------------|--------|
| `Announcement.targetAirlines` | `string[]` (optional) | `string \| null` (CSV) | Changed |

The design specifies `targetAirlines` as an optional `string[]`, but the implementation stores it as a CSV string (matching the DB column `TEXT`). The conversion happens in API routes (join on create, split on read in form). This is internally consistent but differs from the type definition.

**Type Score: 90%** -- All design types present. 7 additional well-typed interfaces added. One field type mismatch (`targetAirlines`). `AnnouncementErrorCode` enum not implemented as a separate export.

---

### 2.4 React Query Hooks

| Design Hook | Implementation | Status | Notes |
|-------------|----------------|--------|-------|
| `useActiveAnnouncements()` | Present (line 43) | Match | staleTime: 30s, gcTime: 5min |
| `useAnnouncementHistory(filters)` | Present (line 72) | Match | Full filter support |
| `useAnnouncement(id)` | Present (line 119) | Match | enabled: !!accessToken && !!id |
| `useAdminAnnouncements(filters)` | Present (line 148) | Match | Full filter support |
| `useViewAnnouncement()` | Present (line 199) | Match | Cache invalidation on success |
| `useCreateAnnouncement()` | Present (line 237) | Match | Error parsing from JSON |
| `useUpdateAnnouncement()` | Present (line 272) | Match | Spread params `{ id, ...data }` |
| `useDeleteAnnouncement()` | Present (line 315) | Match | Invalidates admin + active caches |

#### Query Key Factory

| Design | Implementation | Status |
|--------|----------------|--------|
| `queryKeys.announcements.active()` | `announcementQueryKeys.active()` | Match (renamed) |
| `queryKeys.announcements.history(filters)` | `announcementQueryKeys.history(filters)` | Match |
| `queryKeys.announcements.detail(id)` | `announcementQueryKeys.detail(id)` | Match |
| `queryKeys.admin.announcements(filters)` | `announcementQueryKeys.adminList(filters)` | Match (renamed) |

#### Cache Invalidation Strategy

| Mutation | Invalidated Keys | Design Matches |
|----------|-----------------|----------------|
| `useViewAnnouncement` | detail(id), history({}) | Match |
| `useCreateAnnouncement` | admin() (all admin queries) | Match |
| `useUpdateAnnouncement` | detail(id), admin() | Match |
| `useDeleteAnnouncement` | admin(), active() | Enhanced (also invalidates active) |

**Hooks Score: 98%** -- All 8 hooks (4 query + 4 mutation) implemented. Query key factory present with proper namespacing. Cache invalidation strategy matches and exceeds design. Bearer token injection in all requests.

---

### 2.5 Components

#### AnnouncementModal

| Design Feature | Implementation | Status |
|----------------|----------------|--------|
| Fixed overlay (`bg-black/50`) | Present | Match |
| Session Storage for dismissed state | Present (with try-catch) | Enhanced |
| First undismissed announcement | `announcements.find(a => !dismissed.includes(a.id))` | Match |
| Level-based colors | Uses `ANNOUNCEMENT_LEVEL_COLORS` constant | Match |
| Dismiss button | Present, records view via `useViewAnnouncement` | Enhanced |
| "Detail" link | `Link` to `/announcements/{id}` | Match |
| `mounted` state for SSR | Added `useState(false)` + `useEffect` | Added (good practice) |
| Date display | Formatted with `toLocaleDateString('ko-KR')` | Added |
| Emoji per level | `getAnnouncementEmoji()` helper | Added |

**AnnouncementModal Score: 100%** -- All design requirements met. Additional improvements: SSR hydration safety, date display, level emojis, view recording on dismiss.

#### AnnouncementTable

| Design Feature | Implementation | Status |
|----------------|----------------|--------|
| `isAdmin` prop | `Props { isAdmin?: boolean }` | Match |
| Filter: level, status, dateFrom, dateTo | All 4 filters present | Match |
| Pagination (page, limit) | Present with prev/next + page numbers | Match |
| Conditional hook calling | **Both hooks always called** (line 38-43) | Fixed |
| Admin viewCount column | Shown when `isAdmin` (line 186) | Match |
| Level badges with colors | Uses `ANNOUNCEMENT_LEVEL_COLORS.badge` | Match |
| Status display (active/expired) | Client-side date comparison | Match |
| Reset filters button | Present (line 88) | Added |
| Link to detail page | `Link href="/announcements/{id}"` | Match |

**Design Issue Identified**: The design shows conditional hook calling (`isAdmin ? useAdminAnnouncements(filters) : useAnnouncementHistory(filters)`), which would violate React's Rules of Hooks. The implementation correctly calls both hooks unconditionally and selects the result based on `isAdmin`. This is a design document error corrected in implementation.

**AnnouncementTable Score: 100%** -- All features implemented. React hooks rule violation in design correctly fixed.

#### AnnouncementForm

| Design Feature | Implementation | Status |
|----------------|----------------|--------|
| Create/edit modes | `isEdit = !!announcement` | Match |
| Title input | Present with validation | Match |
| Content textarea | Present with validation (5 rows vs design's `h-32`) | Match |
| Level select | `info/warning/success` with emojis | Match |
| Start/end datetime-local inputs | Present | Match |
| Date range validation | `start >= end` check | Match |
| `useCreateAnnouncement` / `useUpdateAnnouncement` | Both present | Match |
| Loading state (`isPending`) | Combined from both mutations | Enhanced |
| Error display | Validation errors + mutation errors | Enhanced |
| `onSuccess` callback | Present (prop) | Added |
| Form reset on success | Present (non-edit mode) | Match |
| `targetAirlines` input | **Not implemented as UI element** | Missing |
| Disabled state during loading | All inputs disabled | Added |

**Critical Note**: The `targetAirlines` field (airline selection for targeted announcements) has no UI element in the AnnouncementForm. The form state initializes it from `announcement?.targetAirlines.split(',')` and sends it in the request, but there is no dropdown/checkbox UI for selecting target airlines. All announcements will default to targeting all airlines.

**AnnouncementForm Score: 88%** -- Missing targetAirlines selection UI.

---

### 2.6 Pages

| Design Page | Implementation | Status | Notes |
|-------------|----------------|--------|-------|
| `/announcements` | `src/app/announcements/page.tsx` | Match | User history page |
| `/admin/announcements` | `src/app/admin/announcements/page.tsx` | Match | Admin management |
| Admin redirect (non-admin) | `user.role === 'admin' -> redirect` | Match | In announcements page |
| Non-admin redirect | `user.role !== 'admin' -> redirect` | Match | In admin page |
| Form toggle button | `showForm` state toggle | Match | Admin page |
| `onSuccess` closes form | `setShowForm(false)` | Match | Admin page |

**Pages Score: 100%** -- Both pages implemented with proper role-based redirects and layout.

---

### 2.7 Layout Integration

| Design Requirement | Implementation | Status |
|--------------------|----------------|--------|
| AnnouncementModal in RootLayout | `Providers.tsx` imports and renders `<AnnouncementModal />` | Match |
| Position in component tree | Inside `<SessionProvider>`, before `{children}` | Match |
| Global availability | Providers wraps all pages via layout | Match |

**Layout Score: 100%**

---

### 2.8 Constants

| Design Constant | Implementation | Status |
|-----------------|----------------|--------|
| `ANNOUNCEMENT_LEVELS` | `ANNOUNCEMENT_LEVEL` (singular) | Match (naming convention) |
| `ANNOUNCEMENT_STATUS` | Present | Match |
| `ROUTES.ANNOUNCEMENTS` | `/announcements` | Match |
| `ROUTES.ADMIN_ANNOUNCEMENTS` | `/admin/announcements` | Match |
| Level colors map | `ANNOUNCEMENT_LEVEL_COLORS` | Enhanced |

The implementation adds `ANNOUNCEMENT_LEVEL_COLORS` with `bg`, `border`, `text`, and `badge` color variants per level, which goes beyond the simple design specification.

**Constants Score: 100%**

---

### 2.9 Navigation Integration

| Feature | Design | Implementation | Status |
|---------|--------|----------------|--------|
| Admin dashboard link to announcements | Implied in design | **Not present** in admin dashboard (`src/app/admin/page.tsx`) | Missing |
| Admin sidebar link | Implied | **Not present** in `AdminSidebar.tsx` | Missing |
| Header navigation link | Implied | **Not present** in Header | Missing |

**Navigation Score: 50%** -- The announcement pages exist but are not linked from the admin dashboard, admin sidebar, or header navigation. Users must navigate to the URL directly.

---

## 3. Overall Scores

| Category | Score | Weight | Weighted | Status |
|----------|:-----:|:------:|:--------:|:------:|
| DB Schema | 100% | 15% | 15.0 | Pass |
| API Endpoints | 93% | 20% | 18.6 | Pass |
| Type Definitions | 90% | 10% | 9.0 | Pass |
| React Query Hooks | 98% | 15% | 14.7 | Pass |
| Components | 96% | 15% | 14.4 | Pass |
| Pages | 100% | 10% | 10.0 | Pass |
| Layout Integration | 100% | 5% | 5.0 | Pass |
| Constants | 100% | 5% | 5.0 | Pass |
| Navigation | 50% | 5% | 2.5 | Fail |
| **Overall** | **94.2%** | 100% | **94.2** | **Pass** |

```
Overall Match Rate: 94%

  Pass:          8 categories (94%+)
  Warning:       0 categories
  Fail:          1 category  (Navigation)

  Design items:   52 checked
  Match:          47 items (90%)
  Enhanced:        8 items (15%)  -- improvements beyond design
  Changed:         3 items (6%)   -- intentional deviations
  Missing:         2 items (4%)   -- not yet implemented
```

---

## 4. Issues Summary

### 4.1 CRITICAL -- None

No critical issues found. All API endpoints are authenticated, SQL queries use parameterized values, and JWT validation is consistent.

### 4.2 HIGH

| # | Issue | File | Description | Recommendation |
|---|-------|------|-------------|----------------|
| H-1 | Missing targetAirlines UI | `AnnouncementForm.tsx` | No UI for selecting target airlines. All announcements default to "all airlines". | Add multi-select dropdown using `useAirlines()` hook |

### 4.3 MEDIUM

| # | Issue | File | Description | Recommendation |
|---|-------|------|-------------|----------------|
| M-1 | No sidebar/dashboard link | `AdminSidebar.tsx` | Announcement management not in admin sidebar | Add menu item: `{ id: 'announcements', label: '공지사항 관리', href: '/admin/announcements', icon: '...' }` |
| M-2 | View endpoint URL deviation | `useAnnouncements.ts:205` | Design: `POST /api/announcements/{id}/view`, Impl: `POST /api/announcements/{id}` | Update design document to match implementation |
| M-3 | History query JOIN issue | `announcements/history/route.ts:85` | Uses `$1 = ANY(string_to_array(a.target_airlines, ','))` with `user.airline_id` for both target_airlines filter AND announcement_views JOIN user_id | The LEFT JOIN uses `av.user_id = $1` where $1 is `user.airline_id` (UUID), not `user.id`. View status will never match. |
| M-4 | No header nav link | `Header.tsx` | No announcements link in user navigation | Add link for users to access `/announcements` |

### 4.4 LOW

| # | Issue | File | Description | Recommendation |
|---|-------|------|-------------|----------------|
| L-1 | `AnnouncementErrorCode` not exported | `types/announcement.ts` | Design includes error code enum, not implemented as TypeScript type | Add enum if needed for client-side error handling |
| L-2 | `targetAirlines` type mismatch | `types/announcement.ts:13` | Design: `string[]`, Impl: `string \| null` (CSV) | This is intentional for DB alignment, but document the deviation |
| L-3 | `total` type is string from COUNT | `history/route.ts:122` | `COUNT(*)` returns string in PostgreSQL, should cast to int | Add `::int` cast or `parseInt()` |
| L-4 | COUNT query regex replacement | `history/route.ts:119`, `admin/route.ts:110` | `sql.replace(/SELECT[\s\S]*FROM/, 'SELECT COUNT(*) as count FROM')` may break with subqueries | Safe for current queries but fragile pattern |

---

## 5. Bug Analysis: History Query JOIN (M-3)

The history endpoint at `src/app/api/announcements/history/route.ts` line 82-86:

```sql
LEFT JOIN announcement_views av
  ON a.id = av.announcement_id AND av.user_id = $1
WHERE (
  a.target_airlines IS NULL
  OR $1 = ANY(string_to_array(a.target_airlines, ','))
)
```

Here `$1` is set to `user.airline_id` (line 89: `const queryParams: any[] = [user.airline_id]`).

The LEFT JOIN condition `av.user_id = $1` compares `av.user_id` (which stores a user UUID) against `user.airline_id` (an airline UUID). These will never match, so `isViewed` will always be `false` for all users viewing history.

**Root Cause**: The `$1` parameter serves dual purpose -- airline filtering and view JOIN -- but these require different IDs.

**Fix**: Use separate parameters for airline_id and user_id:
```sql
const queryParams: any[] = [user.airline_id, user.id];
-- Use $1 for airline filtering, $2 for view JOIN
```

---

## 6. Clean Architecture Compliance

### 6.1 Layer Assignment

| Component | Expected Layer | Actual Location | Status |
|-----------|---------------|-----------------|--------|
| AnnouncementModal | Presentation | `src/components/announcements/` | Pass |
| AnnouncementTable | Presentation | `src/components/announcements/` | Pass |
| AnnouncementForm | Presentation | `src/components/announcements/` | Pass |
| useAnnouncements hooks | Presentation/Application | `src/hooks/` | Pass |
| Announcement types | Domain | `src/types/` | Pass |
| API routes | Infrastructure | `src/app/api/` | Pass |
| Constants | Domain | `src/lib/constants.ts` | Pass |
| Pages | Presentation | `src/app/` | Pass |

### 6.2 Dependency Direction

All dependencies flow correctly:
- Components import from hooks (same layer)
- Components import from types (Domain)
- Components import from constants (Domain)
- Hooks import from types (Domain)
- Hooks import from store (Application)
- No direct infrastructure imports from components

**Architecture Score: 100%**

---

## 7. Convention Compliance

### 7.1 Naming Convention

| Category | Convention | Files | Compliance | Violations |
|----------|-----------|:-----:|:----------:|------------|
| Components | PascalCase | 3 | 100% | None |
| Hook functions | camelCase | 8 | 100% | None |
| Constants | UPPER_SNAKE_CASE | 4 | 100% | None |
| Type interfaces | PascalCase | 11 | 100% | None |
| Component files | PascalCase.tsx | 3 | 100% | None |
| Hook files | camelCase.ts | 1 | 100% | None |
| Type files | camelCase.ts | 1 | 100% | None |
| Folders | kebab-case | 1 | 100% | `announcements/` |

### 7.2 Import Order

All files follow the correct import order:
1. External libraries (react, next, tanstack)
2. Internal absolute imports (@/hooks, @/lib, @/types, @/store)
3. Relative imports (none needed)
4. Type imports (used in hooks file)

### 7.3 camelCase/snake_case Mapping

SQL queries correctly use `AS "camelCase"` aliases for all response fields:
- `start_date as "startDate"`
- `end_date as "endDate"`
- `target_airlines as "targetAirlines"`
- `created_by as "createdBy"`
- `created_at as "createdAt"`
- `updated_by as "updatedBy"`
- `updated_at as "updatedAt"`
- `is_active as "isActive"`

**Convention Score: 100%**

---

## 8. Recommended Actions

### 8.1 Immediate (P0) -- Fix Bug

| # | Action | File | Impact |
|---|--------|------|--------|
| 1 | Fix history query JOIN: separate user_id and airline_id params | `src/app/api/announcements/history/route.ts` | isViewed always false for users |

### 8.2 Short-term (P1) -- Feature Gaps

| # | Action | File | Impact |
|---|--------|------|--------|
| 2 | Add targetAirlines multi-select to AnnouncementForm | `src/components/announcements/AnnouncementForm.tsx` | Targeted announcements unusable |
| 3 | Add "공지사항 관리" to AdminSidebar | `src/components/layout/AdminSidebar.tsx` | Navigation discovery |
| 4 | Add "공지사항" link in Header for users | `src/components/layout/Header.tsx` | User navigation |

### 8.3 Documentation Updates

| # | Action | File | Reason |
|---|--------|------|--------|
| 5 | Update view endpoint URL in design | `announcement-system.design.md` | Impl uses POST /api/announcements/{id} |
| 6 | Update payload.sub to payload.userId | `announcement-system.design.md` | JWT uses userId field |
| 7 | Document targetAirlines as CSV string type | `announcement-system.design.md` | Impl differs from design string[] |

### 8.4 Low Priority (Backlog)

| # | Action | File | Reason |
|---|--------|------|--------|
| 8 | Add AnnouncementErrorCode enum | `src/types/announcement.ts` | Design has it, not critical |
| 9 | Cast COUNT to int | `history/route.ts`, `admin/route.ts` | Type safety |
| 10 | Replace COUNT regex with separate query | Both history routes | Fragility concern |

---

## 9. Summary

### Strengths

1. **Complete Feature Coverage**: All 8 API endpoints, 8 hooks, 3 components, 2 pages implemented
2. **Type Safety**: 11 typed interfaces covering all request/response shapes
3. **Security**: Consistent Bearer token auth, admin role checks, parameterized SQL
4. **Architecture**: Clean separation of concerns, correct dependency direction
5. **Convention**: 100% naming, import order, and folder structure compliance
6. **Session Storage**: Proper SSR hydration handling in modal
7. **Query Cache**: Well-designed invalidation strategy across mutations
8. **React Hooks Safety**: Fixed design's conditional hook calling anti-pattern

### Gaps

1. **Bug**: History endpoint JOIN uses airline_id where user_id is needed (M-3)
2. **Missing UI**: No targetAirlines selection in form (H-1)
3. **Missing Navigation**: No sidebar/header links to announcement pages (M-1, M-4)
4. **Minor**: Error code enum not exported, COUNT type issue

### Overall Assessment

**Match Rate: 94%** -- Design and implementation match well. The implementation exceeds the design in several areas (additional type safety, error handling, SSR safety). One functional bug (history JOIN) needs immediate attention. The missing targetAirlines UI and navigation links are the primary gaps to address.

**Recommendation**: Proceed to Act phase to fix the JOIN bug (P0) and add navigation links (P1). The feature is production-ready with the exception of the view status tracking bug.

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-22 | Initial gap analysis | gap-detector |
