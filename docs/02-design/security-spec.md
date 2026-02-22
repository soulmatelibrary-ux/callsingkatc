# KATC1 보안 아키텍처 사양서 v2 (Security Specification)

> Security Architect Review | OWASP Top 10 Compliance Check
> 최초 작성일: 2026-02-19
> 갱신일: 2026-02-22 (Phase 7 - Full Codebase Review)

---

## 보안 점수 총괄

| 항목 | 점수 |
|------|------|
| **종합 보안 점수** | **68/100** |
| 이전 점수 (2026-02-19) | 57/100 |
| 변화 | +11점 (개선) |
| 등급 | **CONDITIONAL PASS (조건부 승인)** |

### 점수 변화 요인

**개선된 항목 (+):**
- [+8] 보안 헤더 완전 구현 (HSTS, CSP, X-Frame-Options, Permissions-Policy 등)
- [+5] middleware.ts 서버사이드 라우트 보호 구현
- [+5] refreshToken을 서버측 Set-Cookie(httpOnly)로 전환 완료
- [+3] authStore에서 refreshToken 필드 제거, user 타입 개선

**새로 발견된 취약점 (-):**
- [-3] `.env.development`에 실제 비밀번호/JWT_SECRET 하드코딩, `.gitignore` 미등록
- [-2] 디버그/테스트 API 엔드포인트가 인증 없이 노출
- [-1] `user` 쿠키가 httpOnly 아닌 상태로 역할 정보 노출
- [-2] Rate Limiting 여전히 미구현
- [-2] 보안 이벤트 로깅 여전히 미구현
- [-1] 서버 로그에 민감 정보 출력 (console.log)
- [-1] 임시 비밀번호 생성에 Math.random() 사용 (CSPRNG 아님)

---

## OWASP Top 10 (2021) 준수 현황

| OWASP | 항목 | 준수 | 점수 | 비고 |
|-------|------|------|------|------|
| A01 | Broken Access Control | Partial | 7/10 | middleware 구현됨, IDOR 부분 노출, 디버그 API 미보호 |
| A02 | Cryptographic Failures | Pass | 8/10 | bcrypt + JWT, Math.random() 이슈 |
| A03 | Injection | Pass | 9/10 | 파라미터화 쿼리 전면 적용, React 자동 이스케이핑 |
| A04 | Insecure Design | Partial | 6/10 | Rate Limiting/계정 잠금 미구현 |
| A05 | Security Misconfiguration | Pass | 8/10 | 보안 헤더 완비, CSP 적용, .env 관리 이슈 |
| A06 | Vulnerable Components | Partial | 6/10 | bcryptjs 3.x, SheetJS 0.18.5 점검 필요 |
| A07 | Auth Failures | Pass | 8/10 | httpOnly 쿠키 구현 완료, user 쿠키 이슈 |
| A08 | Integrity Failures | Pass | 7/10 | CDN 의존성 SRI 미적용 |
| A09 | Logging/Monitoring Failures | Fail | 3/10 | 감사 로그/보안 이벤트 로깅 미구현 |
| A10 | SSRF | Pass | 9/10 | 해당 없음 |

---

## 1. 취약점 상세 분석

### CRITICAL (즉시 조치 필요: 배포 차단)

---

#### C1: `.env.development` 파일에 실제 자격 증명 하드코딩 + Git 추적

**심각도:** CRITICAL
**OWASP:** A02 Cryptographic Failures
**파일:** `/Users/sein/Desktop/katc1/.env.development`

**현황:**
```
DB_PASSWORD=katc1_secure_password_2024
JWT_SECRET=dev_secret_key_12345678_change_in_production_2024
```

`.env.development` 파일에 DB 비밀번호와 JWT 비밀키가 평문으로 하드코딩되어 있습니다. 더 심각한 것은 `.gitignore`에 `.env.development`가 등록되지 않아 이 파일이 Git 저장소에 커밋될 수 있다는 점입니다.

`.gitignore`는 현재 `.env*.local` 패턴만 무시하고 있어 `.env.development`는 추적 대상입니다.

**위험:**
- 저장소 접근 권한이 있는 누구나 DB 비밀번호와 JWT 서명 키를 획득 가능
- JWT_SECRET을 알면 임의의 관리자 토큰 생성 가능 (전체 시스템 탈취)

**조치:**
1. `.gitignore`에 `.env.development` 추가
2. Git 히스토리에서 해당 파일 제거 (`git filter-branch` 또는 BFG)
3. 모든 자격 증명 즉시 교체 (DB 비밀번호, JWT_SECRET)

---

#### C2: 디버그/테스트 API 엔드포인트 인증 없이 노출

**심각도:** CRITICAL
**OWASP:** A01 Broken Access Control
**파일:**
- `/Users/sein/Desktop/katc1/src/app/api/debug/callsigns/route.ts`
- `/Users/sein/Desktop/katc1/src/app/api/airlines/test-callsigns/route.ts`

**현황:**
```typescript
// /api/debug/callsigns - 인증 없이 DB 직접 조회
export async function GET(request: NextRequest) {
  const airlines = await query('SELECT COUNT(*) as total FROM airlines');
  const callsigns = await query('SELECT COUNT(*) as total FROM callsigns');
  // ...
}
```

두 개의 디버그/테스트 엔드포인트가 인증 없이 DB 데이터를 노출합니다.

**추가 위험 - 에러 시 스택 트레이스 노출:**
```typescript
// /api/debug/callsigns/route.ts Line 34-38
} catch (error: any) {
  return NextResponse.json({
    error: error.message,
    stack: error.stack  // <-- 전체 스택 트레이스 노출!
  }, { status: 500 });
}
```

**위험:**
- 데이터베이스 구조 및 데이터량 노출
- 에러 시 코드 경로, 파일명, 라인 번호 등 내부 정보 노출
- 공격자가 시스템 정보를 수집하는 정찰(reconnaissance) 벡터

**조치:**
1. 프로덕션 빌드에서 `/api/debug/*` 및 `/api/airlines/test-callsigns` 경로 완전 제거
2. 또는 최소한 관리자 인증 검증 추가

---

### HIGH (릴리스 전 수정 필요)

---

#### H1: `user` 쿠키가 httpOnly 없이 역할 정보 노출

**심각도:** HIGH
**OWASP:** A07 Authentication Failures
**파일:** `/Users/sein/Desktop/katc1/src/app/api/auth/login/route.ts` (Line 127-140)

**현황:**
```typescript
response.cookies.set('user', JSON.stringify({
  id: sanitizedUser.id,
  email: sanitizedUser.email,
  role: sanitizedUser.role,        // <-- 역할 정보 노출
  status: sanitizedUser.status,
  airline_id: sanitizedUser.airline_id,
  airline: sanitizedUser.airline,
}), {
  httpOnly: false,  // <-- 클라이언트 JavaScript에서 접근 가능
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60,
  path: '/',
});
```

`user` 쿠키가 `httpOnly: false`로 설정되어 XSS 공격 시 사용자 정보(ID, 이메일, 역할, 항공사 정보)가 탈취될 수 있습니다.

**추가 문제 - middleware에서 이 쿠키를 신뢰:**
```typescript
// middleware.ts Line 38-44
if (userCookie) {
  try {
    const parsed = JSON.parse(decodeURIComponent(userCookie));
    userRole = parsed?.role || null;  // <-- 클라이언트가 조작 가능한 값 사용
  } catch (error) { ... }
}
```

middleware가 `user` 쿠키의 `role` 값을 기반으로 리다이렉트를 결정하는데, 이 쿠키는 클라이언트에서 조작 가능합니다. 공격자가 `user` 쿠키의 `role`을 `admin`으로 변경하면 관리자 리다이렉트를 받을 수 있습니다.

**위험:**
- XSS 시 사용자 개인정보 탈취
- 쿠키 조작으로 middleware 역할 검증 우회 (리다이렉트 수준에 한정, API 접근은 JWT로 보호)

**조치:**
1. 역할 기반 리다이렉트를 위해서는 refreshToken에서 JWT를 디코딩하여 역할 확인 (서버사이드)
2. `user` 쿠키의 민감 정보(email, airline 상세) 제거, 최소한의 정보만 유지
3. 또는 `user` 쿠키를 제거하고 `/api/auth/me` 엔드포인트만 사용

---

#### H2: Rate Limiting 미구현

**심각도:** HIGH
**OWASP:** A04 Insecure Design

**현황:**
모든 API 엔드포인트에 Rate Limiting이 적용되지 않았습니다. 특히 다음 엔드포인트가 위험합니다:
- `POST /api/auth/login` - 브루트포스 공격
- `POST /api/auth/forgot-password` - 임시 비밀번호 대량 발급
- `POST /api/auth/signup` - 대량 계정 생성

**위험:**
- 브루트포스 비밀번호 공격
- 서비스 거부(DoS) 공격
- 임시 비밀번호 폭격(이메일 스팸)

**조치:**
- IP 기반 Rate Limiting (로그인: 10회/분, 비밀번호 찾기: 3회/시간)
- Upstash Ratelimit 또는 middleware 기반 구현

---

#### H3: 보안 이벤트 로깅 미구현

**심각도:** HIGH
**OWASP:** A09 Logging/Monitoring Failures

**현황:**
인증 이벤트(로그인 성공/실패, 비밀번호 변경, 관리자 작업 등)에 대한 구조화된 보안 로깅이 없습니다. 현재 `console.error`만 사용되며, 이는 프로덕션에서 충분하지 않습니다.

**위험:**
- 침입 시도 탐지 불가
- 사고 후 포렌식 분석 불가
- 관리자 오용/남용 추적 불가

**조치:**
1. 보안 이벤트 테이블 (security_events) 생성
2. 로그인 성공/실패, 비밀번호 변경, 관리자 작업 기록
3. 프로덕션 로그 수집 도구 연동 (Sentry, Datadog 등)

---

#### H4: 회원가입 API가 테스트용으로 열려있음

**심각도:** HIGH
**OWASP:** A01 Broken Access Control
**파일:** `/Users/sein/Desktop/katc1/src/app/api/auth/signup/route.ts`

**현황:**
주석에 "테스트/개발용"이라 명시되어 있지만, 인증 없이 누구나 `active` 상태의 계정을 생성할 수 있습니다. 프로덕션 환경에서 이 엔드포인트가 활성화되면 임의의 계정 생성이 가능합니다.

```typescript
// Line 73 - 'active' 상태로 바로 생성됨
[email, passwordHash, resolvedAirlineId, 'active', 'user', false, false]
```

또한 응답 본문에 `refreshToken`이 직접 포함됩니다 (Line 119):
```typescript
const response = NextResponse.json({
  user: { ... },
  accessToken,
  refreshToken,  // <-- 응답 본문에 refreshToken 노출
}, { status: 201 });
```

**위험:**
- 승인 없이 무제한 계정 생성
- 데이터 오염 및 남용

**조치:**
1. 프로덕션에서 이 엔드포인트 비활성화 또는 제거
2. 또는 관리자 인증 필수로 변경
3. 응답 본문에서 refreshToken 제거 (쿠키로만 전달)

---

#### H5: 로그아웃이 GET 메서드도 지원

**심각도:** HIGH
**OWASP:** A01 Broken Access Control
**파일:** `/Users/sein/Desktop/katc1/src/app/api/auth/logout/route.ts`

**현황:**
```typescript
export async function GET(request: NextRequest) {
  return handleLogout(request);
}
```

로그아웃을 GET으로 처리하면 CSRF 공격으로 사용자를 강제 로그아웃시킬 수 있습니다. 이미지 태그 또는 외부 링크를 통해 `<img src="/api/auth/logout">` 형태로 트리거 가능합니다.

**조치:**
- GET 핸들러 제거, POST만 허용

---

#### H6: PATCH /api/actions/[id] - 권한 검증 부족

**심각도:** HIGH
**OWASP:** A01 Broken Access Control
**파일:** `/Users/sein/Desktop/katc1/src/app/api/actions/[id]/route.ts` (Line 111-136)

**현황:**
```typescript
const payload = verifyToken(token);
if (!payload) {
  return NextResponse.json({ error: '...' }, { status: 401 });
}
// 역할 검증 없이 바로 조치 수정 가능
```

`PATCH /api/actions/[id]`에서 토큰 유효성만 확인하고 관리자 역할 검증이 없습니다. 일반 사용자가 모든 조치를 수정/삭제(in_progress 상태 변경 시)할 수 있습니다. 대조적으로 `DELETE` 핸들러와 `GET /api/actions` 목록 조회는 `payload.role !== 'admin'` 검증을 수행합니다.

**위험:**
- 일반 사용자가 조치 상태를 임의로 변경 가능
- 조치 데이터 삭제 가능 (in_progress 변경 시 action row 삭제됨)

**조치:**
- PATCH 핸들러에 `payload.role !== 'admin'` 검증 추가

---

### MEDIUM (다음 스프린트 수정)

---

#### M1: 임시 비밀번호 생성에 Math.random() 사용

**심각도:** MEDIUM
**OWASP:** A02 Cryptographic Failures
**파일:**
- `/Users/sein/Desktop/katc1/src/app/api/auth/forgot-password/route.ts` (Line 31-53)
- `/Users/sein/Desktop/katc1/src/app/api/admin/users/[id]/password-reset/route.ts` (Line 26-52)

**현황:**
```typescript
const getRandom = (chars: string) =>
  chars[Math.floor(Math.random() * chars.length)];
// ...
return required.sort(() => Math.random() - 0.5).join('');
```

`Math.random()`은 암호학적으로 안전하지 않은 의사 난수 생성기(PRNG)입니다. 임시 비밀번호 생성에 사용하면 예측 가능한 값이 생성될 수 있습니다.

**조치:**
- `crypto.randomBytes()` 또는 `crypto.getRandomValues()` 사용

---

#### M2: 서버 로그에 민감한 정보 출력

**심각도:** MEDIUM
**OWASP:** A09 Logging/Monitoring Failures
**파일:** 다수 API 라우트

**현황:**
```typescript
// /api/auth/login/route.ts Line 44-49
console.log('[LOGIN] 조회된 사용자:', {
  id: user.id,
  email: user.email,  // <-- PII 로그 출력
  role: user.role,
  status: user.status,
});

// /api/auth/refresh/route.ts Line 26-29
console.log('[REFRESH] 토큰 검증 결과:', {
  userId: payload?.userId,
  refreshTokenExists: !!refreshToken,
});

// /src/lib/db.ts Line 30
console.log('쿼리 실행:', { text, duration, rows: result.rowCount });
// ^-- 전체 SQL 쿼리 텍스트 출력 (테이블 구조 노출)

// middleware.ts Line 17
console.log('[Middleware] pathname:', pathname);
```

프로덕션에서 이러한 로그는 개인식별정보(PII), SQL 쿼리 구조, 토큰 존재 여부 등을 노출합니다.

**조치:**
1. 프로덕션용 로깅 레벨 관리 도입
2. PII(이메일 등)는 마스킹하여 로그 출력
3. SQL 쿼리 텍스트 로그 제거 또는 디버그 레벨 한정

---

#### M3: CreateUserModal에 기본 비밀번호 하드코딩

**심각도:** MEDIUM
**OWASP:** A07 Authentication Failures
**파일:** `/Users/sein/Desktop/katc1/src/components/admin/CreateUserModal.tsx` (Line 21)

**현황:**
```typescript
const DEFAULT_PASSWORD = 'TempPass123!';
```

클라이언트 사이드 코드에 기본 비밀번호가 하드코딩되어 있습니다. 이 값은 브라우저 DevTools에서 확인 가능하며, 공격자가 새로 생성된 사용자의 초기 비밀번호를 예측할 수 있습니다.

**조치:**
- 서버 사이드에서 임시 비밀번호 생성 후 관리자에게 표시하는 방식으로 변경

---

#### M4: 에러 응답에서 내부 정보 노출

**심각도:** MEDIUM
**OWASP:** A05 Security Misconfiguration
**파일:**
- `/Users/sein/Desktop/katc1/src/app/api/airlines/[airlineId]/actions/route.ts` (Line 394-398)
- `/Users/sein/Desktop/katc1/src/app/api/airlines/test-callsigns/route.ts` (Line 15)

**현황:**
```typescript
// actions/route.ts Line 394-398
const errorMessage = error instanceof Error ? error.message : String(error);
return NextResponse.json(
  { error: `조치 생성 중 오류가 발생했습니다: ${errorMessage}` },
  //                                          ^-- 내부 에러 메시지 노출
  { status: 500 }
);

// test-callsigns/route.ts Line 15
return NextResponse.json({ error: error.message }, { status: 500 });
```

에러 메시지에 내부 구현 세부사항(SQL 오류 메시지, 파일 경로 등)이 포함될 수 있습니다.

**조치:**
- 500 에러 응답에서 `error.message`를 직접 노출하지 않고, 일반적인 메시지만 반환
- 상세 에러는 서버 로그에만 기록

---

#### M5: CSRF 방어 미적용

**심각도:** MEDIUM
**OWASP:** A01 Broken Access Control

**현황:**
상태 변경 API(POST, PATCH, DELETE)에 CSRF 토큰 검증이 없습니다. `SameSite: lax` 쿠키 설정이 부분적 CSRF 방어를 제공하지만, 완전하지는 않습니다.

**참고:** SameSite=lax는 Top-level navigation POST (폼 제출)에서는 쿠키를 포함하므로, CSRF 폼 공격이 가능할 수 있습니다. 다만 API가 JSON Content-Type을 사용하고 있어 실제 위험은 제한적입니다.

**조치:**
- 상태 변경 API에 CSRF 토큰 또는 Origin/Referer 헤더 검증 추가

---

#### M6: bcryptjs 3.x 보안 감사 필요

**심각도:** MEDIUM
**OWASP:** A06 Vulnerable Components
**파일:** `/Users/sein/Desktop/katc1/package.json`

**현황:**
`bcryptjs: ^3.0.3` - bcryptjs 3.x는 비교적 최근 메이저 버전이며, 알려진 취약점을 확인해야 합니다. 또한 `xlsx: ^0.18.5`(SheetJS)는 과거 취약점 이력이 있는 라이브러리입니다.

**조치:**
1. `npm audit` 실행
2. SheetJS 최신 버전 확인 및 업데이트

---

### LOW (백로그)

---

#### L1: 외부 CDN 리소스에 SRI(Subresource Integrity) 미적용

**심각도:** LOW
**OWASP:** A08 Software/Data Integrity Failures

CSP 헤더에서 `cdn.jsdelivr.net`을 허용하고 있으나, 로드되는 리소스에 SRI 해시가 적용되지 않았습니다. CDN이 침해될 경우 악성 코드가 주입될 수 있습니다.

---

#### L2: CSP 헤더에 `unsafe-inline` 및 `unsafe-eval` 허용

**심각도:** LOW
**OWASP:** A05 Security Misconfiguration
**파일:** `/Users/sein/Desktop/katc1/next.config.js` (Line 37)

**현황:**
```
script-src 'self' 'unsafe-inline' 'unsafe-eval' cdn.jsdelivr.net;
style-src 'self' 'unsafe-inline' cdn.jsdelivr.net;
```

`unsafe-inline`과 `unsafe-eval`은 CSP의 XSS 방어 효과를 크게 약화시킵니다. Next.js 14에서는 인라인 스크립트/스타일이 필요하여 완전 제거가 어렵지만, nonce 기반 CSP로 전환하면 더 강력한 방어가 가능합니다.

**조치:**
- Next.js 14의 nonce 기반 CSP 지원 검토
- 최소한 `unsafe-eval` 제거 시도

---

#### L3: 다중 세션 관리 미구현

**심각도:** LOW
**OWASP:** A07 Authentication Failures

사용자가 여러 디바이스에서 동시 로그인해도 제어할 방법이 없습니다. 비밀번호 변경 시 기존 모든 세션을 무효화하는 메커니즘이 없습니다.

---

#### L4: 회원가입 응답에 refreshToken 평문 포함

**심각도:** LOW
**OWASP:** A02 Cryptographic Failures
**파일:** `/Users/sein/Desktop/katc1/src/app/api/auth/signup/route.ts` (Line 119)

회원가입 API 응답 본문에 `refreshToken`이 직접 포함됩니다. refreshToken은 Set-Cookie 헤더로만 전달해야 합니다. (로그인 API는 이미 올바르게 구현되어 있으나, 회원가입은 미처 수정되지 않음)

---

## 2. 이전 점검 대비 개선 현황

### 해결 완료 (2026-02-19 -> 2026-02-22)

| # | 이전 이슈 | 현황 |
|---|-----------|------|
| C1 (이전) | httpOnly 쿠키 미적용 | RESOLVED - 서버측 Set-Cookie 적용 완료 (`login/route.ts` Line 118-124) |
| C2 (이전) | 보안 헤더 미설정 | RESOLVED - HSTS, CSP, X-Frame-Options, Permissions-Policy 등 7개 헤더 적용 |
| H1 (이전) | middleware.ts 미구현 | RESOLVED - 서버사이드 라우트 보호 구현, JWT 형태 검증 포함 |
| M1 (이전) | AuthState user: any | RESOLVED - User 타입 적용 (`authStore.ts`) |
| M2 (이전) | AuthState refreshToken 필드 | RESOLVED - 제거됨 (쿠키 전용) |

### 미해결 (지속되는 이슈)

| # | 이전 이슈 | 현황 |
|---|-----------|------|
| H2 (이전) | Rate Limiting 미적용 | OPEN - 여전히 미구현 |
| H3 (이전) | 보안 이벤트 로깅 없음 | OPEN - 여전히 미구현 |
| M3 (이전) | 의존성 업데이트 | OPEN - npm audit 미실행 |
| L1 (이전) | 외부 CDN SRI | OPEN |

---

## 3. 보안 아키텍처 분석

### 3.1 인증 플로우 (현재 구현)

```
[로그인]
  POST /api/auth/login
    -> bcrypt.compare() 비밀번호 검증
    -> generateAccessToken() -> 응답 본문
    -> generateRefreshToken() -> httpOnly 쿠키 (Set-Cookie)
    -> user 쿠키 (non-httpOnly) -> 라우팅 용도

[토큰 갱신]
  POST /api/auth/refresh
    -> refreshToken 쿠키에서 추출
    -> verifyRefreshToken() JWT 검증
    -> DB에서 최신 사용자 정보 조회
    -> 새 accessToken + refreshToken 발급 (토큰 회전)

[미들웨어 보호]
  서버사이드 middleware.ts
    -> refreshToken 쿠키 존재 확인
    -> JWT 형태 검증 (3-part dot format)
    -> 보호 라우트 접근 제어
    -> user 쿠키 기반 역할별 리다이렉트
```

### 3.2 양호한 보안 패턴

1. **SQL 인젝션 방어:** 모든 DB 쿼리가 파라미터화 ($1, $2...) 적용. 동적 쿼리에서도 `params.push()` + `$N` 패턴 일관 사용.

2. **XSS 방어:** `dangerouslySetInnerHTML`, `innerHTML`, `eval()` 사용 없음. React의 자동 이스케이핑 의존.

3. **열거 공격 방어:** 로그인 실패 시 이메일/비밀번호 구분 없이 동일 에러 메시지. 비밀번호 찾기도 이메일 존재 여부 무관하게 동일 응답.

4. **비밀번호 정책:** `PASSWORD_REGEX`로 8자+대문자+소문자+숫자+특수문자 강제.

5. **토큰 관리:**
   - accessToken: Zustand 메모리 전용 (localStorage/sessionStorage 미사용)
   - refreshToken: httpOnly + Secure + SameSite=lax 쿠키
   - 토큰 회전: refresh 시 양쪽 토큰 모두 새로 발급

6. **동시 갱신 방지:** `client.ts`에서 `refreshingPromise` 싱글턴 패턴으로 다중 401 시 단일 refresh 보장.

7. **관리자 API 보호:** 모든 `/api/admin/*` 엔드포인트에 `payload.role !== 'admin'` 검증 적용.

8. **트랜잭션 처리:** 비밀번호 변경, 조치 생성 등 다단계 작업에 DB 트랜잭션 적용.

9. **입력 검증:** 상태 값 화이트리스트 (`['active', 'suspended'].includes(status)`), 역할 화이트리스트, 날짜 형식 검증.

10. **환경 변수 분리:** `NEXT_PUBLIC_*` 접두사 규칙 준수. 서버 전용 변수 (DB_*, JWT_SECRET, SMTP_*) 미노출.

---

## 4. 카테고리별 세부 분석

### 4.1 A01: Broken Access Control

**점수: 7/10**

**양호:**
- 모든 admin API에 `payload.role !== 'admin'` 검증
- middleware.ts로 서버사이드 라우트 보호
- 관리자 삭제 시 자기 자신 삭제 방지
- 비밀번호 초기화 시 자기 자신 불가

**문제:**
- `PATCH /api/actions/[id]`에 역할 검증 누락 (H6)
- 디버그/테스트 엔드포인트 미보호 (C2)
- GET 로그아웃 허용 (H5)
- 회원가입 API 무인증 허용 (H4)
- `GET /api/actions/[id]`에서 항공사별 데이터 격리 없음 (인증된 사용자가 타 항공사 조치 열람 가능)

### 4.2 A02: Cryptographic Failures

**점수: 8/10**

**양호:**
- bcrypt(salt 10)로 비밀번호 해싱
- JWT 서명 검증
- HTTPS 강제 (HSTS 헤더)
- 개발/프로덕션 환경 구분 (Secure 플래그)

**문제:**
- `.env.development`에 JWT_SECRET 평문 (C1)
- Math.random() 사용 (M1)
- JWT_SECRET 최소 길이/복잡성 검증 없음

### 4.3 A03: Injection

**점수: 9/10**

**양호:**
- 전체 코드베이스에서 파라미터화 쿼리 일관 적용
- 동적 WHERE 절에서도 `$N` 플레이스홀더 사용
- ILIKE 검색에서도 파라미터 바인딩
- React 자동 이스케이핑
- `eval()`, `innerHTML` 미사용

**Minor:**
- zod 스키마 검증이 dependencies에 있으나 API 라우트에서는 수동 검증 위주

### 4.4 A05: Security Misconfiguration

**점수: 8/10**

**양호 (이전 대비 대폭 개선):**
- HSTS: `max-age=31536000; includeSubDomains`
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- Content-Security-Policy: 설정됨
- Permissions-Policy: camera=(), microphone=(), geolocation=()

**문제:**
- CSP에 `unsafe-inline`, `unsafe-eval` 허용 (L2)
- `.env.development` 관리 이슈 (C1)

### 4.5 A09: Logging/Monitoring Failures

**점수: 3/10**

**현황:**
- `console.error`만 사용, 구조화된 로깅 없음
- 보안 이벤트(로그인 실패, 비밀번호 변경, 관리자 작업) 추적 불가
- 감사 로그 테이블(action_history)이 스키마에 존재하지만 활용도 미확인
- 에러 모니터링 도구 미연동

---

## 5. 즉시 실행 계획

### Phase 1: Critical (즉시, 1일)

1. **`.gitignore` 수정:** `.env.development`, `.env.aws.example`, `.env.government.example` 추가
2. **자격 증명 교체:** DB_PASSWORD, JWT_SECRET 즉시 변경
3. **디버그 API 제거/보호:** `/api/debug/*`, `/api/airlines/test-callsigns` 제거 또는 인증 추가

### Phase 2: High (릴리스 전, 2-3일)

4. **PATCH /api/actions/[id] 역할 검증 추가**
5. **GET 로그아웃 제거**
6. **user 쿠키 최소화** 또는 **JWT 디코딩 기반 역할 확인**으로 전환
7. **Rate Limiting 구현** (로그인, 비밀번호 찾기)
8. **회원가입 API 보호** (프로덕션 비활성화 또는 인증 필수)

### Phase 3: Medium (다음 스프린트, 1주)

9. **Math.random() -> crypto.randomBytes()** 전환
10. **서버 로그 정리** (PII 마스킹, SQL 쿼리 로그 제거)
11. **기본 보안 이벤트 로깅 구현**
12. **CreateUserModal 기본 비밀번호 하드코딩 제거**
13. **에러 응답에서 내부 정보 제거**

### Phase 4: Low (백로그)

14. CSP nonce 기반 전환
15. CDN SRI 적용
16. 다중 세션 관리
17. npm audit 자동화

---

## 6. 파일별 취약점 인덱스

| 파일 | 취약점 | 심각도 |
|------|--------|--------|
| `.env.development` | 자격 증명 하드코딩 + Git 추적 | CRITICAL |
| `src/app/api/debug/callsigns/route.ts` | 인증 없이 DB 노출 + 스택 트레이스 | CRITICAL |
| `src/app/api/airlines/test-callsigns/route.ts` | 인증 없이 DB 노출 | CRITICAL |
| `src/app/api/auth/login/route.ts` | user 쿠키 httpOnly 없음 | HIGH |
| `src/app/api/auth/logout/route.ts` | GET 로그아웃 허용 | HIGH |
| `src/app/api/auth/signup/route.ts` | 무인증 계정 생성, 응답에 refreshToken | HIGH |
| `src/app/api/actions/[id]/route.ts` | PATCH 역할 검증 누락 | HIGH |
| `src/middleware.ts` | user 쿠키 신뢰 (조작 가능) | HIGH |
| `src/app/api/auth/forgot-password/route.ts` | Math.random() 사용 | MEDIUM |
| `src/app/api/admin/users/[id]/password-reset/route.ts` | Math.random() 사용 | MEDIUM |
| `src/components/admin/CreateUserModal.tsx` | 기본 비밀번호 하드코딩 | MEDIUM |
| `src/lib/db.ts` | SQL 쿼리 텍스트 로그 출력 | MEDIUM |
| `src/app/api/airlines/[airlineId]/actions/route.ts` | 에러에 내부 정보 포함 | MEDIUM |
| `next.config.js` | CSP unsafe-inline/unsafe-eval | LOW |

---

## 7. 최종 승인

### 현재 보안 수준 평가

**등급: CONDITIONAL PASS (조건부 승인) - 68/100**

이전 점검(57/100) 대비 상당한 개선이 이루어졌습니다. 특히 httpOnly 쿠키 전환, 보안 헤더 구현, middleware 라우트 보호는 핵심 보안 기반을 올바르게 구축했습니다. SQL 인젝션 방어, XSS 방어, 토큰 관리 패턴은 우수합니다.

**배포 전 필수 조건:**
- [ ] C1: `.env.development`를 `.gitignore`에 추가하고 자격 증명 교체
- [ ] C2: 디버그/테스트 API 제거 또는 인증 추가
- [ ] H4: 회원가입 API 보호
- [ ] H5: GET 로그아웃 제거
- [ ] H6: PATCH /api/actions/[id] 역할 검증 추가

**출시 전 권장 조건:**
- [ ] H1: user 쿠키 보안 개선
- [ ] H2: Rate Limiting 구현
- [ ] H3: 보안 이벤트 로깅 구현

### 카테고리별 점수

| 카테고리 | 점수 | 이전 | 변화 |
|----------|------|------|------|
| 인증 설계 | 8/10 | 8/10 | - |
| 인가 설계 | 7/10 | 6/10 | +1 |
| 토큰 관리 | 9/10 | 7/10 | +2 |
| SQL 인젝션 방어 | 9/10 | - | NEW |
| XSS 방어 | 9/10 | - | NEW |
| 입력 검증 | 7/10 | 7/10 | - |
| 에러 처리 | 7/10 | 8/10 | -1 |
| 보안 헤더 | 8/10 | 2/10 | +6 |
| 비밀 관리 | 4/10 | - | NEW |
| 모니터링 | 3/10 | 2/10 | +1 |
