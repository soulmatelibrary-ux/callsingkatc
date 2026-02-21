# Callsigns & Actions Management System Planning Document

> **Summary**: Phase 6 core feature plan for KATC1 - completing the callsigns and actions management system by closing gaps between existing partial implementations and production-ready state.
>
> **Project**: KATC1 항공사 유사호출부호 경고시스템
> **Version**: 1.0.0
> **Author**: Product Manager
> **Date**: 2026-02-22
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

Phase 6 targets the completion and hardening of the core operational feature of KATC1: managing similar/conflicting airline callsigns (유사호출부호) and tracking remedial actions (조치 이력). Partial implementations exist across the codebase (API routes, hooks, pages) but several critical gaps remain that prevent the system from being production-ready.

The goal is not to rebuild from scratch. It is to close the gap between what is partially built and what is needed for a complete, reliable, role-differentiated user experience.

### 1.2 Background

Previous phases delivered:
- Phase 1-3: Authentication, user management, routing
- Phase 4 (partial): Database schema, type definitions, several API routes, TanStack Query hooks, and initial UI for the airline page (`/airline`) and admin actions page (`/admin/actions`)
- Phase 5: Login UI improvements

What is currently in production code but incomplete or broken:
1. `/api/admin/upload-callsigns` exists but has no corresponding admin UI for triggering uploads or viewing upload history
2. Admin statistics page (`/api/admin/stats`) covers only user stats, not callsign/action stats
3. The `callsign_occurrences` table is referenced in upload logic but not defined in the visible schema plan
4. The airline user dashboard (`/airline`) has no Excel export function wired up (button renders but handler is empty)
5. Admin actions page (`/admin/actions`) has a "조치 등록" modal but no admin-level callsign management (CRUD)
6. No admin UI exists for managing callsigns directly (add, edit, delete, view full list)
7. No upload history viewer exists in the admin UI
8. Statistics on the `/airline` page are computed from paginated data only, not total dataset

### 1.3 Related Documents

- Previous Plan: `/docs/01-plan/features/airline-data-action-management.plan.md`
- Auth Plan: `/docs/01-plan/features/katc1-authentication.plan.md`
- Existing Implementation: `src/app/(main)/airline/page.tsx`, `src/app/admin/actions/page.tsx`, `src/app/api/admin/upload-callsigns/route.ts`

---

## 2. Scope

### 2.1 In Scope

- [ ] Admin callsigns management page (`/admin/callsigns`) - list, add, edit, delete
- [ ] Admin Excel upload UI with upload history viewer (`/admin/callsigns` or sub-section)
- [ ] Admin-level statistics API (`/api/admin/statistics`) covering callsigns and actions, not just users
- [ ] Admin statistics dashboard widget or section showing callsign/action KPIs
- [ ] Wiring Excel export on the airline user page (`/airline`, incidents tab)
- [ ] Statistics tab data accuracy fix: use total dataset counts, not paginated subset
- [ ] Action edit/delete from admin actions page (currently only creates)
- [ ] Callsign detail view modal from admin callsigns list

### 2.2 Out of Scope

- Real-time notifications or webhooks
- AI-driven action suggestions
- External system integrations (ICAO, ACARS)
- Multi-language support beyond Korean
- PDF export (Excel only)
- OAuth or 2FA changes
- Mobile native app

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | Admin can view complete list of all callsigns across all airlines with filtering by airline, risk level, and status | Must | Pending |
| FR-02 | Admin can manually create a new callsign entry via form | Must | Pending |
| FR-03 | Admin can edit an existing callsign (risk level, error type, sub error, status) | Must | Pending |
| FR-04 | Admin can delete a callsign (with confirmation dialog; blocked if active actions exist) | Must | Pending |
| FR-05 | Admin can upload Excel file and see upload result summary (inserted/updated/failed counts) | Must | Partial - API exists, UI missing |
| FR-06 | Admin can view upload history list with timestamps, filenames, and result counts | Should | Pending |
| FR-07 | Admin can view aggregate statistics: total callsigns by risk level, total actions by status, per-airline completion rate | Must | Partial - user stats only |
| FR-08 | Admin can update action status (pending / in_progress / completed) and add result details from the actions list page | Must | Partial - create works, update from admin page unverified |
| FR-09 | Airline user can export visible callsign list to Excel from the incidents tab | Must | Partial - button renders, handler empty |
| FR-10 | Statistics tab on airline page must reflect total dataset counts, not current page subset | Should | Pending |
| FR-11 | Admin actions page shows actions for all airlines with correct airline name column | Must | Partial |
| FR-12 | Callsign detail modal accessible from admin callsigns list for viewing full callsign metadata | Should | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|--------------------|
| Performance | API list endpoints respond in under 500ms for up to 1000 rows | Browser DevTools Network tab |
| Performance | Excel upload processes up to 5000 rows in under 10 seconds | Upload timing in UI |
| Security | All admin endpoints verify Bearer token + role=admin | Manual API test with invalid token |
| Security | Airline user endpoints filter data to their own airline_id; no cross-airline data leakage | Role-differentiated test users |
| Reliability | Excel upload failures update file_uploads status to 'failed' and return row-level error list | Test with malformed file |
| Usability | Filter state persists within the current session (no reset on tab switch) | Manual UI test |
| Accessibility | All interactive controls have visible focus state and aria-label where icon-only | Visual inspection |

---

## 4. User Personas and Stories

### Persona A: 관리자 (Admin)
System administrator responsible for maintaining callsign data, approving users, and monitoring airline compliance.

**Stories:**
- As an admin, I want to upload this month's Excel callsign file so that the system database reflects the latest KATC data
- As an admin, I want to see how many callsigns were added or updated after each upload so that I can confirm data integrity
- As an admin, I want to manually correct a callsign's risk level so that data errors from Excel can be fixed without re-uploading
- As an admin, I want to see which airlines have the most pending actions so that I can follow up with non-compliant airlines
- As an admin, I want to export action data filtered by date range to prepare monthly reports

### Persona B: 항공사 담당자 (Airline User)
Airline safety officer who monitors their airline's callsign risk list and manages remediation actions.

**Stories:**
- As an airline user, I want to see all active callsign warnings for my airline filtered by date range so that I can review recent incidents
- As an airline user, I want to register a remedial action for a callsign so that I can document our response
- As an airline user, I want to update my action from in_progress to completed so that the system reflects our finished work
- As an airline user, I want to export my callsign data to Excel for offline reporting to my management
- As an airline user, I want to view overall action statistics (completion rate, average days) for my airline

---

## 5. Core Functional Requirements with Acceptance Criteria

### FR-01: Admin Callsigns List Page

**Acceptance Criteria:**
- Page at `/admin/callsigns` loads with paginated table of all callsigns
- Table columns: airline code, callsign pair, risk level, error type, status, occurrence count, last occurred date
- Filter controls: airline dropdown, risk level dropdown, status dropdown
- Search input filters by callsign pair text
- Pagination with configurable page size (10, 20, 50)

### FR-02: Admin Create Callsign

**Acceptance Criteria:**
- "새 호출부호 등록" button opens a modal form
- Form fields: airline (required dropdown), callsign pair (required), my callsign, other callsign, other airline code, risk level (required), similarity, error type, sub error
- On submit, POST to `/api/admin/callsigns` and refresh list
- Duplicate callsign_pair + airline_code returns 409 with user-facing error message

### FR-03: Admin Edit Callsign

**Acceptance Criteria:**
- Edit button in each table row opens pre-filled modal form
- Editable fields: risk level, similarity, error type, sub error, status (active/inactive/completed)
- Non-editable: callsign pair (requires delete + re-create to change)
- On submit, PATCH to `/api/admin/callsigns/:id` and refresh list

### FR-04: Admin Delete Callsign

**Acceptance Criteria:**
- Delete button shows confirmation dialog with callsign pair displayed
- If the callsign has active (non-completed) actions, deletion is blocked with error message listing action count
- On confirm, DELETE to `/api/admin/callsigns/:id`

### FR-05: Excel Upload UI

**Acceptance Criteria:**
- Upload zone (drag-and-drop or file picker) accepts `.xlsx` and `.xls` only
- On upload, progress indicator displays "처리 중..."
- On completion, summary card shows: total rows processed, inserted count, updated count, failed count
- If there are row-level errors, show first 10 errors in expandable list

### FR-06: Upload History

**Acceptance Criteria:**
- Upload history section shows last 20 uploads in reverse chronological order
- Table columns: filename, uploaded at, total rows, success count, failed count, status badge
- Failed uploads link to error detail (stored in file_uploads.error_message)

### FR-07: Admin Statistics

**Acceptance Criteria:**
- Statistics section (on admin dashboard or dedicated `/admin/statistics` page) shows:
  - Total callsigns by risk level (three counters: 매우높음, 높음, 낮음)
  - Total actions by status (pending, in_progress, completed)
  - Per-airline table: airline name, total callsigns, total actions, pending count, completion rate %
- Data refreshes on page load (staleTime 60 seconds)

### FR-08: Admin Action Update

**Acceptance Criteria:**
- Each action row in `/admin/actions` has an edit button
- Clicking edit opens ActionModal pre-filled with action data
- Admin can change status, result detail, manager name, completed date
- On save, PATCH to `/api/actions/:id`

### FR-09: Airline User Excel Export

**Acceptance Criteria:**
- "Excel 내보내기" button in the incidents tab generates and downloads an `.xlsx` file
- File columns: 호출부호 쌍, 내 호출부호, 상대 호출부호, 위험도, 유사성, 오류 유형, 세부 오류, 발생건수, 최초 발생일, 최근 발생일
- Export applies current active date filter
- File name pattern: `callsigns_{airlineCode}_{YYYY-MM-DD}.xlsx`

### FR-10: Statistics Tab Accuracy

**Acceptance Criteria:**
- Statistics tab KPIs (total count, completion rate, average days) query the API for full dataset totals, not paginated page data
- `/api/actions` responds with a `statistics` object containing aggregate counts at top level independent of pagination

### FR-11: Admin Actions - Airline Name Column

**Acceptance Criteria:**
- Actions table in `/admin/actions` shows airline name (Korean name) not just airline_id
- JOIN with airlines table in API query

### FR-12: Callsign Detail Modal

**Acceptance Criteria:**
- Clicking a callsign row in `/admin/callsigns` opens a read-only detail modal
- Detail modal shows all callsign fields including occurrence history if available

---

## 6. Database Schema Overview

The following tables must exist and be consistent with the implementation. This section captures confirmed schema based on existing code analysis.

### callsigns
```
id UUID PK
airline_id UUID FK -> airlines.id
airline_code VARCHAR(10)
callsign_pair VARCHAR(50)       -- "KAL852 | AAR852"
my_callsign VARCHAR(20)
other_callsign VARCHAR(20)
other_airline_code VARCHAR(10)
error_type VARCHAR(30)
sub_error VARCHAR(30)
risk_level VARCHAR(20)          -- "매우높음" | "높음" | "낮음"
similarity VARCHAR(20)
occurrence_count INT DEFAULT 0
last_occurred_at TIMESTAMP
file_upload_id UUID FK -> file_uploads.id
uploaded_at TIMESTAMP
status VARCHAR(20) DEFAULT 'in_progress'  -- 'in_progress' | 'completed'
created_at TIMESTAMP
updated_at TIMESTAMP
UNIQUE(airline_code, callsign_pair)
```

### callsign_occurrences (confirmed from upload route)
```
id UUID PK
callsign_id UUID FK -> callsigns.id
occurred_date DATE
error_type VARCHAR(30)
sub_error VARCHAR(30)
file_upload_id UUID FK -> file_uploads.id
UNIQUE(callsign_id, occurred_date)
```

### actions
```
id UUID PK
airline_id UUID FK -> airlines.id
callsign_id UUID FK -> callsigns.id
action_type VARCHAR(100)
description TEXT
manager_name VARCHAR(100)
manager_email VARCHAR(255)
planned_due_date DATE
status VARCHAR(20) DEFAULT 'pending'  -- 'pending' | 'in_progress' | 'completed'
result_detail TEXT
completed_at TIMESTAMP
registered_by UUID FK -> users.id
registered_at TIMESTAMP
updated_at TIMESTAMP
reviewed_by UUID FK -> users.id
reviewed_at TIMESTAMP
review_comment TEXT
```

### action_history
```
id UUID PK
action_id UUID FK -> actions.id ON DELETE CASCADE
changed_by UUID FK -> users.id
changed_at TIMESTAMP
field_name VARCHAR(50)
old_value TEXT
new_value TEXT
```

### file_uploads
```
id UUID PK
file_name VARCHAR(255)
file_size INT
uploaded_by UUID FK -> users.id
uploaded_at TIMESTAMP
total_rows INT DEFAULT 0
success_count INT DEFAULT 0
failed_count INT DEFAULT 0
error_message TEXT
status VARCHAR(20) DEFAULT 'pending'  -- 'pending' | 'processing' | 'completed' | 'failed'
processed_at TIMESTAMP
```

### New API Endpoints Required

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | /api/admin/callsigns | admin | All callsigns with filters |
| POST | /api/admin/callsigns | admin | Create callsign |
| PATCH | /api/admin/callsigns/[id] | admin | Update callsign |
| DELETE | /api/admin/callsigns/[id] | admin | Delete callsign |
| GET | /api/admin/uploads | admin | Upload history list |
| GET | /api/admin/statistics | admin | Aggregated callsign/action stats |
| GET | /api/admin/actions/export | admin | Download Excel of filtered actions |

---

## 7. UI / Pages Overview

### Pages to Create

| Path | Role | Description |
|------|------|-------------|
| `/admin/callsigns` | Admin | Callsigns CRUD management table + Excel upload zone + upload history |

### Pages to Update

| Path | Changes |
|------|---------|
| `/admin/actions` | Add edit button per row wired to ActionModal, add airline name column |
| `/admin` (dashboard) | Add callsign/action statistics widgets |
| `/(main)/airline` | Wire Excel export button in incidents tab, fix statistics tab data source |

### Component Inventory

**New components to build:**

| Component | Purpose |
|-----------|---------|
| `src/components/callsigns/CallsignModal.tsx` | Create/Edit callsign form modal |
| `src/components/callsigns/CallsignDetailModal.tsx` | Read-only callsign detail |
| `src/components/callsigns/CallsignTable.tsx` | Admin callsigns list table with actions |
| `src/components/uploads/FileUploadZone.tsx` | Drag-and-drop file upload with progress |
| `src/components/uploads/UploadHistoryTable.tsx` | Upload history list |
| `src/components/statistics/ActionStatsPanel.tsx` | Admin statistics cards + per-airline table |

**Existing components to update:**

| Component | Changes |
|-----------|---------|
| `src/components/actions/ActionModal.tsx` | Verify edit mode works for admin context |
| `src/app/(main)/airline/page.tsx` | Wire Excel export, fix statistics data source |
| `src/app/admin/actions/page.tsx` | Add edit per row, add airline name column |

---

## 8. Non-Functional Requirements

| Category | Criteria | Measurement |
|----------|----------|-|
| Performance | List API < 500ms for 1000 rows | Network tab |
| Performance | Excel upload < 10s for 5000 rows | Timer |
| Security | Admin role verified on every admin endpoint | Token manipulation test |
| Security | No cross-airline data leak for user role | Airline B user cannot see airline A data |
| Reliability | Upload failure captured in DB; partial success still inserts valid rows | Test with row containing invalid airline code |
| Usability | Error messages in Korean for all validation failures | UI review |
| Build | Zero TypeScript errors | `npm run build` |

---

## 9. Success Metrics

| Metric | Target | How to Verify |
|--------|--------|---------------|
| All FR acceptance criteria pass | 12/12 | Manual QA per FR checklist |
| TypeScript build succeeds | 0 errors | `npm run build` |
| Admin can complete upload-to-verify flow end-to-end | < 3 minutes | Timed walkthrough |
| Airline user can register action and mark complete | < 2 minutes | Timed walkthrough |
| No console errors in normal operation | 0 errors | Browser console check |
| Data isolation verified: user sees only own airline | Pass | Cross-role test |

---

## 10. Dependencies and Risks

### Dependencies
- `xlsx` library already installed (confirmed in codebase)
- PostgreSQL schema must include `callsign_occurrences` table (referenced in upload route, verify against DB init script)
- `file_uploads` table must exist before upload UI is built (referenced in existing upload route)
- `actions` JOIN with `callsigns` JOIN with `airlines` required for admin actions list

### Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| `callsign_occurrences` table missing from init.sql | High - upload route will fail silently | Medium | Verify and add to schema before Do phase |
| Excel column mapping mismatch if KATC updates file format | Medium - upload inserts wrong data | Low | Add column validation with named header detection |
| Deleting callsign with active actions breaks foreign key | High - DB error | High | Check for active actions before delete; return 409 |
| Statistics API performance on large dataset | Medium - slow page load | Low | Add DB indexes on airline_id, status, risk_level |
| ActionModal edit mode not working for admin context (different airlineId flow) | Medium - admin cannot update actions | Medium | Test and fix ActionModal to accept optional airlineId override |

---

## 11. Estimated Scope

**Classification: Major Feature**

| Area | Estimated Effort |
|------|-----------------|
| API endpoints (5 new: admin/callsigns CRUD + uploads + statistics) | 3 endpoints are medium complexity, 2 are small |
| Frontend pages (1 new page, 3 page updates) | 1 new page is large, updates are small-medium |
| New components (6 new components) | 2 are large (CallsignTable, FileUploadZone), 4 are medium |
| Schema verification + migration if needed | Small |
| Testing and QA | Medium |

**Total estimated effort: 2-3 days**

---

## 12. Architecture Considerations

### 12.1 Project Level

**Selected: Dynamic** (confirmed from previous phases)

Framework: Next.js 14 App Router
State: Zustand (auth) + TanStack Query v5 (server state)
API: Next.js API Routes with PostgreSQL (pg driver, raw SQL)
Styling: Tailwind CSS
File Processing: xlsx library
Auth Pattern: Bearer token in Authorization header, role check in each route

### 12.2 Key Architectural Decisions

| Decision | Selected | Rationale |
|----------|----------|-----------|
| Callsign admin API | New routes at `/api/admin/callsigns/` | Consistent with existing admin route namespace |
| Statistics endpoint | New `/api/admin/statistics` separate from `/api/admin/stats` | Existing `/api/admin/stats` covers users only; clean separation |
| Upload history | Reuse `file_uploads` table; add GET `/api/admin/uploads` | Table already populated by upload route |
| Excel export (admin) | Server-side via API route returning binary | Keeps client bundle smaller; consistent with existing upload pattern |
| Excel export (user) | Client-side SheetJS (already used in admin actions page) | Faster UX, no server round-trip needed for already-fetched data |

### 12.3 Folder Structure for New Files

```
src/
  app/
    api/
      admin/
        callsigns/
          route.ts             (GET list, POST create)
          [id]/
            route.ts           (PATCH update, DELETE)
        uploads/
          route.ts             (GET upload history)
        statistics/
          route.ts             (GET aggregate stats)
        actions/
          export/
            route.ts           (GET Excel download)
    admin/
      callsigns/
        page.tsx               (Callsigns management page)
  components/
    callsigns/
      CallsignModal.tsx
      CallsignDetailModal.tsx
      CallsignTable.tsx
    uploads/
      FileUploadZone.tsx
      UploadHistoryTable.tsx
    statistics/
      ActionStatsPanel.tsx
```

---

## 13. Convention Prerequisites

### 13.1 Existing Conventions (Confirmed)

- Bearer token pattern: `const token = authHeader.substring(7); const payload = verifyToken(token);`
- Role check pattern: `if (!payload || payload.role !== 'admin') { return 403 }`
- TanStack Query: `staleTime: 30_000, gcTime: 5 * 60 * 1000`
- Mutation pattern: invalidate related query keys on success
- Korean comments, TypeScript strict mode, no unused variables
- Tailwind utility classes only, no CSS modules
- `rounded-none` for all UI elements (confirmed from airline page style)

### 13.2 Environment Variables

No new environment variables required. Existing `DATABASE_URL`, `JWT_SECRET`, `NEXT_PUBLIC_BKEND_PROJECT_ID` are sufficient.

---

## 14. Next Steps

1. [ ] Verify `callsign_occurrences` table exists in `scripts/init.sql` - add if missing
2. [ ] Create Design document (`callsigns-actions-management.design.md`)
3. [ ] Team review and CTO approval
4. [ ] Start implementation in defined order: API routes first, then components, then pages

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-22 | Initial draft | Product Manager |
