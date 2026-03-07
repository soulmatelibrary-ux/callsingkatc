# Airline Code Manager - Agent Memory

## Critical Bug Pattern: callsigns API status filter (2026-03-07)
- `/api/airlines/[airlineId]/callsigns` had `AND c.status = 'in_progress'` filter
- This caused completed callsigns to disappear from the UI after action registration
- Fix: Remove the status filter so both in_progress and completed callsigns are returned
- Added ORDER BY `CASE WHEN c.status = 'in_progress' THEN 0 ELSE 1 END` to prioritize in_progress items

## Critical Bug Pattern: params await missing (2026-03-07)
- Next.js 14 route handlers with `params: Promise<{}>` require `await params` before accessing fields
- `/api/airlines/[airlineId]/callsigns/route.ts` was doing `params.airlineId` without await
- Fix: Changed to `(await params).airlineId`

## Cache Invalidation Pattern (2026-03-07)
- All mutation hooks (useCreateAction, useUpdateAction, useDeleteAction) must invalidate:
  - `['airline-actions']` - action list
  - `['airline-callsigns']` - callsign list with action status
  - `['airline-action-stats']` - statistics
- Missing `airline-action-stats` invalidation was causing stale statistics after mutations

## Actions Query Filter
- Always use `COALESCE(is_cancelled, 0) = 0` when querying actions
- This was missing in the callsigns API's action status lookup subquery
