/**
 * 항공사 관련 SQL 쿼리 (SQLite)
 */

/**
 * 항공사 목록 조회
 */
export const getAirlines = `SELECT * FROM airlines ORDER BY display_order ASC`;

/**
 * 항공사 상세 조회
 */
export const getAirlineById = `SELECT * FROM airlines WHERE id = ?`;

/**
 * 항공사 생성
 */
export const createAirline = `INSERT INTO airlines (code, name_ko, name_en, display_order, created_at)
VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`;

/**
 * 항공사 수정
 */
export const updateAirline = `UPDATE airlines SET code = ?, name_ko = ?, name_en = ?, display_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;

/**
 * 항공사 순서 업데이트
 */
export const updateAirlineOrder = `UPDATE airlines SET display_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;

/**
 * 항공사 삭제 (사용 중인 사용자 확인)
 */
export const checkAirlineInUse = `SELECT COUNT(*) as count FROM users WHERE airline_id = ?`;

/**
 * 항공사 삭제
 */
export const deleteAirline = `DELETE FROM airlines WHERE id = ?`;

/**
 * 항공사 코드로 조회
 */
export const getAirlineByCode = `SELECT * FROM airlines WHERE code = ?`;

/**
 * 최대 display_order 값 조회
 */
export const getMaxDisplayOrder = `SELECT COALESCE(MAX(display_order), 0) as max_order FROM airlines`;

/**
 * 항공사 통계 (유사호출부호 개수)
 */
export const getAirlinesStats = `SELECT
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
