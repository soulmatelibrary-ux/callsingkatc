/**
 * 항공사 관련 SQL 쿼리
 * PostgreSQL / SQLite 별도 관리
 */

const isSQLite = (process.env.DB_TYPE || 'postgres') === 'sqlite';

/**
 * 항공사 목록 조회
 */
export const getAirlines = isSQLite
  ? `SELECT * FROM airlines ORDER BY display_order ASC`
  : `SELECT * FROM airlines ORDER BY display_order ASC`;

/**
 * 항공사 상세 조회
 */
export const getAirlineById = isSQLite
  ? `SELECT * FROM airlines WHERE id = ?`
  : `SELECT * FROM airlines WHERE id = $1`;

/**
 * 항공사 생성
 */
export const createAirline = isSQLite
  ? `INSERT INTO airlines (code, name_ko, name_en, display_order, created_at)
     VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`
  : `INSERT INTO airlines (code, name_ko, name_en, display_order, created_at)
     VALUES ($1, $2, $3, $4, NOW())`;

/**
 * 항공사 수정
 */
export const updateAirline = isSQLite
  ? `UPDATE airlines SET code = ?, name_ko = ?, name_en = ?, display_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  : `UPDATE airlines SET code = $1, name_ko = $2, name_en = $3, display_order = $4, updated_at = NOW() WHERE id = $5`;

/**
 * 항공사 순서 업데이트
 */
export const updateAirlineOrder = isSQLite
  ? `UPDATE airlines SET display_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  : `UPDATE airlines SET display_order = $1, updated_at = NOW() WHERE id = $2`;

/**
 * 항공사 삭제 (사용 중인 사용자 확인)
 */
export const checkAirlineInUse = isSQLite
  ? `SELECT COUNT(*) as count FROM users WHERE airline_id = ?`
  : `SELECT COUNT(*) as count FROM users WHERE airline_id = $1`;

/**
 * 항공사 삭제
 */
export const deleteAirline = isSQLite
  ? `DELETE FROM airlines WHERE id = ?`
  : `DELETE FROM airlines WHERE id = $1`;

/**
 * 항공사 코드로 조회
 */
export const getAirlineByCode = isSQLite
  ? `SELECT * FROM airlines WHERE code = ?`
  : `SELECT * FROM airlines WHERE code = $1`;

/**
 * 최대 display_order 값 조회
 */
export const getMaxDisplayOrder = `SELECT COALESCE(MAX(display_order), 0) as max_order FROM airlines`;

/**
 * 항공사 통계 (유사호출부호 개수)
 */
export const getAirlinesStats = isSQLite
  ? `SELECT
       a.id,
       a.code,
       a.name_ko,
       a.name_en,
       COUNT(c.id) as callsign_count,
       COUNT(CASE WHEN c.risk_level = '매우높음' THEN 1 END) as very_high_risk_count
     FROM airlines a
     LEFT JOIN callsigns c ON a.id = c.airline_id
     GROUP BY a.id
     ORDER BY a.display_order ASC`
  : `SELECT
       a.id,
       a.code,
       a.name_ko,
       a.name_en,
       COUNT(c.id) as callsign_count,
       COUNT(CASE WHEN c.risk_level = '매우높음' THEN 1 END) as very_high_risk_count
     FROM airlines a
     LEFT JOIN callsigns c ON a.id = c.airline_id
     GROUP BY a.id
     ORDER BY a.display_order ASC`;
