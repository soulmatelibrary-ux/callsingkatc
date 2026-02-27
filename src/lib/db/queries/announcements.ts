/**
 * 공지사항 관련 SQL 쿼리 (SQLite)
 */

/**
 * 공지사항 상세 조회
 */
export const getAnnouncementById = `SELECT * FROM announcements WHERE id = ?`;

/**
 * 공지사항 생성
 */
export const createAnnouncement = `INSERT INTO announcements (title, content, created_by, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`;

/**
 * 공지사항 수정
 */
export const updateAnnouncement = `UPDATE announcements SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;

/**
 * 공지사항 삭제
 */
export const deleteAnnouncement = `DELETE FROM announcements WHERE id = ?`;

/**
 * 읽음 처리 - 사용자별 기록 조회
 */
export const getUserAnnouncementRead = `SELECT * FROM announcement_reads WHERE user_id = ? AND announcement_id = ?`;

/**
 * 읽음 처리 - 기록 생성
 */
export const createAnnouncementRead = `INSERT INTO announcement_reads (user_id, announcement_id, read_at) VALUES (?, ?, CURRENT_TIMESTAMP)`;

/**
 * 읽음 처리 - 사용자의 미읽 공지사항 조회
 */
export const getUnreadAnnouncements = `SELECT a.* FROM announcements a
     WHERE NOT EXISTS (
       SELECT 1 FROM announcement_reads ar
       WHERE ar.user_id = ? AND ar.announcement_id = a.id
     )
     ORDER BY a.created_at DESC`;

/**
 * 공지사항 이력 조회 - 기본 쿼리
 */
export const getAnnouncementHistoryBase = `SELECT
       a.id, a.title, a.created_at, a.updated_at,
       COUNT(DISTINCT ar.user_id) as read_count
     FROM announcements a
     LEFT JOIN announcement_reads ar ON a.id = ar.announcement_id
     GROUP BY a.id
     ORDER BY a.created_at DESC`;
