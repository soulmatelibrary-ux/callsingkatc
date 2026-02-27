/**
 * SQLite 데이터베이스 드라이버
 */

import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import { initializeSchema } from './sqlite-schema';

let db: Database.Database | null = null;

export function initSQLite() {
  if (db) return db;

  const dbPath = process.env.DB_PATH || './data/katc1.db';

  // 디렉토리 생성
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new Database(dbPath);

  // WAL 모드 활성화 (동시성 개선)
  db.pragma('journal_mode = WAL');

  // 외래키 활성화
  db.pragma('foreign_keys = ON');

  console.log('[SQLite] 데이터베이스 초기화:', dbPath);

  // 스키마 초기화
  initializeSchema(db);

  return db;
}

export async function query(text: string, params?: any[]): Promise<any> {
  const database = initSQLite();
  const start = Date.now();
  
  try {
    // PostgreSQL과의 호환성을 위해 SQL 변환
    let sql = convertPostgresToSQLite(text);

    // 파라미터 처리
    const preparedParams = convertParams(sql, params);
    sql = preparedParams.sql;
    const newParams = preparedParams.params;

    console.log('[SQLite] SQL 실행:', { sql: sql.substring(0, 100), params: newParams });

    const stmt = database.prepare(sql);

    let result: any;
    const isSelect = sql.trim().toUpperCase().startsWith('SELECT');

    if (isSelect) {
      const rows = stmt.all(...(newParams || []));
      result = { rows: rows || [], rowCount: (rows || []).length };
    } else {
      const info = stmt.run(...(newParams || []));
      result = { changes: info.changes, rowCount: info.changes };
    }

    const duration = Date.now() - start;
    console.log('[SQLite] 쿼리 완료:', { duration, isSelect, rowCount: result.rowCount });

    return result;
  } catch (error: any) {
    console.error('[SQLite] 쿼리 오류:', { text: text.substring(0, 100), params, error: error.message });
    throw error;
  }
}

export async function transaction<T>(
  callback: (query: (text: string, params?: any[]) => Promise<any>) => Promise<T>
): Promise<T> {
  const database = initSQLite();
  
  try {
    database.exec('BEGIN TRANSACTION');
    const result = await callback(query);
    database.exec('COMMIT');
    return result;
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }
}

export function closePool(): Promise<void> {
  if (db) {
    db.close();
    db = null;
  }
  return Promise.resolve();
}

/**
 * PostgreSQL SQL을 SQLite SQL로 변환
 * 최소한의 변환만 수행 ($→?)
 * 복잡한 쿼리는 API에서 DB_TYPE에 따라 직접 관리
 */
function convertPostgresToSQLite(sql: string): string {
  let converted = sql;

  // $1, $2, ... → ?, ?, ... (간단한 치환만 수행)
  converted = converted.replace(/\$(\d+)/g, '?');

  // RETURNING 절 제거 (SQLite에서 미지원)
  converted = converted.replace(/\s+RETURNING\s+.*/gi, '');

  // NOW() → CURRENT_TIMESTAMP (SQLite에서 사용)
  converted = converted.replace(/NOW\(\)/gi, 'CURRENT_TIMESTAMP');

  return converted;
}

/**
 * 파라미터 변환
 */
function convertParams(sql: string, params?: any[]): { sql: string; params: any[] } {
  if (!params || params.length === 0) {
    return { sql, params: [] };
  }

  // 이미 ? 기반이면 그대로 반환
  if (sql.includes('?')) {
    return { sql, params };
  }

  // $1, $2 형식을 ?로 변환
  let converted = sql;
  let newParams: any[] = [];

  const matches = sql.match(/\$(\d+)/g) || [];
  matches.forEach(match => {
    converted = converted.replace(match, '?');
  });

  return { sql: converted, params };
}
