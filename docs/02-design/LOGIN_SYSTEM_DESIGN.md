# KATC1 로그인 시스템 설계서

**프로젝트**: KATC1 인증 시스템
**주제**: 로그인(Login) 시스템 설계
**버전**: 1.0.0
**작성일**: 2026-02-19

---

## 1. 개요

### 1.1 로그인 정의
사용자가 이메일과 비밀번호로 본인을 확인하고 시스템에 접근 권한을 얻는 프로세스

### 1.2 범위
- 사용자 인증 (Identification + Authentication)
- JWT 토큰 발급
- 세션 관리
- 상태 기반 라우팅

### 1.3 목표
1. **보안성**: 비밀번호 안전 검증, 토큰 기반 인증
2. **사용성**: 직관적인 UI, 빠른 응답
3. **확장성**: 2FA, OAuth 추가 가능성
4. **신뢰성**: 토큰 자동 갱신, 에러 처리

---

## 2. 시스템 아키텍처

### 2.1 레이어 구조

```
┌─────────────────────────────────────────────────┐
│  Frontend (React)                               │
│  ┌───────────────────────────────────────────┐  │
│  │ LoginForm Component                       │  │
│  │ - 폼 검증 (zod)                           │  │
│  │ - 에러 표시                                │  │
│  │ - 로딩 상태                                │  │
│  └───────────────────────────────────────────┘  │
└────────────────┬────────────────────────────────┘
                 │ HTTP POST /api/auth/login
                 │ { email, password }
                 ↓
┌─────────────────────────────────────────────────┐
│  Backend (Next.js API Route)                    │
│  ┌───────────────────────────────────────────┐  │
│  │ POST /api/auth/login                      │  │
│  │ 1. 요청 검증                               │  │
│  │ 2. 사용자 조회 (database)                 │  │
│  │ 3. 비밀번호 검증 (bcrypt.compare)        │  │
│  │ 4. 상태 확인 (pending|active|suspended)  │  │
│  │ 5. JWT 토큰 생성                         │  │
│  │ 6. last_login_at 업데이트                │  │
│  │ 7. 응답 반환                              │  │
│  └───────────────────────────────────────────┘  │
└────────────────┬────────────────────────────────┘
                 │
                 ↓ SQL Query
┌─────────────────────────────────────────────────┐
│  Database (PostgreSQL)                          │
│  ┌───────────────────────────────────────────┐  │
│  │ users 테이블                              │  │
│  │ SELECT * FROM users WHERE email = $1     │  │
│  │ UPDATE users SET last_login_at = NOW()   │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## 3. 데이터 흐름

### 3.1 로그인 요청 흐름

```
사용자 입력
    ↓
클라이언트 검증 (zod)
    ↓
API 호출 (POST /api/auth/login)
    ↓
┌─ 서버에서 ─────────────────┐
│ 1. 요청 파싱                │
│ 2. 쿼리: SELECT FROM users │
│    WHERE email = $1         │
│ 3. 비밀번호 비교            │
│    bcrypt.compare()         │
│ 4. 상태 확인                │
│ 5. JWT 생성                 │
│ 6. 업데이트: last_login_at │
└────────────────────────────┘
    ↓
응답
    ├─ user 객체
    ├─ accessToken
    └─ refreshToken (쿠키)
    ↓
클라이언트 저장
    ├─ Zustand: accessToken (메모리)
    ├─ 쿠키: refreshToken (httpOnly)
    └─ 로컬스토리지: user (선택사항)
    ↓
라우팅
    ├─ status=pending → /pending (폴링)
    ├─ status=suspended → 에러 표시
    └─ status=active → /dashboard
```

---

## 4. 데이터베이스 설계

### 4.1 사용자 테이블 (Users)

```sql
CREATE TABLE users (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 로그인 정보
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,

  -- 상태 관리
  status VARCHAR(50) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'suspended')),
  role VARCHAR(50) NOT NULL DEFAULT 'user'
    CHECK (role IN ('admin', 'user')),

  -- 승인 정보
  approved_at TIMESTAMP,
  approved_by UUID REFERENCES users(id),

  -- 로그인 히스토리
  last_login_at TIMESTAMP,

  -- 타임스탬프
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 쿼리 성능 최적화 인덱스
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
```

### 4.2 데이터베이스 쿼리

#### 로그인 단계별 쿼리

**1단계: 사용자 조회**
```sql
SELECT
  id,
  email,
  password_hash,
  status,
  role
FROM users
WHERE email = $1
LIMIT 1;
```

**2단계: 로그인 성공 - 마지막 로그인 시간 업데이트**
```sql
UPDATE users
SET last_login_at = NOW(), updated_at = NOW()
WHERE id = $1;
```

**3단계: 감시 로그 기록 (선택사항)**
```sql
INSERT INTO audit_logs (user_id, action, new_data, created_at)
VALUES ($1, 'LOGIN', json_build_object('email', $2, 'ip', $3), NOW());
```

---

## 5. 프론트엔드 설계

### 5.1 LoginForm 컴포넌트

#### 구조
```typescript
// src/components/forms/LoginForm.tsx

interface LoginFormValues {
  email: string;
  password: string;
}

const loginSchema = z.object({
  email: z
    .string()
    .min(1, '이메일을 입력해주세요.')
    .email('유효한 이메일을 입력해주세요.'),
  password: z
    .string()
    .min(1, '비밀번호를 입력해주세요.')
});
```

#### 상태 관리
```typescript
const [serverError, setServerError] = useState<string | null>(null);
const [isLoading, setIsLoading] = useState(false);

// react-hook-form + Zod
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(loginSchema)
});

// Zustand 스토어
const setAuth = useAuthStore(s => s.setAuth);
```

#### UI 요소
```
┌─────────────────────────────────┐
│  Login Form                     │
├─────────────────────────────────┤
│                                 │
│  Email: [________________]       │
│         └─ 에러 메시지 (필요시)  │
│                                 │
│  Password: [________________]    │
│           └─ 에러 메시지 (필요시)│
│                                 │
│  [서버 에러 메시지]             │
│  (빨간 박스)                    │
│                                 │
│  [ 로그인 ]                     │
│  (로딩 중: 비활성화)            │
│                                 │
│  [비밀번호 찾기] [회원가입]      │
│                                 │
└─────────────────────────────────┘
```

### 5.2 폼 검증

#### 클라이언트 검증 (즉시)
```
입력 변경
    ↓
Zod 스키마 검증
    ↓
에러 메시지 표시
```

#### 제약조건
1. **이메일**: 필수, 이메일 형식
2. **비밀번호**: 필수, 최소 1자

#### 에러 처리

| 상황 | 메시지 |
|------|--------|
| 이메일 빈칸 | "이메일을 입력해주세요." |
| 이메일 형식 오류 | "유효한 이메일을 입력해주세요." |
| 비밀번호 빈칸 | "비밀번호를 입력해주세요." |
| 자격 증명 오류 | "이메일 또는 비밀번호가 올바르지 않습니다." |
| 승인 대기 중 | "관리자의 승인을 기다리는 중입니다." |
| 정지된 계정 | "정지된 계정입니다." |
| 네트워크 오류 | "네트워크 오류가 발생했습니다." |

---

## 6. 백엔드 설계

### 6.1 API 엔드포인트

#### POST /api/auth/login

**URL**: `http://localhost:3001/api/auth/login` (개발)
**메서드**: `POST`
**인증**: 불필요 (공개 엔드포인트)

#### 요청 형식

```http
POST /api/auth/login HTTP/1.1
Host: localhost:3001
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Test1234"
}
```

#### 응답 형식 (성공 - 200)

```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "status": "active",
    "role": "user",
    "createdAt": "2026-02-19T10:30:00Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 응답 형식 (오류 - 4xx/5xx)

```json
// 401: 자격 증명 오류
{
  "error": "이메일 또는 비밀번호가 올바르지 않습니다."
}

// 403: 정지된 계정
{
  "error": "정지된 계정입니다."
}

// 400: 잘못된 요청
{
  "error": "유효한 이메일을 입력해주세요."
}

// 500: 서버 오류
{
  "error": "로그인 중 오류가 발생했습니다."
}
```

### 6.2 로그인 로직 (의사코드)

```typescript
// src/app/api/auth/login/route.ts

async function POST(request: Request) {
  try {
    // 1. 요청 파싱
    const { email, password } = await request.json();

    // 2. 입력 검증
    if (!email || !password) {
      return Response(400, { error: '이메일과 비밀번호를 입력해주세요.' });
    }

    // 3. 데이터베이스 조회
    const user = await query(
      'SELECT id, email, password_hash, status, role FROM users WHERE email = $1',
      [email]
    );

    if (!user) {
      return Response(401, { error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    // 4. 비밀번호 검증 (bcrypt)
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return Response(401, { error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    // 5. 상태 확인
    if (user.status === 'suspended') {
      return Response(403, { error: '정지된 계정입니다.' });
    }

    // 6. JWT 토큰 생성
    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);

    // 7. 마지막 로그인 시간 업데이트
    await query(
      'UPDATE users SET last_login_at = NOW() WHERE id = $1',
      [user.id]
    );

    // 8. 응답
    return Response(200, {
      user: {
        id: user.id,
        email: user.email,
        status: user.status,
        role: user.role
      },
      accessToken,
      refreshToken // 쿠키로 설정됨
    });

  } catch (error) {
    return Response(500, { error: '로그인 중 오류가 발생했습니다.' });
  }
}
```

### 6.3 보안 검증

```typescript
// 1. SQL Injection 방어
const user = await query(
  'SELECT ... WHERE email = $1',
  [email]  // ✓ 매개변수화된 쿼리
);

// 2. 비밀번호 비교
const isValid = await bcrypt.compare(password, user.password_hash);
// ✓ bcrypt가 timing attack 방어

// 3. 에러 메시지 균형
// ✓ "이메일 또는 비밀번호가 올바르지 않습니다."
// (이메일 존재 여부 공개 안 함 - 열거 공격 방어)

// 4. JWT 토큰 서명
const token = jwt.sign(
  { userId: user.id, role: user.role },
  JWT_SECRET,  // ✓ 환경변수에서 로드
  { expiresIn: '1h' }
);
```

---

## 7. JWT 토큰 설계

### 7.1 액세스 토큰 (Access Token)

#### 구조
```
Header:  { alg: "HS256", typ: "JWT" }
Payload: {
  userId: "uuid",
  role: "admin|user",
  iat: 1708330200,        // 발급 시간
  exp: 1708333800         // 만료 시간 (1시간 후)
}
Signature: HMACSHA256(Header + Payload + SECRET)
```

#### 특징
- **유효기간**: 1시간
- **저장소**: Zustand 메모리 (클라이언트)
- **사용처**: Authorization 헤더
- **만료 시**: 새로운 요청 불가 (401)

#### 포함 정보
```typescript
interface AccessTokenPayload {
  userId: string;     // 사용자 ID
  role: 'admin' | 'user';  // 사용자 역할
  iat: number;        // 발급 시간 (Unix timestamp)
  exp: number;        // 만료 시간 (Unix timestamp)
}
```

### 7.2 리프레시 토큰 (Refresh Token)

#### 구조
```
Header:  { alg: "HS256", typ: "JWT" }
Payload: {
  userId: "uuid",
  type: "refresh",
  iat: 1708330200,
  exp: 1709021400     // 만료 시간 (7일 후)
}
Signature: HMACSHA256(Header + Payload + SECRET)
```

#### 특징
- **유효기간**: 7일
- **저장소**: httpOnly 쿠키 (자동 포함)
- **사용처**: 새 accessToken 발급
- **만료 시**: 재로그인 필요

#### 포함 정보
```typescript
interface RefreshTokenPayload {
  userId: string;
  type: 'refresh';
  iat: number;
  exp: number;
}
```

### 7.3 토큰 갱신 흐름

```
클라이언트 요청
    ↓
Access Token 검증 (JWT 서명)
    ↓
┌─ 만료됨 (401) ──┐
│                 ↓
│         POST /api/auth/refresh
│                 ↓
│         쿠키의 refreshToken 확인
│                 ↓
│         새 accessToken 생성
│                 ↓
│         응답: 새 accessToken
│                 ↓
│         원래 요청 재시도
│
└─ 유효함 ────→ 요청 진행
```

---

## 8. 상태 기반 라우팅

### 8.1 로그인 후 라우팅

```typescript
// src/components/forms/LoginForm.tsx

async function onSubmit(values: LoginFormValues) {
  const response = await fetch('/api/auth/login', { ... });
  const result = await response.json();

  // Zustand에 저장
  setAuth(result.user, result.accessToken);

  // 상태에 따라 라우팅
  if (result.user.status === 'pending') {
    router.push('/pending');     // 승인 대기
  } else if (result.user.status === 'suspended') {
    setServerError('정지된 계정입니다.');
    logout();
  } else {
    router.push('/dashboard');   // 활성 사용자
  }
}
```

### 8.2 상태별 화면

| 상태 | 라우트 | 동작 |
|------|--------|------|
| pending | /pending | 30초마다 상태 폴링 |
| active | /dashboard | 대시보드 진입 |
| suspended | /login | 에러 메시지 표시 |

---

## 9. 보안 고려사항

### 9.1 암호화

```typescript
// 비밀번호 해싱
const hash = await bcrypt.hash(password, 10);
// 10: 솔트 라운드 (높을수록 느리지만 안전)

// 비밀번호 비교 (Timing Attack 방어)
const isValid = await bcrypt.compare(password, hash);
// ✓ 항상 같은 시간 소비
```

### 9.2 토큰 보안

```typescript
// JWT 검증
const payload = jwt.verify(token, JWT_SECRET);
// ✓ 서명 검증으로 위변조 방지
// ✓ 만료 시간 확인

// 리프레시 토큰 저장
document.cookie = `refreshToken=${token};
  HttpOnly=true;        // JavaScript 접근 불가
  Secure=${isProduction};  // HTTPS에서만 전송
  SameSite=Lax;         // CSRF 방어
  Max-Age=604800        // 7일`;
```

### 9.3 에러 처리

```typescript
// ❌ 나쁜 예
if (!user) {
  return { error: 'User not found' };  // 이메일 존재 여부 노출
}

// ✓ 좋은 예
if (!user || !passwordMatch) {
  return { error: '이메일 또는 비밀번호가 올바르지 않습니다.' };
  // 이메일 존재 여부 숨김 (Enumeration Attack 방어)
}
```

---

## 10. 구현 체크리스트

### 프론트엔드
- [x] LoginForm 컴포넌트
- [x] Zod 검증 스키마
- [x] 에러 메시지 표시
- [x] 로딩 상태 표시
- [x] Zustand 상태 관리
- [x] 라우팅 로직

### 백엔드
- [x] POST /api/auth/login 구현
- [x] 요청 검증
- [x] 사용자 조회 쿼리
- [x] bcrypt 비밀번호 검증
- [x] JWT 토큰 생성
- [x] 오류 처리

### 데이터베이스
- [x] users 테이블 설계
- [x] email 인덱스
- [x] status 필드
- [x] password_hash 필드
- [x] last_login_at 필드

### 보안
- [x] bcrypt 해싱 (10 라운드)
- [x] JWT 서명
- [x] httpOnly 쿠키
- [x] SQL 매개변수화
- [x] 균형잡힌 에러 메시지

---

## 11. 테스트 시나리오

### 11.1 성공 케이스
```
입력: email=user@example.com, password=Test1234
상태: pending → /pending 이동
      active → /dashboard 이동
```

### 11.2 실패 케이스
```
입력: email=wrong@example.com
결과: 401, "이메일 또는 비밀번호가 올바르지 않습니다."

입력: email=user@example.com, password=wrong
결과: 401, "이메일 또는 비밀번호가 올바르지 않습니다."

입력: email=suspended@example.com (정지된 계정)
결과: 403, "정지된 계정입니다."
```

### 11.3 토큰 갱신
```
1. 로그인 (accessToken 획득)
2. 1시간 대기
3. 다음 API 호출 (401)
4. POST /api/auth/refresh (refreshToken 사용)
5. 새 accessToken 획득
6. 원래 요청 자동 재시도
```

---

## 12. 성능 최적화

### 12.1 데이터베이스
- [x] email 인덱스 (이메일 검색 빠름)
- [x] 쿼리 최소화 (SELECT only required fields)
- [x] 연결 풀링 (pg.Pool)

### 12.2 클라이언트
- [x] Debounce (폼 입력)
- [x] 요청 취소 (중복 요청 방지)
- [x] 캐싱 (사용자 정보)

### 12.3 서버
- [x] JWT 검증 (매번)
- [x] 토큰 갱신 자동화
- [ ] Rate Limiting (향후)

---

## 13. 현재 구현 상태

### 완료된 기능 ✅
- 로그인 폼 UI
- 이메일 + 비밀번호 검증
- 백엔드 로그인 엔드포인트
- JWT 토큰 생성 및 검증
- 상태 기반 라우팅
- Zustand 상태 관리

### 향후 추가 기능 🔄
- [ ] 비밀번호 찾기 (이메일 기반)
- [ ] 계정 잠금 (실패 횟수)
- [ ] 2FA (이메일 OTP)
- [ ] OAuth (Google, GitHub)
- [ ] Remember Me (기억 유지)

---

## 14. 파일 구조

```
katc1/
├── src/
│   ├── app/
│   │   └── api/auth/
│   │       └── login/
│   │           └── route.ts          # 로그인 엔드포인트
│   ├── components/
│   │   └── forms/
│   │       └── LoginForm.tsx         # 로그인 폼
│   ├── lib/
│   │   ├── jwt.ts                    # JWT 생성/검증
│   │   ├── db.ts                     # PostgreSQL 연결
│   │   └── constants.ts              # 상수 (에러 메시지)
│   ├── store/
│   │   └── authStore.ts             # Zustand 상태
│   └── types/
│       └── user.ts                   # User 타입
├── docs/
│   └── 02-design/
│       ├── ARCHITECTURE_DESIGN.md    # 전체 아키텍처
│       └── LOGIN_SYSTEM_DESIGN.md    # 이 문서
└── .env.local                         # 환경 변수
```

---

## 15. 참고 문서

| 문서 | 내용 |
|------|------|
| ARCHITECTURE_DESIGN.md | 전체 시스템 아키텍처 |
| DEPLOYMENT_GUIDE.md | 배포 절차 |
| src/lib/jwt.ts | JWT 구현 코드 |
| src/app/api/auth/login/route.ts | 로그인 엔드포인트 코드 |

---

**설계 상태**: ✅ 완료
**구현 상태**: ✅ 완료
**테스트 상태**: ⏳ 진행 예정
**배포 상태**: ⏳ AWS 배포 예정
