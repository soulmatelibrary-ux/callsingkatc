# 구현 명세서: DB Provider 분리

**문서 ID**: SPEC-001
**작성일**: 2026-02-28
**상태**: Draft

---

## 파일별 구현 상세

### 1. src/lib/db/interface.ts (신규)

```typescript
/**
 * 데이터베이스 쿼리 결과 인터페이스
 */
export interface QueryResult {
  rows: any[];           // 조회 결과 행 배열
  rowCount: number;      // 영향받은 행 수
  changes?: number;      // INSERT/UPDATE/DELETE의 변경 행 수
}

/**
 * 데이터베이스 Provider 인터페이스
 * SQLite, PostgreSQL 등이 구현해야 할 표준 인터페이스
 */
export interface DatabaseProvider {
  /**
   * SQL 쿼리 실행
   * @param text SQL 쿼리 문자열 (? 또는 $N 플레이스홀더)
   * @param params 바인드 파라미터 배열
   * @returns 쿼리 결과
   * @throws 쿼리 실행 에러
   */
  query(text: string, params?: any[]): Promise<QueryResult>;

  /**
   * 트랜잭션 내에서 여러 쿼리 실행
   * @param callback 트랜잭션 콜백 함수
   *   - 인자: 트랜잭션 내 query 함수
   *   - 반환: 최종 결과값
   * @returns 콜백 반환값
   * @throws 트랜잭션 에러 (자동 ROLLBACK)
   */
  transaction<T>(
    callback: (query: (text: string, params?: any[]) => Promise<QueryResult>) => Promise<T>
  ): Promise<T>;

  /**
   * 데이터베이스 연결 종료
   * PostgreSQL의 Pool.end(), SQLite의 db.close()
   */
  closePool(): Promise<void>;
}
```

**검증**:
- [ ] TypeScript 컴파일 에러 없음
- [ ] 모든 메서드가 비동기 (Promise 반환)
- [ ] 제너릭 지원 (트랜잭션 반환값)

---

### 2. src/lib/db/providers/sqlite/index.ts (신규)

```typescript
/**
 * SQLite Provider 구현체
 * better-sqlite3 라이브러리 사용
 */

import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import type { DatabaseProvider, QueryResult } from '../../interface';
import { initializeSchema } from './schema';

export class SQLiteProvider implements DatabaseProvider {
  private db: Database.Database;

  constructor() {
    const dbPath = process.env.DB_PATH || './data/katc1.db';

    // 디렉토리 생성
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // 데이터베이스 초기화
    this.db = new Database(dbPath);

    // 성능 최적화: WAL 모드 (Write-Ahead Logging)
    this.db.pragma('journal_mode = WAL');

    // 데이터 무결성: 외래키 활성화
    this.db.pragma('foreign_keys = ON');

    console.log('[SQLite Provider] 초기화됨:', dbPath);

    // 스키마 초기화 (테이블 없으면 생성)
    initializeSchema(this.db);
  }

  async query(text: string, params?: any[]): Promise<QueryResult> {
    const start = Date.now();

    try {
      const sql = text;
      const newParams = params || [];

      const stmt = this.db.prepare(sql);

      let result: any;
      const isSelect = sql.trim().toUpperCase().startsWith('SELECT');

      if (isSelect) {
        // SELECT: 모든 행 반환
        result = stmt.all(...newParams);
        const duration = Date.now() - start;
        console.log(`[SQLite] SELECT (${duration}ms):`, sql.substring(0, 80));

        return {
          rows: result,
          rowCount: result.length,
        };
      } else {
        // INSERT/UPDATE/DELETE: 변경 내용 반환
        const changeInfo = stmt.run(...newParams);
        const duration = Date.now() - start;
        console.log(`[SQLite] ${sql.substring(0, 10).toUpperCase()} (${duration}ms):`, sql.substring(0, 80));

        return {
          rows: [],
          rowCount: changeInfo.changes,
          changes: changeInfo.changes,
        };
      }
    } catch (error) {
      console.error('[SQLite] 쿼리 에러:', { sql: text, error });
      throw error;
    }
  }

  async transaction<T>(
    callback: (query: (text: string, params?: any[]) => Promise<QueryResult>) => Promise<T>
  ): Promise<T> {
    // SQLite의 transaction() 메서드 사용 (동기 API)
    return this.db.transaction(() => {
      // 트랜잭션 내 query 함수 제공
      const queryFn = async (text: string, params?: any[]) => {
        return this.query(text, params);
      };

      // 콜백 실행 (비동기 처리)
      return callback(queryFn);
    })();
  }

  async closePool(): Promise<void> {
    this.db.close();
    console.log('[SQLite Provider] 연결 종료');
  }
}
```

**검증**:
- [ ] better-sqlite3 설치 확인
- [ ] 쿼리 성공/실패 로그 확인
- [ ] WAL 모드 설정 적용
- [ ] 트랜잭션 ROLLBACK 테스트

---

### 3. src/lib/db/providers/sqlite/schema.ts (이동)

```typescript
/**
 * SQLite 스키마 초기화
 * 기존 sqlite-schema.ts 파일 이동
 */

import Database from 'better-sqlite3';

export function initializeSchema(db: Database.Database): void {
  // 기존 sqlite-schema.ts의 전체 코드 이동
  // - CREATE TABLE IF NOT EXISTS
  // - CREATE INDEX IF NOT EXISTS
  // - 기본 데이터 삽입

  // 예시:
  db.exec(`
    CREATE TABLE IF NOT EXISTS airlines (
      id TEXT PRIMARY KEY,
      code VARCHAR(10) UNIQUE NOT NULL,
      name_ko VARCHAR(100) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('[SQLite] 스키마 초기화 완료');
}
```

**특징**:
- 기존 코드 그대로 이동 (수정 최소화)
- `IF NOT EXISTS` 사용 (멱등성)
- 최초 실행 시만 테이블 생성

---

### 4. src/lib/db/providers/postgresql/index.ts (신규)

```typescript
/**
 * PostgreSQL Provider 구현체
 * pg 라이브러리 사용
 */

import { Pool, PoolClient } from 'pg';
import type { DatabaseProvider, QueryResult } from '../../interface';
import { initializeSchema } from './schema';

/**
 * ? 플레이스홀더를 $1, $2, ... 로 변환
 * 기존 SQL 쿼리 호환성 유지
 *
 * 예시:
 *   "SELECT * FROM users WHERE id = ? AND email = ?"
 *   →
 *   "SELECT * FROM users WHERE id = $1 AND email = $2"
 */
function convertPlaceholders(sql: string): string {
  let counter = 1;
  return sql.replace(/\?/g, () => `$${counter++}`);
}

export class PostgreSQLProvider implements DatabaseProvider {
  private pool: Pool;
  private initialized: boolean = false;

  constructor() {
    // 연결풀 초기화
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }  // Render 등 클라우드 환경 호환
        : false,                          // 로컬 개발: SSL 비활성화
    });

    // 에러 처리
    this.pool.on('error', (err) => {
      console.error('[PostgreSQL Pool] 예기치 않은 에러:', err);
    });

    console.log('[PostgreSQL Provider] 초기화됨:', process.env.DATABASE_URL?.substring(0, 50));

    // 스키마 초기화 (테이블 없으면 생성)
    this.initSchemaIfNeeded();
  }

  private async initSchemaIfNeeded(): Promise<void> {
    if (this.initialized) return;

    try {
      const client = await this.pool.connect();
      try {
        await initializeSchema(client);
        this.initialized = true;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('[PostgreSQL] 스키마 초기화 실패:', error);
      throw error;
    }
  }

  async query(text: string, params?: any[]): Promise<QueryResult> {
    const start = Date.now();

    try {
      // ? → $N 자동 변환
      const pgSql = convertPlaceholders(text);
      const result = await this.pool.query(pgSql, params);

      const duration = Date.now() - start;
      console.log(`[PostgreSQL] 쿼리 (${duration}ms):`, text.substring(0, 80));

      return {
        rows: result.rows,
        rowCount: result.rowCount ?? 0,
      };
    } catch (error) {
      console.error('[PostgreSQL] 쿼리 에러:', { sql: text, error });
      throw error;
    }
  }

  async transaction<T>(
    callback: (query: (text: string, params?: any[]) => Promise<QueryResult>) => Promise<T>
  ): Promise<T> {
    const client = await this.pool.connect();

    try {
      // 트랜잭션 시작
      await client.query('BEGIN');

      // 트랜잭션 내 query 함수 제공
      const queryFn = async (text: string, params?: any[]) => {
        const pgSql = convertPlaceholders(text);
        const result = await client.query(pgSql, params);
        return {
          rows: result.rows,
          rowCount: result.rowCount ?? 0,
        };
      };

      // 콜백 실행
      const resultValue = await callback(queryFn);

      // 커밋
      await client.query('COMMIT');

      return resultValue;
    } catch (error) {
      // 롤백 (자동)
      await client.query('ROLLBACK');
      console.error('[PostgreSQL] 트랜잭션 실패:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async closePool(): Promise<void> {
    await this.pool.end();
    console.log('[PostgreSQL Provider] 연결 종료');
  }
}
```

**검증**:
- [ ] pg 라이브러리 설치 확인
- [ ] DATABASE_URL 형식 검증 (`postgresql://user:pass@host:port/db`)
- [ ] 플레이스홀더 변환 테스트
- [ ] 트랜잭션 에러 처리 테스트
- [ ] SSL 연결 검증 (프로덕션)

---

### 5. src/lib/db/providers/postgresql/schema.ts (신규)

```typescript
/**
 * PostgreSQL 스키마 초기화
 * scripts/postgresql-init.sql 기반으로 테이블 자동 생성
 */

import { PoolClient } from 'pg';

export async function initializeSchema(client: PoolClient): Promise<void> {
  try {
    // UUID 확장 활성화 (PostgreSQL 13+는 기본 내장)
    await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

    // airlines 테이블
    await client.query(`
      CREATE TABLE IF NOT EXISTS airlines (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(10) UNIQUE NOT NULL,
        name_ko VARCHAR(100) NOT NULL,
        name_en VARCHAR(100),
        display_order INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // users 테이블
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        airline_id UUID NOT NULL REFERENCES airlines(id),
        status VARCHAR(50) NOT NULL DEFAULT 'active'
          CHECK (status IN ('active', 'suspended')),
        role VARCHAR(50) NOT NULL DEFAULT 'user'
          CHECK (role IN ('admin', 'user')),
        is_default_password BOOLEAN DEFAULT true,
        password_change_required BOOLEAN DEFAULT true,
        last_password_changed_at TIMESTAMP,
        last_login_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // callsigns 테이블 (메인 데이터)
    await client.query(`
      CREATE TABLE IF NOT EXISTS callsigns (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        airline_id UUID NOT NULL REFERENCES airlines(id) ON DELETE CASCADE,
        airline_code VARCHAR(10) NOT NULL,
        callsign_pair VARCHAR(50) NOT NULL,
        my_callsign VARCHAR(20) NOT NULL,
        other_callsign VARCHAR(20) NOT NULL,
        risk_level VARCHAR(20),
        status VARCHAR(20) NOT NULL DEFAULT 'in_progress'
          CHECK (status IN ('in_progress', 'completed')),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(airline_id, callsign_pair),
        UNIQUE(airline_code, callsign_pair)
      );
    `);

    // actions 테이블 (조치 이력)
    await client.query(`
      CREATE TABLE IF NOT EXISTS actions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        airline_id UUID NOT NULL REFERENCES airlines(id) ON DELETE CASCADE,
        callsign_id UUID NOT NULL REFERENCES callsigns(id) ON DELETE CASCADE,
        action_type VARCHAR(100) NOT NULL,
        description TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'pending'
          CHECK (status IN ('pending', 'in_progress', 'completed')),
        registered_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
        registered_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // announcements 테이블 (공지사항)
    await client.query(`
      CREATE TABLE IF NOT EXISTS announcements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        level VARCHAR(20) NOT NULL DEFAULT 'info'
          CHECK (level IN ('warning', 'info', 'success')),
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 인덱스 생성 (성능 최적화)
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_airline_id ON users(airline_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_callsigns_airline_id ON callsigns(airline_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_callsigns_status ON callsigns(status)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_actions_airline_id ON actions(airline_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_actions_callsign_id ON actions(callsign_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_actions_status ON actions(status)');

    console.log('[PostgreSQL] 스키마 초기화 완료');
  } catch (error) {
    console.error('[PostgreSQL] 스키마 초기화 에러:', error);
    throw error;
  }
}
```

**특징**:
- IF NOT EXISTS로 멱등성 보장
- UUID 타입 사용 (권장)
- CHECK 제약으로 데이터 무결성
- 외래키 제약 (CASCADE/SET NULL)
- 성능 인덱스

---

### 6. src/lib/db/index.ts (수정)

```typescript
/**
 * DB Provider Factory 패턴
 * 조건 분기는 최초 1회만 실행됨 (싱글톤)
 */

import type { DatabaseProvider, QueryResult } from './interface';

let _provider: DatabaseProvider | null = null;

/**
 * 싱글톤: Provider 인스턴스 반환
 * 최초 호출 시만 new 실행, 이후는 캐시된 인스턴스 반환
 */
function getProvider(): DatabaseProvider {
  if (_provider) return _provider;

  const dbProvider = process.env.DB_PROVIDER ?? 'sqlite';

  console.log('[DB Factory] Provider 선택:', dbProvider);

  if (dbProvider === 'postgresql') {
    // PostgreSQL Provider 로드 (동적 import)
    const { PostgreSQLProvider } = require('./providers/postgresql');
    _provider = new PostgreSQLProvider();
  } else if (dbProvider === 'sqlite') {
    // SQLite Provider 로드 (동적 import)
    const { SQLiteProvider } = require('./providers/sqlite');
    _provider = new SQLiteProvider();
  } else {
    throw new Error(
      `[DB Factory] 지원하지 않는 DB_PROVIDER: ${dbProvider}. sqlite 또는 postgresql을 설정하세요.`
    );
  }

  return _provider;
}

/**
 * SQL 쿼리 실행 (공개 API)
 * API Routes에서 import하는 함수
 */
export async function query(text: string, params?: any[]): Promise<QueryResult> {
  return getProvider().query(text, params);
}

/**
 * 트랜잭션 실행 (공개 API)
 */
export async function transaction<T>(
  callback: (query: (text: string, params?: any[]) => Promise<QueryResult>) => Promise<T>
): Promise<T> {
  return getProvider().transaction(callback);
}

/**
 * 연결 종료 (Graceful Shutdown)
 */
export async function closePool(): Promise<void> {
  if (_provider) {
    await _provider.closePool();
    _provider = null;
  }
}

// Next.js 앱 종료 시 호출
if (typeof process !== 'undefined') {
  process.on('SIGTERM', async () => {
    console.log('[DB] SIGTERM 신호 수신, 연결 정리 중...');
    await closePool();
    process.exit(0);
  });
}
```

**특징**:
- 조건 분기는 **단 1회** (최초 호출 시)
- 동적 import로 필요한 모듈만 로드
- 기존 API 호환성 유지 (query, transaction)
- Graceful shutdown 지원

---

### 7. docker-compose.yml (신규)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: katc1-postgres

    environment:
      POSTGRES_DB: katc1
      POSTGRES_USER: katc1_user
      POSTGRES_PASSWORD: katc1_password

    ports:
      - "5432:5432"

    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/postgresql-init.sql:/docker-entrypoint-initdb.d/init.sql

    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U katc1_user -d katc1"]
      interval: 5s
      timeout: 5s
      retries: 5

    networks:
      - katc1

networks:
  katc1:
    driver: bridge

volumes:
  postgres_data:
    driver: local
```

**실행**:
```bash
# PostgreSQL 서비스 시작
docker compose up -d postgres

# 로그 확인
docker compose logs -f postgres

# 서비스 중지
docker compose down
```

---

### 8. .env.example (수정)

**추가 항목**:
```env
# 데이터베이스 선택
DB_PROVIDER=sqlite              # sqlite 또는 postgresql

# SQLite (로컬 개발)
DB_PATH=./data/katc1.db

# PostgreSQL (로컬 Docker)
# DATABASE_URL=postgresql://katc1_user:katc1_password@localhost:5432/katc1

# PostgreSQL (Render 배포)
# DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[dbname]

# 환경
NODE_ENV=development            # development 또는 production
```

---

### 9. package.json (수정)

**dependencies 추가**:
```json
{
  "dependencies": {
    "pg": "^8.11.0",
    "@types/pg": "^8.11.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0"
  }
}
```

**설치 명령**:
```bash
npm install pg @types/pg
```

---

## 🔄 플레이스홀더 변환 검증

### 기존 SQL (변경 없음)
```typescript
// src/lib/db/queries/users.ts
export const USER_BY_EMAIL = `
  SELECT * FROM users WHERE email = ?
`;

export const INSERT_USER = `
  INSERT INTO users (email, password_hash, airline_id, role)
  VALUES (?, ?, ?, ?)
`;
```

### 자동 변환 (Provider 내부)
```typescript
// PostgreSQL의 경우:
"SELECT * FROM users WHERE email = ?"
→ "SELECT * FROM users WHERE email = $1"

"INSERT INTO users ... VALUES (?, ?, ?, ?)"
→ "INSERT INTO users ... VALUES ($1, $2, $3, $4)"
```

**이점**: SQL 파일 수정 없음, Provider에서 완전히 투명하게 처리

---

## 🧪 테스트 시나리오

### Scenario 1: 로컬 SQLite 테스트
```bash
# .env.local
DB_PROVIDER=sqlite

# 실행
npm run dev

# API 테스트
curl http://localhost:3000/api/airlines
# 결과: SQLiteProvider 사용
```

### Scenario 2: 로컬 PostgreSQL 테스트
```bash
# Docker 실행
docker compose up -d postgres

# .env.local
DB_PROVIDER=postgresql
DATABASE_URL=postgresql://katc1_user:katc1_password@localhost:5432/katc1

# 실행
npm run dev

# API 테스트
curl http://localhost:3000/api/airlines
# 결과: PostgreSQLProvider 사용
```

### Scenario 3: 빌드 검증
```bash
npm run build  # TypeScript 에러 없어야 함
npm run lint   # ESLint 경고 없어야 함
```

---

## ✅ 구현 체크리스트

- [ ] **파일 구조**
  - [ ] src/lib/db/interface.ts 생성
  - [ ] src/lib/db/providers/sqlite/ 디렉토리 생성
  - [ ] src/lib/db/providers/postgresql/ 디렉토리 생성

- [ ] **SQLite Provider**
  - [ ] providers/sqlite/index.ts 생성 (sqlite.ts 이동)
  - [ ] providers/sqlite/schema.ts 생성 (sqlite-schema.ts 이동)
  - [ ] 로컬 테스트 통과

- [ ] **PostgreSQL Provider**
  - [ ] providers/postgresql/index.ts 생성
  - [ ] providers/postgresql/schema.ts 생성
  - [ ] 플레이스홀더 변환 검증
  - [ ] 트랜잭션 테스트 통과

- [ ] **Factory & Config**
  - [ ] src/lib/db/index.ts 수정
  - [ ] docker-compose.yml 생성
  - [ ] .env.example 수정
  - [ ] package.json 수정 (pg 추가)

- [ ] **정리**
  - [ ] 기존 sqlite.ts 삭제
  - [ ] 기존 sqlite-schema.ts 삭제
  - [ ] npm install 실행

- [ ] **검증**
  - [ ] npm run build 성공
  - [ ] 로컬 SQLite 테스트
  - [ ] 로컬 PostgreSQL 테스트 (Docker)
  - [ ] API 엔드포인트 정상 작동

---

**작성자**: Claude Code
**최종 수정**: 2026-02-28
