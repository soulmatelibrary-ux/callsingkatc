/**
 * 파일 업로드 관련 SQL 쿼리
 * PostgreSQL / SQLite 별도 관리
 */

const isSQLite = (process.env.DB_TYPE || 'postgres') === 'sqlite';

/**
 * 파일 업로드 생성
 */
export const createFileUpload = isSQLite
  ? `INSERT INTO file_uploads (original_filename, stored_filename, file_size, mimetype, uploaded_by, created_at)
     VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
  : `INSERT INTO file_uploads (original_filename, stored_filename, file_size, mimetype, uploaded_by, created_at)
     VALUES ($1, $2, $3, $4, $5, NOW())`;

/**
 * 파일 업로드 상세 조회
 */
export const getFileUploadById = isSQLite
  ? `SELECT * FROM file_uploads WHERE id = ?`
  : `SELECT * FROM file_uploads WHERE id = $1`;

/**
 * 파일 업로드 삭제
 */
export const deleteFileUpload = isSQLite
  ? `DELETE FROM file_uploads WHERE id = ?`
  : `DELETE FROM file_uploads WHERE id = $1`;

/**
 * 파일 업로드 관련 유사호출부호 개수
 */
export const getCallsignCountByFileUploadId = isSQLite
  ? `SELECT COUNT(*) as count FROM callsigns WHERE file_upload_id = ?`
  : `SELECT COUNT(*) as count FROM callsigns WHERE file_upload_id = $1`;

/**
 * 파일 업로드 통계
 */
export const getFileUploadsStats = isSQLite
  ? `SELECT
       COUNT(*) as total,
       COALESCE(SUM(file_size), 0) as total_size,
       COUNT(DISTINCT uploaded_by) as upload_users
     FROM file_uploads`
  : `SELECT
       COUNT(*) as total,
       COALESCE(SUM(file_size), 0) as total_size,
       COUNT(DISTINCT uploaded_by) as upload_users
     FROM file_uploads`;

/**
 * 최신 파일 업로드 조회
 */
export const getLatestFileUpload = isSQLite
  ? `SELECT * FROM file_uploads ORDER BY created_at DESC LIMIT 1`
  : `SELECT * FROM file_uploads ORDER BY created_at DESC LIMIT 1`;

/**
 * 파일 업로드 상태 확인 (파일 로드 완료 여부)
 */
export const checkFileUploadLoaded = isSQLite
  ? `SELECT COUNT(*) as loaded_count FROM callsigns WHERE file_upload_id = ?`
  : `SELECT COUNT(*) as loaded_count FROM callsigns WHERE file_upload_id = $1`;
