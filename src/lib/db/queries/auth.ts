/**
 * 인증 관련 SQL 쿼리
 * PostgreSQL / SQLite 별도 관리
 */

const isSQLite = (process.env.DB_TYPE || 'postgres') === 'sqlite';

/**
 * 이메일로 사용자 조회
 */
export const getUserByEmail = isSQLite
  ? `SELECT
       u.id, u.password_hash, u.status, u.role, u.email,
       u.airline_id, u.is_default_password, u.password_change_required,
       a.code as airline_code, a.name_ko as airline_name_ko, a.name_en as airline_name_en
     FROM users u
     LEFT JOIN airlines a ON u.airline_id = a.id
     WHERE LOWER(u.email) = LOWER(?)`
  : `SELECT
       u.id, u.password_hash, u.status, u.role, u.email,
       u.airline_id, u.is_default_password, u.password_change_required,
       a.code as airline_code, a.name_ko as airline_name_ko, a.name_en as airline_name_en
     FROM users u
     LEFT JOIN airlines a ON u.airline_id = a.id
     WHERE LOWER(u.email) = LOWER($1)`;

/**
 * 마지막 로그인 시간 업데이트
 */
export const updateLastLogin = isSQLite
  ? `UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?`
  : `UPDATE users SET last_login_at = NOW() WHERE id = $1`;

/**
 * 사용자 정보 조회 (by ID)
 */
export const getUserById = isSQLite
  ? `SELECT
       u.id, u.email, u.status, u.role, u.airline_id,
       a.code as airline_code, a.name_ko as airline_name_ko, a.name_en as airline_name_en
     FROM users u
     LEFT JOIN airlines a ON u.airline_id = a.id
     WHERE u.id = ?`
  : `SELECT
       u.id, u.email, u.status, u.role, u.airline_id,
       a.code as airline_code, a.name_ko as airline_name_ko, a.name_en as airline_name_en
     FROM users u
     LEFT JOIN airlines a ON u.airline_id = a.id
     WHERE u.id = $1`;

/**
 * 비밀번호 변경
 */
export const updatePassword = isSQLite
  ? `UPDATE users SET password_hash = ?, is_default_password = false, password_change_required = false WHERE id = ?`
  : `UPDATE users SET password_hash = $1, is_default_password = false, password_change_required = false WHERE id = $2`;
