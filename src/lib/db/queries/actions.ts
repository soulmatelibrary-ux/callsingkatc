/**
 * 조치 이력 관련 SQL 쿼리
 * PostgreSQL / SQLite 별도 관리
 */

const isSQLite = (process.env.DB_TYPE || 'postgres') === 'sqlite';

/**
 * 조치 이력 목록 조회
 */
export const getActions = isSQLite
  ? `SELECT * FROM actions WHERE 1=1 {where_clause} ORDER BY updated_at DESC LIMIT ? OFFSET ?`
  : `SELECT * FROM actions WHERE 1=1 {where_clause} ORDER BY updated_at DESC LIMIT $1 OFFSET $2`;

/**
 * 조치 이력 전체 개수
 */
export const getActionsCount = `SELECT COUNT(*) as total FROM actions WHERE 1=1 {where_clause}`;

/**
 * 조치 이력 생성
 */
export const createAction = isSQLite
  ? `INSERT INTO actions (callsign_id, status, manager_name, notes, registered_at, updated_at)
     VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
  : `INSERT INTO actions (callsign_id, status, manager_name, notes, registered_at, updated_at)
     VALUES ($1, $2, $3, $4, NOW(), NOW())`;

/**
 * 조치 이력 상세 조회
 */
export const getActionById = isSQLite
  ? `SELECT * FROM actions WHERE id = ?`
  : `SELECT * FROM actions WHERE id = $1`;

/**
 * 조치 이력 수정
 */
export const updateAction = isSQLite
  ? `UPDATE actions SET status = ?, manager_name = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  : `UPDATE actions SET status = $1, manager_name = $2, notes = $3, updated_at = NOW() WHERE id = $4`;

/**
 * 조치 이력 삭제
 */
export const deleteAction = isSQLite
  ? `DELETE FROM actions WHERE id = ?`
  : `DELETE FROM actions WHERE id = $1`;

/**
 * 특정 유사호출부호의 최신 조치 조회
 */
export const getLatestActionByCallsignId = isSQLite
  ? `SELECT * FROM actions WHERE callsign_id = ? ORDER BY updated_at DESC LIMIT 1`
  : `SELECT * FROM actions WHERE callsign_id = $1 ORDER BY updated_at DESC NULLS LAST LIMIT 1`;

/**
 * 항공사별 조치 이력 통계
 */
export const getActionStatsByAirline = isSQLite
  ? `SELECT
       c.airline_id,
       a.code as airline_code,
       COUNT(DISTINCT ac.id) as total_actions,
       COUNT(DISTINCT CASE WHEN ac.status = 'completed' THEN ac.id END) as completed,
       COUNT(DISTINCT CASE WHEN ac.status = 'in_progress' THEN ac.id END) as in_progress,
       COUNT(DISTINCT CASE WHEN ac.status = 'pending' THEN ac.id END) as pending
     FROM callsigns c
     LEFT JOIN airlines a ON c.airline_id = a.id
     LEFT JOIN actions ac ON c.id = ac.callsign_id
     WHERE a.id = ?
     GROUP BY c.airline_id, a.code`
  : `SELECT
       c.airline_id,
       a.code as airline_code,
       COUNT(DISTINCT ac.id) as total_actions,
       COUNT(DISTINCT CASE WHEN ac.status = 'completed' THEN ac.id END) as completed,
       COUNT(DISTINCT CASE WHEN ac.status = 'in_progress' THEN ac.id END) as in_progress,
       COUNT(DISTINCT CASE WHEN ac.status = 'pending' THEN ac.id END) as pending
     FROM callsigns c
     LEFT JOIN airlines a ON c.airline_id = a.id
     LEFT JOIN actions ac ON c.id = ac.callsign_id
     WHERE a.id = $1
     GROUP BY c.airline_id, a.code`;

/**
 * 조치 이력 통계
 */
export const getActionsStats = isSQLite
  ? `SELECT
       COUNT(*) as total,
       COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
       COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
       COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending
     FROM actions`
  : `SELECT
       COUNT(*) as total,
       COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
       COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
       COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending
     FROM actions`;
