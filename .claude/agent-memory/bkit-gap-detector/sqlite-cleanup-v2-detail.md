# SQLite Cleanup v2.0 - Detailed Findings

## 8 Files with Remaining PostgreSQL Syntax

### 1. callsigns/stats/route.ts (lines 52, 57)
- `$${params.length + 1}` dynamic placeholder
- Fix: Replace with `?`

### 2. airlines/[airlineId]/callsigns/route.ts (lines 76, 105, 123)
- `$${queryParams.length}`, `$${limitIdx}`, `$${offsetIdx}`
- `NULLS LAST` in ORDER BY
- Fix: Replace $N with ?, remove NULLS LAST or use CASE

### 3. announcements/route.ts (line 75)
- `ANY(string_to_array(target_airlines, ','))`
- Fix: `INSTR(target_airlines, ?) > 0`

### 4. announcements/[id]/route.ts (lines 74, 80, 83)
- `COUNT(*)::int`, `ANY(string_to_array)`, wrong param count (2 params for 3 placeholders)
- Fix: Remove ::int, replace ANY, fix param array to include [params.id, params.id, user.airline_code]

### 5. announcements/history/route.ts (lines 106, 121, 126, 132, 139, 167)
- `$N` throughout, `INTERVAL '1 day'`, `COUNT(*)::int`
- Fix: All $N -> ?, INTERVAL -> datetime(?,'+1 day'), remove ::int

### 6. admin/announcements/route.ts GET (lines 88, 101, 106, 112, 118, 136, 142)
- Same as #5: $N, INTERVAL, ::int
- Note: POST handler is clean (uses ?)

### 7. admin/stats/route.ts (lines 43-46)
- `COUNT(*) FILTER (WHERE ...)` x3
- Fix: `SUM(CASE WHEN ... THEN 1 ELSE 0 END)`

### 8. admin/file-uploads/route.ts (line 72)
- `$${countParams.length + 1}` in count query
- Fix: Replace with `?`

## SQLite Equivalents Reference
| PostgreSQL | SQLite |
|---|---|
| `$1` | `?` |
| `::int` | remove (already int) |
| `ANY(string_to_array(col,','))` | `INSTR(col, ?) > 0` |
| `INTERVAL '1 day'` | `datetime(?, '+1 day')` |
| `FILTER (WHERE cond)` | `SUM(CASE WHEN cond THEN 1 ELSE 0 END)` |
| `NULLS LAST` | `CASE WHEN col IS NULL THEN 1 ELSE 0 END, col` |
