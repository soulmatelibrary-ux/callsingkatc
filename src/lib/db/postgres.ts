/**
 * PostgreSQL 데이터베이스 드라이버
 */

import { Pool, QueryResult } from 'pg';

let pool: Pool | null = null;

export function initPostgres() {
  if (pool) return pool;

  pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'katc1',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'katc1_auth',
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  pool.on('error', (err) => {
    console.error('[DB Pool] 예상치 못한 오류:', err.message);
  });

  return pool;
}

export async function query(text: string, params?: any[]): Promise<any> {
  const p = initPostgres();
  const start = Date.now();
  try {
    const result = await p.query(text, params);
    const duration = Date.now() - start;
    console.log('[PostgreSQL] 쿼리 실행:', { duration, rows: result.rowCount });
    return result;
  } catch (error: any) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET' || error.code === 'CONNECTION_DESTROYED' || error.message?.includes('terminated')) {
      console.warn('[DB] 연결 끊김, 1초 후 재시도...', error.message);
      await new Promise(resolve => setTimeout(resolve, 1000));
      try {
        const result = await p.query(text, params);
        const duration = Date.now() - start;
        console.log('[PostgreSQL] 쿼리 실행 (재시도 성공):', { duration, rows: result.rowCount });
        return result;
      } catch (retryError) {
        console.error('[PostgreSQL] 쿼리 오류 (재시도 실패):', retryError);
        throw retryError;
      }
    }
    console.error('[PostgreSQL] 쿼리 오류:', error);
    throw error;
  }
}

export async function transaction<T>(
  callback: (query: (text: string, params?: any[]) => Promise<any>) => Promise<T>
): Promise<T> {
  const p = initPostgres();
  const client = await p.connect();
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

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
