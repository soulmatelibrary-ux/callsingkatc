/**
 * 유사호출부호 관련 SQL 쿼리
 * PostgreSQL / SQLite 별도 관리
 *
 * 복잡한 쿼리(LEFT JOIN LATERAL 등)는 API 파일에서 직접 if (isSQLite) 분기로 처리
 */

const isSQLite = (process.env.DB_TYPE || 'postgres') === 'sqlite';

/**
 * 유사호출부호 상세 조회
 */
export const getCallsignById = isSQLite
  ? `SELECT
       c.*,
       a.code as airline_code_ref, a.name_ko as airline_name_ko, a.name_en as airline_name_en
     FROM callsigns c
     LEFT JOIN airlines a ON c.airline_id = a.id
     WHERE c.id = ?`
  : `SELECT
       c.*,
       a.code as airline_code_ref, a.name_ko as airline_name_ko, a.name_en as airline_name_en
     FROM callsigns c
     LEFT JOIN airlines a ON c.airline_id = a.id
     WHERE c.id = $1`;

/**
 * 조치 이력 조회 (특정 유사호출부호)
 */
export const getActionsByCallsignId = isSQLite
  ? `SELECT *
     FROM actions
     WHERE callsign_id = ?
     ORDER BY updated_at DESC, registered_at DESC`
  : `SELECT *
     FROM actions
     WHERE callsign_id = $1
     ORDER BY updated_at DESC NULLS LAST, registered_at DESC`;

/**
 * 항공사별 유사호출부호 조회
 */
export const getCallsignsByAirlineId = isSQLite
  ? `SELECT * FROM callsigns WHERE airline_id = ? ORDER BY occurrence_count DESC LIMIT ?`
  : `SELECT * FROM callsigns WHERE airline_id = $1 ORDER BY occurrence_count DESC LIMIT $2`;

/**
 * 유사호출부호 통계
 */
export const getCallsignsStats = isSQLite
  ? `SELECT
       COUNT(*) as total,
       SUM(CASE WHEN risk_level = '매우높음' THEN 1 ELSE 0 END) as very_high_risk,
       SUM(CASE WHEN risk_level = '높음' THEN 1 ELSE 0 END) as high_risk,
       SUM(CASE WHEN risk_level = '낮음' THEN 1 ELSE 0 END) as low_risk,
       SUM(occurrence_count) as total_occurrences
     FROM callsigns`
  : `SELECT
       COUNT(*) as total,
       COUNT(CASE WHEN risk_level = '매우높음' THEN 1 END) as very_high_risk,
       COUNT(CASE WHEN risk_level = '높음' THEN 1 END) as high_risk,
       COUNT(CASE WHEN risk_level = '낮음' THEN 1 END) as low_risk,
       COALESCE(SUM(occurrence_count), 0) as total_occurrences
     FROM callsigns`;
