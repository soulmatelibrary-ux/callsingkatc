# 설계서: DB Provider 분리 (SQLite → PostgreSQL 지원)

**문서 ID**: DESIGN-001
**작성일**: 2026-02-28
**상태**: Draft
**버전**: 1.0

---

## 📋 개요

### 배경
- **문제**: Render 배포 시 SQLite의 ephemeral 파일시스템으로 인한 데이터 손실 위험
- **솔루션**: Provider Pattern을 통한 SQLite/PostgreSQL 선택 가능 아키텍처
- **목표**: 조건문 없이 깔끔한 분리, 기존 API 수정 불필요

### 범위
```
✅ 포함:
  - DatabaseProvider 인터페이스 정의
  - SQLite Provider 구현체 분리
  - PostgreSQL Provider 신규 구현
  - Factory 패턴 도입
  - Docker Compose 설정
  - 환경변수 표준화

❌ 제외:
  - API Routes 수정 (Provider Pattern으로 투명화)
  - SQL 쿼리 수정 (? 플레이스홀더 자동 변환)
  - 데이터 마이그레이션 도구 (추후 별도 작업)
```

---

## 🏗️ 아키텍처 설계

### 현재 구조 (변경 전)
```
src/lib/db/
├── index.ts          ← SQLite 하드코딩
├── sqlite.ts         ← better-sqlite3 구현
├── sqlite-schema.ts  ← SQLite 스키마
└── queries/
    └── *.ts          ← ? 플레이스홀더
```

**문제점**:
- `index.ts`에 SQLite 로직이 직접 포함됨
- PostgreSQL 지원 시 조건문으로 분기 필요 (유지보수 어려움)
- Provider 간 인터페이스 불일치 위험

### 새 구조 (변경 후)
```
src/lib/db/
├── interface.ts                  ← [신규] DatabaseProvider 인터페이스
├── providers/
│   ├── sqlite/
│   │   ├── index.ts              ← [이동] SQLite 구현체 (클래스화)
│   │   └── schema.ts             ← [이동] SQLite 스키마
│   └── postgresql/
│       ├── index.ts              ← [신규] PostgreSQL 구현체
│       └── schema.ts             ← [신규] PostgreSQL 스키마 (init.sql 기반)
├── index.ts                      ← [수정] Factory (조건 분기 단 1회)
└── queries/                      ← [유지] ? 플레이스홀더
    └── *.ts
```

**장점**:
- 각 Provider가 완전히 독립적
- 새로운 DB 추가 용이 (MongoDBProvider 등)
- 조건 분기는 Factory에서만 발생
- 기존 쿼리 파일 수정 불필요

---

## 🔧 주요 설계 결정

### 1. DatabaseProvider 인터페이스

```typescript
// src/lib/db/interface.ts
export interface QueryResult {
  rows: any[];
  rowCount: number;
  changes?: number;  // INSERT/UPDATE/DELETE의 영향받은 행 수
}

export interface DatabaseProvider {
  /**
   * SQL 쿼리 실행
   * @param text - SQL 쿼리 (? 또는 $N 플레이스홀더)
   * @param params - 바인드 파라미터
   * @returns 쿼리 결과
   */
  query(text: string, params?: any[]): Promise<QueryResult>;

  /**
   * 트랜잭션 실행
   * @param callback - DB 작업 콜백
   * @returns 콜백 반환값
   */
  transaction<T>(
    callback: (query: (text: string, params?: any[]) => Promise<QueryResult>) => Promise<T>
  ): Promise<T>;

  /**
   * 연결 풀 정리
   */
  closePool(): Promise<void>;
}
```

**설계 원칙**:
- 비동기 처리 (SQLite도 Promise 반환)
- 플레이스홀더 자동 변환 (Provider 내부에서 처리)
- 트랜잭션 지원 필수

### 2. SQLiteProvider 구현

**파일**: `src/lib/db/providers/sqlite/index.ts`

기존 `sqlite.ts`를 클래스로 래핑:

```typescript
export class SQLiteProvider implements DatabaseProvider {
  private db: Database.Database;

  constructor() {
    // 기존 initSQLite() 로직을 생성자로 통합
    this.db = new Database(process.env.DB_PATH || './data/katc1.db');
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    initializeSchema(this.db);
  }

  async query(text: string, params?: any[]): Promise<QueryResult> {
    // 기존 query() 함수 로직
    const stmt = this.db.prepare(text);
    // ... 실행 로직
    return { rows, rowCount, changes };
  }

  async transaction<T>(callback: (query: Function) => Promise<T>): Promise<T> {
    // SQLite: db.transaction() 활용
    return this.db.transaction(async (queryFn) => {
      return await callback(queryFn);
    })();
  }

  async closePool(): Promise<void> {
    this.db.close();
  }
}
```

**특징**:
- 기존 코드 최소 변경 (래핑만)
- SQLite 특화 최적화 유지 (WAL, 외래키)
- better-sqlite3의 동기 API를 Promise로 래핑

### 3. PostgreSQLProvider 구현

**파일**: `src/lib/db/providers/postgresql/index.ts`

```typescript
import { Pool } from 'pg';

/**
 * ? → $1, $2, ... 자동 변환
 * 기존 SQL 쿼리 수정 불필요
 */
function convertPlaceholders(sql: string): string {
  let counter = 1;
  return sql.replace(/\?/g, () => `$${counter++}`);
}

export class PostgreSQLProvider implements DatabaseProvider {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
    });

    // 최초 연결 시 스키마 초기화
    this.initSchema();
  }

  private async initSchema(): Promise<void> {
    // scripts/postgresql-init.sql 기반으로 테이블 자동 생성
    // IF NOT EXISTS 사용으로 멱등성 보장
  }

  async query(text: string, params?: any[]): Promise<QueryResult> {
    const pgSql = convertPlaceholders(text);
    const result = await this.pool.query(pgSql, params);
    return {
      rows: result.rows,
      rowCount: result.rowCount ?? 0,
    };
  }

  async transaction<T>(callback: (query: Function) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback((sql: string, params?: any[]) =>
        this.query(sql, params, client)
      );
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async closePool(): Promise<void> {
    await this.pool.end();
  }
}
```

**특징**:
- 자동 플레이스홀더 변환 (기존 쿼리 호환)
- Connection Pool 관리 (성능)
- TLS/SSL 지원 (프로덕션 보안)
- 트랜잭션 안전성 (자동 ROLLBACK)

### 4. Factory 패턴 (src/lib/db/index.ts)

```typescript
import type { DatabaseProvider } from './interface';

let _provider: DatabaseProvider | null = null;

/**
 * 싱글톤 패턴: Provider는 애플리케이션당 1개만 생성
 * 조건 분기는 최초 1회만 실행
 */
function getProvider(): DatabaseProvider {
  if (_provider) return _provider;

  const dbProvider = process.env.DB_PROVIDER ?? 'sqlite';

  if (dbProvider === 'postgresql') {
    const { PostgreSQLProvider } = require('./providers/postgresql');
    _provider = new PostgreSQLProvider();
  } else if (dbProvider === 'sqlite') {
    const { SQLiteProvider } = require('./providers/sqlite');
    _provider = new SQLiteProvider();
  } else {
    throw new Error(`Unknown DB_PROVIDER: ${dbProvider}`);
  }

  console.log(`[DB] 초기화됨: ${dbProvider}`);
  return _provider;
}

// API Routes에서 import하는 공개 함수 (변경 없음)
export async function query(text: string, params?: any[]) {
  return getProvider().query(text, params);
}

export async function transaction<T>(callback: Function) {
  return getProvider().transaction(callback);
}

export async function closePool() {
  return getProvider().closePool();
}
```

**특징**:
- 조건 분기 **단 1회** (최초 호출 시)
- 이후 호출은 이미 생성된 Provider 재사용
- API Routes 변경 없음 (호환성 유지)

---

## 🗄️ 데이터베이스 스키마 설계

### PostgreSQL 스키마

**파일**: `src/lib/db/providers/postgresql/schema.ts`

기존 `scripts/init.sql`을 기반으로:

1. **UUID 기본값** (SQLite의 INTEGER 대신)
   ```sql
   id UUID PRIMARY KEY DEFAULT gen_random_uuid()
   ```

2. **Boolean 타입** (SQLite의 0/1 대신)
   ```sql
   is_active BOOLEAN DEFAULT true
   ```

3. **타임스탬프** (CURRENT_TIMESTAMP 동일, NOW() 호환)
   ```sql
   created_at TIMESTAMP NOT NULL DEFAULT NOW()
   ```

4. **인덱스** (성능 최적화)
   ```sql
   CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
   CREATE INDEX IF NOT EXISTS idx_callsigns_airline_id ON callsigns(airline_id);
   ```

### SQLite vs PostgreSQL 비교

| 항목 | SQLite | PostgreSQL |
|------|--------|------------|
| **ID 타입** | INTEGER PRIMARY KEY | UUID |
| **플레이스홀더** | `?` | `$1, $2` |
| **Boolean** | 0/1 정수 | true/false |
| **타임스탬프** | CURRENT_TIMESTAMP | NOW() |
| **트랜잭션** | db.transaction() | BEGIN/COMMIT/ROLLBACK |
| **연결풀** | 단일 연결 | Pool 관리 |

**중요**: 플레이스홀더 자동 변환으로 SQL 파일 수정 불필요

---

## 🐳 Docker 구성

### docker-compose.yml

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

volumes:
  postgres_data:
    driver: local
```

**특징**:
- Alpine 이미지 (경량)
- Health check (준비 상태 확인)
- 볼륨 마운트 (데이터 영속성)
- 자동 스키마 초기화

---

## 🌍 환경변수 전략

### 로컬 개발 (SQLite)

**.env.local**:
```env
DB_PROVIDER=sqlite
DB_PATH=./data/katc1.db
NODE_ENV=development
```

### 로컬 개발 (PostgreSQL with Docker)

**.env.local**:
```env
DB_PROVIDER=postgresql
DATABASE_URL=postgresql://katc1_user:katc1_password@localhost:5432/katc1
NODE_ENV=development
```

**실행**:
```bash
docker compose up -d postgres
npm run dev
```

### 프로덕션 (Render)

**Render 환경변수**:
```env
DB_PROVIDER=postgresql
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[dbname]
NODE_ENV=production
```

**특징**:
- Render PostgreSQL Internal URL 사용
- TLS/SSL 자동 활성화

---

## 📦 패키지 변경

### 신규 의존성

```json
{
  "dependencies": {
    "pg": "^8.11.0",
    "@types/pg": "^8.11.0"
  }
}
```

### 기존 의존성 유지

```json
{
  "dependencies": {
    "better-sqlite3": "^9.2.0"
  }
}
```

---

## 🔄 마이그레이션 전략

### Phase 1: 개발 환경
1. 로컬에서 Docker PostgreSQL 테스트
2. 기존 SQLite 데이터 마이그레이션 (별도 도구)
3. API 검증

### Phase 2: 배포 환경
1. Render PostgreSQL 연결 확인
2. 환경변수 설정 (DATABASE_URL)
3. 스키마 자동 초기화 (initSchema())

### Phase 3: 롤백 (필요시)
1. 환경변수 변경: `DB_PROVIDER=sqlite`
2. 기존 SQLite 복원
3. 데이터 재마이그레이션

---

## ✅ 검증 계획

### 단위 테스트 (추후)
```typescript
describe('DatabaseProvider', () => {
  describe('SQLiteProvider', () => {
    it('should execute query', async () => { ... });
    it('should handle transaction', async () => { ... });
  });

  describe('PostgreSQLProvider', () => {
    it('should convert ? to $N', async () => { ... });
    it('should support SSL', async () => { ... });
  });
});
```

### 통합 테스트
- `GET /api/airlines` → 조회 확인
- `POST /api/actions` → 삽입 확인
- 트랜잭션 → 롤백 확인

### 성능 테스트
- SQLite vs PostgreSQL 응답시간
- 동시 연결 처리 (PostgreSQL Pool)

---

## 📊 파일 변경 요약

| 파일 경로 | 작업 | 설명 |
|-----------|------|------|
| `src/lib/db/interface.ts` | 신규 생성 | DatabaseProvider 인터페이스 |
| `src/lib/db/providers/sqlite/index.ts` | 신규 생성 | SQLite 구현체 (기존 코드 이동) |
| `src/lib/db/providers/sqlite/schema.ts` | 신규 생성 | SQLite 스키마 (기존 코드 이동) |
| `src/lib/db/providers/postgresql/index.ts` | 신규 생성 | PostgreSQL 구현체 |
| `src/lib/db/providers/postgresql/schema.ts` | 신규 생성 | PostgreSQL 스키마 초기화 |
| `src/lib/db/index.ts` | 수정 | Factory 패턴으로 변경 |
| `src/lib/db/sqlite.ts` | 삭제 | providers/sqlite/로 이동 |
| `src/lib/db/sqlite-schema.ts` | 삭제 | providers/sqlite/로 이동 |
| `docker-compose.yml` | 신규 생성 | PostgreSQL 서비스 |
| `scripts/postgresql-init.sql` | 신규 생성 | PostgreSQL 스키마 초기화 |
| `.env.example` | 수정 | DB_PROVIDER, DATABASE_URL 추가 |
| `package.json` | 수정 | pg, @types/pg 추가 |

**수정 없는 파일**:
- `src/app/api/**/*.ts` (31개 API Route)
- `src/lib/db/queries/**/*.ts` (플레이스홀더 자동 변환)
- `src/lib/db.ts` (re-export, 호환성 유지)

---

## 🎯 마이그레이션 체크리스트

### 구현 전
- [ ] 기존 SQLite 데이터 백업
- [ ] PostgreSQL 초기화 스크립트 검증
- [ ] 환경변수 템플릿 준비

### 구현 중
- [ ] DatabaseProvider 인터페이스 작성
- [ ] SQLiteProvider 구현
- [ ] PostgreSQLProvider 구현
- [ ] Factory 패턴 적용
- [ ] Docker Compose 작성
- [ ] 패키지 설치

### 구현 후
- [ ] 로컬 SQLite 테스트
- [ ] 로컬 PostgreSQL 테스트 (Docker)
- [ ] API 엔드포인트 검증
- [ ] 트랜잭션 테스트
- [ ] 빌드 검증 (`npm run build`)
- [ ] Git 커밋

### 배포 전
- [ ] Render PostgreSQL 연결 테스트
- [ ] 환경변수 설정 확인
- [ ] 데이터 마이그레이션 (기존 SQLite → PostgreSQL)
- [ ] 스키마 초기화 검증

---

## 📝 주의사항

1. **플레이스홀더 변환 테스트**
   - 기존 SQL의 `?` 개수 확인
   - 변환 후 `$1, $2, ...` 순서 검증

2. **트랜잭션 콜백**
   - SQLite: 동기 API
   - PostgreSQL: 비동기 API
   - 인터페이스는 비동기로 통일

3. **연결풀 관리**
   - PostgreSQL: 최대 연결 수 설정 필요 (추후)
   - 애플리케이션 종료 시 closePool() 호출

4. **환경변수 기본값**
   - `DB_PROVIDER` 미설정 시 SQLite 사용 (하위호환성)
   - `DATABASE_URL` 설정 시 자동으로 PostgreSQL 인식

---

## 🔗 참조

- PostgreSQL 공식: https://www.postgresql.org/
- pg 라이브러리: https://github.com/brianc/node-postgres
- better-sqlite3: https://github.com/WiseLibs/better-sqlite3
- Provider Pattern: https://refactoring.guru/design-patterns/provider

---

**작성자**: Claude Code
**검토자**: [대기 중]
**승인자**: [대기 중]
**마지막 수정**: 2026-02-28
