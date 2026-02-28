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
    const sql = text;
    const newParams = params || [];

    const stmt = database.prepare(sql);

    let result: any;
    const isSelect = sql.trim().toUpperCase().startsWith('SELECT');

    if (isSelect) {
      const rows = stmt.all(...newParams);
      result = { rows: rows || [], rowCount: (rows || []).length };
    } else {
      const info = stmt.run(...newParams);
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
