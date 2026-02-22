/**
 * PostgreSQL 데이터베이스 연결 및 쿼리 함수
 */

import { Pool, QueryResult } from 'pg';

// 연결 풀 생성 (재사용)
// 참고: DB_PASSWORD는 환경변수로 필수 제공되어야 함 (런타임 검증)
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'katc1',
  password: process.env.DB_PASSWORD || '',  // 빌드 시 빈 문자열, 런타임에 검증
  database: process.env.DB_NAME || 'katc1_auth',
});

/**
 * 쿼리 함수 타입
 */
type QueryFunction = (text: string, params?: any[]) => Promise<QueryResult>;

/**
 * 쿼리 실행
 */
export async function query(text: string, params?: any[]): Promise<QueryResult> {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('쿼리 실행:', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('쿼리 오류:', { text, error });
    throw error;
  }
}

/**
 * 트랜잭션 실행
 */
export async function transaction<T>(
  callback: (query: QueryFunction) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback((text, params) => client.query(text, params));
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 연결 종료
 */
export async function closePool(): Promise<void> {
  await pool.end();
}
