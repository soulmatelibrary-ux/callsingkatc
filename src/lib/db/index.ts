/**
 * 다중 데이터베이스 통합 인터페이스
 * PostgreSQL 또는 SQLite 자동 선택
 */

import * as postgresDriver from './postgres';
import * as sqliteDriver from './sqlite';

const DB_TYPE = (process.env.DB_TYPE || 'postgres').toLowerCase();

console.log(`[Database] 초기화 중... (타입: ${DB_TYPE})`);

// 드라이버 선택
const driver = DB_TYPE === 'sqlite' ? sqliteDriver : postgresDriver;

export async function query(text: string, params?: any[]): Promise<any> {
  return driver.query(text, params);
}

export async function transaction<T>(
  callback: (query: (text: string, params?: any[]) => Promise<any>) => Promise<T>
): Promise<T> {
  return driver.transaction(callback);
}

export async function closePool(): Promise<void> {
  return driver.closePool();
}

// 편의 export
export { initPostgres, initSQLite };

function initPostgres() {
  return postgresDriver.initPostgres?.();
}

function initSQLite() {
  return sqliteDriver.initSQLite?.();
}
