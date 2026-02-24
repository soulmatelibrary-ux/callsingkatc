/**
 * PostgreSQL 데이터베이스 연결 및 쿼리 함수
 */

import { Pool, QueryResult } from 'pg';

// 연결 풀 생성 (재사용)
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'katc1',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'katc1_auth',
  // DB 컨테이너 재시작 시 자동 복구를 위한 설정
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// 연결 에러 시 프로세스 크래시 방지
pool.on('error', (err) => {
  console.error('[DB Pool] Unexpected error on idle client:', err.message);
});

/**
 * 쿼리 함수 타입
 */
type QueryFunction = (text: string, params?: any[]) => Promise<QueryResult>;

/**
 * 쿼리 실행 (연결 실패 시 1회 재시도)
 */
export async function query(text: string, params?: any[]): Promise<QueryResult> {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('쿼리 실행:', { text, duration, rows: result.rowCount });
    return result;
  } catch (error: any) {
    // 연결 에러인 경우 1회 재시도 (DB 컨테이너 재시작 후 복구용)
    if (error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET' || error.code === 'CONNECTION_DESTROYED' || error.message?.includes('terminated')) {
      console.warn('[DB] Connection lost, retrying in 1s...', error.message);
      await new Promise(resolve => setTimeout(resolve, 1000));
      try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('쿼리 실행 (재시도 성공):', { text, duration, rows: result.rowCount });
        return result;
      } catch (retryError) {
        console.error('쿼리 오류 (재시도 실패):', { text, error: retryError });
        throw retryError;
      }
    }
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
