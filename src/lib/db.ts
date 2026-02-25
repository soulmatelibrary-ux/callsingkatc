/**
 * 다중 데이터베이스 통합 인터페이스 (re-export)
 * PostgreSQL 또는 SQLite 자동 선택
 *
 * 환경 변수:
 * - DB_TYPE: 'postgres' (기본값) 또는 'sqlite'
 * - PostgreSQL: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
 * - SQLite: DB_PATH (기본값: ./data/katc1.db)
 */

export * from './db/index';
