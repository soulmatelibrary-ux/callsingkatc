/**
 * SQLite 데이터베이스 통합 인터페이스
 */

import * as sqliteDriver from './sqlite';

export async function query(text: string, params?: any[]): Promise<any> {
  return sqliteDriver.query(text, params);
}

export async function transaction<T>(
  callback: (query: (text: string, params?: any[]) => Promise<any>) => Promise<T>
): Promise<T> {
  return sqliteDriver.transaction(callback);
}

export async function closePool(): Promise<void> {
  return sqliteDriver.closePool();
}

// 편의 export
export { initSQLite };

function initSQLite() {
  return sqliteDriver.initSQLite?.();
}
