/**
 * 공지사항 관련 SQL 쿼리
 * PostgreSQL / SQLite 별도 관리
 */

const isSQLite = (process.env.DB_TYPE || 'postgres') === 'sqlite';

/**
 * 공지사항 목록 조회
 */
export const getAnnouncements = isSQLite
  ? `SELECT * FROM announcements WHERE 1=1 {where_clause} ORDER BY created_at DESC LIMIT ? OFFSET ?`
  : `SELECT * FROM announcements WHERE 1=1 {where_clause} ORDER BY created_at DESC LIMIT $1 OFFSET $2`;

/**
 * 공지사항 전체 개수
 */
export const getAnnouncementsCount = `SELECT COUNT(*) as total FROM announcements WHERE 1=1 {where_clause}`;

/**
 * 공지사항 상세 조회
 */
export const getAnnouncementById = isSQLite
  ? `SELECT * FROM announcements WHERE id = ?`
  : `SELECT * FROM announcements WHERE id = $1`;

/**
 * 공지사항 생성
 */
export const createAnnouncement = isSQLite
  ? `INSERT INTO announcements (title, content, created_by, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP) RETURNING *`
  : `INSERT INTO announcements (title, content, created_by, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *`;

/**
 * 공지사항 수정
 */
export const updateAnnouncement = isSQLite
  ? `UPDATE announcements SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  : `UPDATE announcements SET title = $1, content = $2, updated_at = NOW() WHERE id = $3`;

/**
 * 공지사항 삭제
 */
export const deleteAnnouncement = isSQLite
  ? `DELETE FROM announcements WHERE id = ?`
  : `DELETE FROM announcements WHERE id = $1`;

/**
 * 읽음 처리 - 사용자별 기록 조회
 */
export const getUserAnnouncementRead = isSQLite
  ? `SELECT * FROM announcement_reads WHERE user_id = ? AND announcement_id = ?`
  : `SELECT * FROM announcement_reads WHERE user_id = $1 AND announcement_id = $2`;

/**
 * 읽음 처리 - 기록 생성
 */
export const createAnnouncementRead = isSQLite
  ? `INSERT INTO announcement_reads (user_id, announcement_id, read_at) VALUES (?, ?, CURRENT_TIMESTAMP)`
  : `INSERT INTO announcement_reads (user_id, announcement_id, read_at) VALUES ($1, $2, NOW())`;

/**
 * 읽음 처리 - 사용자의 미읽 공지사항 조회
 */
export const getUnreadAnnouncements = isSQLite
  ? `SELECT a.* FROM announcements a
     WHERE NOT EXISTS (
       SELECT 1 FROM announcement_reads ar
       WHERE ar.user_id = ? AND ar.announcement_id = a.id
     )
     ORDER BY a.created_at DESC`
  : `SELECT a.* FROM announcements a
     WHERE NOT EXISTS (
       SELECT 1 FROM announcement_reads ar
       WHERE ar.user_id = $1 AND ar.announcement_id = a.id
     )
     ORDER BY a.created_at DESC`;

/**
 * 공지사항 이력 조회
 */
export const getAnnouncementHistory = isSQLite
  ? `SELECT
       a.id, a.title, a.created_at, a.updated_at,
       COUNT(DISTINCT ar.user_id) as read_count
     FROM announcements a
     LEFT JOIN announcement_reads ar ON a.id = ar.announcement_id
     WHERE 1=1 {where_clause}
     GROUP BY a.id
     ORDER BY a.created_at DESC
     LIMIT ? OFFSET ?`
  : `SELECT
       a.id, a.title, a.created_at, a.updated_at,
       COUNT(DISTINCT ar.user_id) as read_count
     FROM announcements a
     LEFT JOIN announcement_reads ar ON a.id = ar.announcement_id
     WHERE 1=1 {where_clause}
     GROUP BY a.id
     ORDER BY a.created_at DESC
     LIMIT $1 OFFSET $2`;
