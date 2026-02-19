# KATC1 인증 시스템 - 설계 문서

**프로젝트**: KATC1 유사호출부호 경고시스템 인증 모듈
**버전**: 1.0.0
**상태**: 설계 완료 (구현 단계)
**작성일**: 2026-02-19
**담당자**: AI Assistant

---

## 1. 시스템 개요

### 1.1 목적
항공사 유사호출부호 경고시스템(KATC1)의 사용자 인증 및 권한 관리 기능 제공

### 1.2 주요 기능
- 이메일/비밀번호 회원가입
- 이메일/비밀번호 로그인
- JWT 기반 토큰 관리
- 관리자 승인 워크플로우
- 사용자 상태 관리 (pending, active, suspended)

### 1.3 대상 사용자
- 일반 사용자 (항공사 직원)
- 관리자 (권한 검증 담당)

---

## 2. 시스템 아키텍처

### 2.1 아키텍처 다이어그램

```
┌──────────────────────────────────────────────────────────────┐
│                      클라이언트 (Browser)                       │
│                     React Component Layer                     │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ - LoginForm, SignupForm, UserApprovalTable             │  │
│  │ - Zustand State (accessToken, user)                    │  │
│  │ - react-hook-form (폼 관리)                             │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────┬───────────────────────────────────┘
                           │ HTTP/HTTPS
                           ↓
┌──────────────────────────────────────────────────────────────┐
│               Next.js 14 Full-Stack Application              │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Frontend Pages (App Router - Client Components)    │    │
│  │  - /login, /signup, /pending, /dashboard            │    │
│  │  - /admin/users (관리자 전용)                        │    │
│  └─────────────────────────────────────────────────────┘    │
│                     ↓                                         │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  API Routes (Server Components - Backend)           │    │
│  │  - POST /api/auth/signup (회원가입)                 │    │
│  │  - POST /api/auth/login (로그인)                    │    │
│  │  - POST /api/auth/logout (로그아웃)                 │    │
│  │  - GET /api/auth/me (사용자 정보 조회)              │    │
│  │  - POST /api/auth/refresh (토큰 갱신)               │    │
│  │  - GET /api/admin/users (사용자 목록 - 관리자만)   │    │
│  │  - PATCH /api/admin/users/[id] (사용자 상태 변경)  │    │
│  └─────────────────────────────────────────────────────┘    │
│                     ↓ TCP 5432 (SQL)                         │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Database Layer                                     │    │
│  │  - PostgreSQL Connection Pool (lib/db.ts)          │    │
│  │  - JWT Token Manager (lib/jwt.ts)                  │    │
│  │  - Password Hashing (bcryptjs)                     │    │
│  └─────────────────────────────────────────────────────┘    │
└──────────────────────────┬───────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────┐
│                    PostgreSQL 15 Database                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ users 테이블:                                         │   │
│  │ - id (UUID), email, password_hash                   │   │
│  │ - status (pending|active|suspended)                 │   │
│  │ - role (admin|user), approvals metadata             │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ audit_logs 테이블:                                   │   │
│  │ - user_id, action, table_name, old/new_data        │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 계층 설명

#### Frontend Layer (React + Zustand)
- **책임**: UI 렌더링, 사용자 입력 처리, 상태 관리
- **도구**:
  - react-hook-form (폼 제어)
  - zod (입력 검증)
  - Zustand (클라이언트 상태: accessToken, user)
  - TanStack Query (서버 상태: 사용자 목록 폴링)
- **특징**: 모든 API 호출은 자동으로 accessToken 헤더 포함

#### Backend Layer (Next.js API Routes)
- **책임**: 비즈니스 로직, 데이터 검증, 보안 확인
- **구성**:
  - `/api/auth/*` - 인증 관련
  - `/api/admin/*` - 관리자 전용
- **특징**:
  - 별도 Express 서버 없이 Next.js만 사용
  - 미들웨어에서 JWT 검증
  - 모든 응답에 보안 헤더 추가

#### Data Layer (PostgreSQL)
- **책임**: 데이터 영속성, ACID 보장
- **구성**:
  - users 테이블 (사용자 정보)
  - audit_logs 테이블 (감시 로그)
- **특징**: 인덱스 최적화, 제약조건 강제

---

## 3. 데이터 모델

### 3.1 Users 테이블

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
    CHECK (status IN ('pending', 'active', 'suspended')),
  role VARCHAR(50) NOT NULL DEFAULT 'user',
    CHECK (role IN ('admin', 'user')),
  approved_at TIMESTAMP,
  approved_by UUID REFERENCES users(id),
  last_login_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
```

#### 필드 설명

| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID | 사용자 고유 식별자 |
| email | VARCHAR(255) | 로그인 이메일 (유일) |
| password_hash | VARCHAR(255) | bcrypt 해시된 비밀번호 |
| status | VARCHAR(50) | pending/active/suspended |
| role | VARCHAR(50) | admin/user |
| approved_at | TIMESTAMP | 승인 시각 |
| approved_by | UUID | 승인한 관리자 ID |
| last_login_at | TIMESTAMP | 마지막 로그인 시각 |
| created_at | TIMESTAMP | 가입 시각 |
| updated_at | TIMESTAMP | 마지막 수정 시각 |

### 3.2 Audit Logs 테이블

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  table_name VARCHAR(50),
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

#### 필드 설명

| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID | 로그 고유 식별자 |
| user_id | UUID | 작업 수행한 사용자 |
| action | VARCHAR(50) | LOGIN, CREATE_USER, APPROVE_USER, etc |
| table_name | VARCHAR(50) | 작업 대상 테이블 |
| old_data | JSONB | 변경 전 데이터 |
| new_data | JSONB | 변경 후 데이터 |
| created_at | TIMESTAMP | 작업 시각 |

---

## 4. API 인터페이스

### 4.1 인증 엔드포인트

#### 회원가입
```http
POST /api/auth/signup
Content-Type: application/json

Request:
{
  "email": "user@example.com",
  "password": "Test1234"
}

Response (200):
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "status": "pending",
    "role": "user",
    "createdAt": "2026-02-19T..."
  },
  "accessToken": "eyJhbGc..."
}

Response (400):
{
  "error": "올바른 이메일을 입력해주세요." | "이미 사용 중인 이메일입니다."
}
```

#### 로그인
```http
POST /api/auth/login
Content-Type: application/json

Request:
{
  "email": "user@example.com",
  "password": "Test1234"
}

Response (200):
{
  "user": { ... },
  "accessToken": "eyJhbGc...",
  "refreshToken": "... (쿠키로 설정됨)"
}

Response (401):
{
  "error": "이메일 또는 비밀번호가 올바르지 않습니다."
}

Response (403):
{
  "error": "정지된 계정입니다."
}
```

#### 토큰 갱신
```http
POST /api/auth/refresh
Cookie: refreshToken=...

Response (200):
{
  "accessToken": "새로운 JWT 토큰"
}

Response (401):
{
  "error": "인증이 필요합니다."
}
```

#### 사용자 정보 조회
```http
GET /api/auth/me
Authorization: Bearer <accessToken>

Response (200):
{
  "id": "uuid",
  "email": "user@example.com",
  "status": "active",
  "role": "user"
}

Response (401):
{
  "error": "인증이 필요합니다."
}
```

#### 로그아웃
```http
POST /api/auth/logout
Authorization: Bearer <accessToken>

Response (200):
{
  "message": "로그아웃 되었습니다."
}
```

### 4.2 관리자 엔드포인트

#### 사용자 목록 조회
```http
GET /api/admin/users?status=pending
Authorization: Bearer <adminToken>

Response (200):
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "status": "pending",
      "role": "user",
      "createdAt": "2026-02-19T...",
      "lastLoginAt": null
    }
  ]
}

Response (403):
{
  "error": "관리자만 접근 가능합니다."
}
```

#### 사용자 상태 변경
```http
PATCH /api/admin/users/{userId}
Authorization: Bearer <adminToken>
Content-Type: application/json

Request:
{
  "status": "active" | "suspended"
}

Response (200):
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "status": "active",
    "approvedAt": "2026-02-19T...",
    "approvedBy": "admin-uuid"
  }
}
```

---

## 5. 보안 설계

### 5.1 인증 (Authentication)

#### JWT 토큰 구조
```
Access Token:
- 유효기간: 1시간
- 저장소: Zustand 메모리 (클라이언트)
- 헤더: Authorization: Bearer <token>

Refresh Token:
- 유효기간: 7일
- 저장소: httpOnly 쿠키
- 목적: 새 access token 발급
```

#### 토큰 갱신 플로우
```
1. Access token 만료 (401 응답)
2. 클라이언트가 POST /api/auth/refresh 호출
3. 쿠키의 refreshToken 자동 포함
4. 서버에서 새 access token 발급
5. 자동으로 원래 요청 재시도
```

### 5.2 인가 (Authorization)

#### 역할 기반 접근 제어 (RBAC)
```
User 역할:
- /dashboard 접근 가능
- /admin/* 접근 불가 → /dashboard 리다이렉트

Admin 역할:
- /admin/* 모든 기능 접근 가능
- 사용자 승인/거부 가능
```

#### 상태 기반 접근 제어
```
Pending 상태:
- 로그인 불가 (또는 로그인 후 /pending 이동)
- /pending 페이지에서 30초마다 상태 폴링
- 승인되면 /dashboard로 자동 이동

Active 상태:
- 모든 기능 이용 가능

Suspended 상태:
- 로그인 거부
- /login으로 리다이렉트
- 오류 메시지: "정지된 계정입니다"
```

### 5.3 비밀번호 보안

#### 비밀번호 정책
```
요구사항:
- 최소 8자
- 최소 1개의 대문자 (A-Z)
- 최소 1개의 숫자 (0-9)

정규식: /^(?=.*[A-Z])(?=.*\d).{8,}$/
```

#### 비밀번호 해싱
```
알고리즘: bcryptjs
라운드: 10 (솔트 라운드)
저장: password_hash (VARCHAR 255)

예시:
입력: "Test1234"
해시: "$2b$10$8NB3YMh5Q6Kx..."
```

### 5.4 기타 보안 조치

#### XSS 방어
- httpOnly 쿠키 사용 (JavaScript 접근 불가)
- Content-Security-Policy 헤더

#### CSRF 방어
- SameSite=Lax 쿠키 정책
- CORS 설정 (특정 도메인만 허용)

#### SQL Injection 방어
- Prepared Statements (pg.Pool 사용)
- 모든 입력값 매개변수화

#### Brute Force 방어 (향후)
- Rate Limiting 추가 예정
- 로그인 시도 횟수 제한

---

## 6. 상태 흐름

### 6.1 사용자 상태 다이어그램

```
┌──────────┐
│ Pending  │  (가입 후 기본 상태)
└────┬─────┘
     │
     ├─ (관리자 승인)
     │
     ↓
┌──────────┐     (관리자 정지)    ┌────────────┐
│  Active  │◄─────────────────────┤ Suspended │
└────┬─────┘                      └───────────┘
     │
     └─ (로그아웃 또는 세션 만료)

상태 전이 규칙:
- pending → active: 관리자 승인만 가능
- active → suspended: 관리자 정지 가능
- suspended → active: 관리자 활성화 가능
- 삭제: 미구현 (데이터 보관)
```

### 6.2 인증 프로세스

```
┌──────────────────────────────────────────┐
│  회원가입 (Signup)                        │
├──────────────────────────────────────────┤
│ 1. 이메일 + 비밀번호 입력                   │
│ 2. 클라이언트 검증 (zod)                   │
│ 3. POST /api/auth/signup                │
│ 4. 서버: 이메일 중복 체크                   │
│ 5. 서버: 비밀번호 bcrypt 해싱              │
│ 6. 서버: users 테이블에 INSERT             │
│    (status='pending', role='user')      │
│ 7. 응답: user + accessToken              │
│ 8. 클라이언트: Zustand에 저장               │
│ 9. /pending 페이지로 이동                  │
│    (30초마다 상태 폴링)                    │
│ 10. 관리자 승인 후 /dashboard 자동 이동     │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│  로그인 (Login)                           │
├──────────────────────────────────────────┤
│ 1. 이메일 + 비밀번호 입력                   │
│ 2. 클라이언트 검증                         │
│ 3. POST /api/auth/login                 │
│ 4. 서버: 이메일로 사용자 조회               │
│ 5. 서버: bcrypt.compare로 비밀번호 검증    │
│ 6. 서버: status 확인                      │
│    - pending: /pending으로 리다이렉트      │
│    - suspended: 403 에러 반환              │
│    - active: 계속                         │
│ 7. 서버: JWT 토큰 생성                     │
│ 8. 응답: user + accessToken + refreshToken │
│ 9. 클라이언트: accessToken 메모리 저장      │
│           refreshToken 쿠키 저장          │
│ 10. /dashboard로 이동                     │
│ 11. 마지막 로그인 시각 업데이트             │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│  토큰 자동 갱신 (Auto Refresh)            │
├──────────────────────────────────────────┤
│ 1. 401 응답 수신 (accessToken 만료)       │
│ 2. POST /api/auth/refresh 자동 호출       │
│ 3. 쿠키의 refreshToken 자동 포함           │
│ 4. 서버: refreshToken 검증                │
│ 5. 서버: 새 accessToken 생성               │
│ 6. 응답: 새 accessToken                  │
│ 7. 클라이언트: Zustand 업데이트            │
│ 8. 원래 요청 자동 재시도                   │
└──────────────────────────────────────────┘
```

---

## 7. 배포 전략

### 7.1 개발 (Development)
- **환경**: 로컬 Docker PostgreSQL
- **서버**: `npm run dev` (localhost:3001)
- **데이터**: 로컬 테이블

### 7.2 스테이징 (Staging)
- **환경**: AWS RDS PostgreSQL
- **서버**: AWS EC2 (Docker)
- **테스트**: 실제 배포 환경과 동일

### 7.3 프로덕션 (Production) - Phase 1: AWS
- **환경**: AWS RDS PostgreSQL
- **서버**: AWS EC2 (Docker Compose)
- **CDN**: CloudFront
- **SSL**: Let's Encrypt

### 7.4 프로덕션 - Phase 2: 공공기관
- **환경**: 공공기관 PostgreSQL
- **서버**: 공공기관 WAS
- **마이그레이션**: 1-2개월 (AWS에서 병렬 운영 후 전환)

---

## 8. 모니터링 & 로깅

### 8.1 로그 항목
```typescript
- LOGIN: user_id, email, status
- SIGNUP: email, status='pending'
- APPROVE_USER: admin_id, user_id, old_status, new_status
- SUSPEND_USER: admin_id, user_id
- TOKEN_REFRESH: user_id, success/failure
- API_ERROR: endpoint, status_code, error_message
```

### 8.2 모니터링 메트릭
```
- 로그인 실패율
- 토큰 갱신 성공율
- API 응답시간
- 데이터베이스 쿼리 성능
- 동시 사용자 수
```

---

## 9. 확장 가능성 (Future Work)

### 9.1 보안 향상 (Priority: High)
- [ ] 2FA (Two-Factor Authentication)
- [ ] OAuth 통합 (Google, GitHub)
- [ ] Rate Limiting
- [ ] IP Whitelist

### 9.2 기능 확장 (Priority: Medium)
- [ ] 비밀번호 변경 / 찾기
- [ ] 이메일 알림
- [ ] 로그인 히스토리
- [ ] 다중 기기 세션 관리

### 9.3 운영 (Priority: Low)
- [ ] 감시 로그 대시보드
- [ ] 자동 백업
- [ ] 성능 최적화 (caching)
- [ ] GraphQL API

---

## 10. 참고 문서

| 문서 | 경로 | 설명 |
|------|------|------|
| 배포 가이드 | DEPLOYMENT_GUIDE.md | AWS/공공기관 배포 절차 |
| 설정 요약 | SETUP_SUMMARY.md | 로컬 테스트 설정 |
| 개발 계획 | DEVELOPMENT_PLAN.md | 전체 개발 로드맵 |
| 정리 보고서 | CLEANUP_SUMMARY.md | 코드 정리 현황 |

---

## 체크리스트

- [x] 아키텍처 설계 완료
- [x] 데이터 모델 정의
- [x] API 인터페이스 명세
- [x] 보안 설계 검토
- [x] 상태 전이 도표
- [x] 배포 전략 수립
- [ ] 운영 매뉴얼 작성 (진행 중)
- [ ] 테스트 케이스 정의 (향후)
