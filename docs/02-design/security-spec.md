# KATC1 보안 아키텍처 사양서 (Security Specification)

> Security Architect Review | OWASP Top 10 Compliance Check
> 작성일: 2026-02-19

---

## 1. 보안 아키텍처 개요

### 1.1 시스템 보안 레이어

```
+---------------------------------------------------------------+
|                    Client (Browser)                            |
|  - React 자동 XSS 이스케이핑                                    |
|  - accessToken: Zustand 메모리 저장 (XSS로 탈취 불가)            |
|  - refreshToken: httpOnly 쿠키 (JavaScript 접근 불가)            |
+---------------------------------------------------------------+
                              |
                        HTTPS (TLS 1.2+)
                              |
+---------------------------------------------------------------+
|               Next.js Middleware (서버 사이드)                    |
|  - 쿠키 기반 인증 검증                                           |
|  - 라우트 보호 (role 기반 접근 제어)                               |
|  - 미인증 사용자 리다이렉트                                       |
+---------------------------------------------------------------+
                              |
+---------------------------------------------------------------+
|                  bkend.ai API Server                           |
|  - JWT 토큰 발급/검증                                            |
|  - bcrypt 비밀번호 해싱                                          |
|  - 입력 검증 및 SQL 인젝션 방어                                   |
+---------------------------------------------------------------+
```

### 1.2 인증 플로우

```
[회원가입]
  User -> POST /auth/signup -> status='pending' -> 관리자 승인 대기
  * 승인 전까지 /pending 페이지로 리다이렉트

[로그인]
  User -> POST /auth/login
    -> 200: { user, accessToken, refreshToken }
    -> accessToken -> Zustand 메모리 저장
    -> refreshToken -> httpOnly 쿠키 저장
    -> status 확인:
       - pending -> /pending 리다이렉트
       - active  -> /dashboard 리다이렉트
       - suspended -> 에러 메시지

[토큰 갱신]
  401 응답 수신
    -> refreshToken (쿠키에서 추출)
    -> POST /auth/refresh
    -> 새 accessToken + refreshToken 발급
    -> 원본 요청 재시도

[로그아웃]
  POST /auth/logout -> Zustand 초기화 + 쿠키 삭제
```

---

## 2. OWASP Top 10 (2021) 준수 분석

### A01: Broken Access Control - [MEDIUM RISK]

| 항목 | 현황 | 상태 |
|------|------|------|
| 라우트 보호 | middleware.ts 설계 명시 (미구현) | 구현 필요 |
| Role 기반 접근 제어 | admin/user 역할 구분 정의됨 | 구현 필요 |
| 관리자 API 보호 | /admin/* 엔드포인트 분리 | 서버측 검증 필요 |
| IDOR 방어 | userId 기반 API 호출 존재 | 서버측 소유권 검증 필요 |

**발견 사항:**
- `middleware.ts` 파일이 아직 생성되지 않았습니다. 라우트 보호가 클라이언트 측에만 의존할 경우 우회 가능합니다.
- `/admin/users/${userId}` 패턴에서 userId를 조작한 IDOR 공격 가능성이 있으며, 서버 측에서 요청자의 admin 역할을 반드시 검증해야 합니다.

**권장 조치 (High):**
1. `middleware.ts`를 생성하여 서버 사이드 라우트 보호 구현
2. 관리자 API에 서버측 role 검증 확인 (bkend.ai 설정)

---

### A02: Cryptographic Failures - [LOW RISK]

| 항목 | 현황 | 상태 |
|------|------|------|
| 비밀번호 해싱 | bcrypt (bkend.ai 내장) | 양호 |
| HTTPS 적용 | API_URL이 https:// 사용 | 양호 |
| 토큰 전송 보안 | Bearer 토큰 + httpOnly 쿠키 | 양호 |
| 쿠키 Secure 플래그 | production에서만 활성화 | 양호 |

**발견 사항:**
- `COOKIE_OPTIONS.SECURE`가 `process.env.NODE_ENV === 'production'`으로 설정되어 개발 환경에서는 Secure 플래그가 비활성화됩니다. 이는 개발 편의를 위한 적절한 설계입니다.
- JWT 토큰은 bkend.ai에서 관리하므로 서명 알고리즘 및 키 관리는 bkend.ai 보안 정책에 의존합니다.

**평가:** 현재 구현이 적절합니다.

---

### A03: Injection - [LOW RISK]

| 항목 | 현황 | 상태 |
|------|------|------|
| SQL 인젝션 | bkend.ai가 ORM/파라미터화 쿼리 처리 | 양호 |
| XSS | React 자동 이스케이핑, innerHTML 미사용 | 양호 |
| 코드 인젝션 | eval()/Function() 미사용 | 양호 |

**발견 사항:**
- `dangerouslySetInnerHTML`, `innerHTML`, `eval()` 사용이 없습니다.
- React의 자동 이스케이핑이 XSS를 효과적으로 방어합니다.
- 입력 검증에 `zod` 라이브러리가 dependencies에 포함되어 있어 스키마 기반 검증이 가능합니다.

**평가:** 현재 구현이 양호합니다.

---

### A04: Insecure Design - [MEDIUM RISK]

| 항목 | 현황 | 상태 |
|------|------|------|
| 관리자 승인 플로우 | pending -> active 워크플로우 설계됨 | 양호 |
| 비밀번호 정책 | 8자+대문자+숫자 (PASSWORD_REGEX) | 양호 |
| 열거 공격 방어 | 동일한 에러 메시지 사용 | 양호 |
| Rate Limiting | 미구현 | 구현 필요 |
| 계정 잠금 | 미구현 | 구현 권장 |

**발견 사항:**
- `AUTH_ERRORS`에서 `INVALID_CREDENTIALS`와 `USER_NOT_FOUND`가 동일한 메시지("이메일 또는 비밀번호가 올바르지 않습니다.")를 사용하여 열거 공격을 방어합니다. 이는 우수한 설계입니다.
- Rate Limiting이 미구현 상태이므로 브루트포스 공격에 취약할 수 있습니다.

**권장 조치 (High):**
1. 로그인 엔드포인트에 Rate Limiting 적용 (IP당 10회/분)
2. 연속 실패 시 계정 잠금 (5회 실패 -> 15분 잠금)

---

### A05: Security Misconfiguration - [HIGH RISK]

| 항목 | 현황 | 상태 |
|------|------|------|
| Security Headers | next.config.js에 미설정 | 구현 필요 |
| CORS 설정 | 미설정 | 확인 필요 |
| 에러 정보 노출 | ApiError 타입이 details 포함 | 확인 필요 |
| 환경 변수 관리 | NEXT_PUBLIC_* 구분 사용 | 양호 |

**발견 사항 (Critical):**
- `next.config.js`에 보안 헤더가 전혀 설정되지 않았습니다.
  - Strict-Transport-Security (HSTS) 미적용
  - X-Frame-Options 미적용
  - X-Content-Type-Options 미적용
  - Referrer-Policy 미적용
  - Content-Security-Policy (CSP) 미적용

**권장 조치 (Critical):**
다음 보안 헤더를 `next.config.js`에 추가:

```javascript
const securityHeaders = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  },
];
```

---

### A06: Vulnerable and Outdated Components - [MEDIUM RISK]

| 패키지 | 버전 | 상태 |
|--------|------|------|
| next | ^14.0.0 | 최신 확인 필요 (14.x -> 15.x 마이그레이션 고려) |
| react | ^18.2.0 | React 19 출시됨, 업데이트 고려 |
| axios | ^1.6.0 | 양호 |
| zustand | ^4.4.0 | zustand 5.x 출시됨, 고려 |
| zod | ^3.22.0 | 양호 |

**권장 조치 (Medium):**
1. `npm audit`을 실행하여 알려진 취약점 확인
2. 보안 패치가 포함된 마이너/패치 버전 업데이트 적용
3. dependabot 또는 renovate를 설정하여 자동 의존성 업데이트

---

### A07: Identification and Authentication Failures - [MEDIUM RISK]

| 항목 | 현황 | 상태 |
|------|------|------|
| 비밀번호 복잡성 | 8자+대문자+숫자 | 양호 |
| 토큰 저장 방식 | accessToken 메모리, refreshToken httpOnly 쿠키 | 양호 |
| 토큰 회전 | refresh 시 새 토큰 쌍 발급 | 양호 |
| 세션 타임아웃 | refreshToken 7일, accessToken 기간 미명시 | 확인 필요 |
| 다중 세션 관리 | 미구현 | 권장 |

**발견 사항:**
- refreshToken 만료 기간이 7일(604800초)로 설정되어 있습니다.
- accessToken의 만료 시간이 코드에 명시되지 않았으며, bkend.ai 서버 설정에 의존합니다.
- 토큰 갱신 시 새 refreshToken도 함께 발급되어 토큰 회전이 적용되었습니다.

**주의 사항:**
- `AuthState` 인터페이스에서 `user` 타입이 `any`로 선언되어 있어 타입 안전성이 떨어집니다. `User` 타입을 사용해야 합니다.
- `refreshToken`이 `AuthState`에 포함되어 있으나 실제로는 쿠키에 저장됩니다. 상태 관리와 저장 위치의 불일치가 있습니다.

**권장 조치 (Medium):**
1. `AuthState.user`를 `User | null` 타입으로 변경
2. `AuthState`에서 `refreshToken` 필드 제거 (쿠키에만 저장)
3. 비밀번호 변경 후 모든 세션 강제 만료 구현

---

### A08: Software and Data Integrity Failures - [LOW RISK]

| 항목 | 현황 | 상태 |
|------|------|------|
| 외부 CDN 리소스 | Pretendard 폰트 CDN 사용 | SRI 적용 권장 |
| 의존성 무결성 | package-lock.json 미확인 | 확인 필요 |

**발견 사항:**
- `globals.css`에서 `https://cdn.jsdelivr.net/npm/pretendard@3.3.3/dist/web/variable/pretendardvariable.css`를 외부 CDN에서 로드합니다. Subresource Integrity(SRI) 해시가 적용되지 않았습니다.

**권장 조치 (Low):**
1. 외부 CDN 리소스에 SRI 해시 적용 또는 자체 호스팅 전환
2. `package-lock.json`이 버전 관리에 포함되는지 확인

---

### A09: Security Logging and Monitoring Failures - [HIGH RISK]

| 항목 | 현황 | 상태 |
|------|------|------|
| 인증 이벤트 로깅 | 미구현 | 구현 필요 |
| 관리자 작업 감사 로그 | 미구현 | 구현 필요 |
| 에러 모니터링 | 미구현 | 구현 권장 |

**발견 사항:**
- 로그인 성공/실패, 회원가입, 비밀번호 변경 등의 보안 이벤트 로깅이 없습니다.
- 관리자의 사용자 승인/거부/정지 작업에 대한 감사 로그가 없습니다.

**권장 조치 (High):**
1. 인증 이벤트 로깅 (로그인 성공/실패, 로그아웃, 토큰 갱신)
2. 관리자 작업 감사 로그 (사용자 승인/거부/정지/활성화)
3. 에러 모니터링 도구 연동 (Sentry 등)

---

### A10: Server-Side Request Forgery (SSRF) - [LOW RISK]

| 항목 | 현황 | 상태 |
|------|------|------|
| 외부 URL 처리 | 사용자 입력 URL 없음 | 양호 |
| API 프록시 | 직접 API 호출 (SSRF 위험 낮음) | 양호 |

**평가:** 현재 SSRF 위험은 낮습니다.

---

## 3. 코드 레벨 보안 분석

### 3.1 토큰 갱신 인터셉터 (client.ts) - 경합 조건 처리

**파일:** `/Users/sein/Desktop/katc1/src/lib/api/client.ts`

현재 구현의 장점:
- `isRefreshing` 플래그와 `refreshSubscribers` 패턴으로 동시 401 응답 시 단일 토큰 갱신 보장
- 갱신 실패 시 `authStore.getState().logout()` 호출로 안전한 상태 초기화

발견된 문제:

```typescript
// 문제 1: setCookie에서 httpOnly 플래그 미적용
// client.ts Line 114
document.cookie = `${name}=${value};expires=...;path=...;samesite=...`;
// httpOnly 플래그가 빠져있음 -> JavaScript로 쿠키 접근 가능
```

**심각도: Critical**

`document.cookie`로 설정하는 쿠키는 본질적으로 httpOnly가 될 수 없습니다. httpOnly 쿠키는 서버(Set-Cookie 헤더)에서만 설정 가능합니다. 현재 설계 문서에서는 "refreshToken: httpOnly 쿠키 저장"이라고 명시하고 있으나, 실제 코드에서는 `document.cookie`를 사용하여 설정하고 있어 **httpOnly가 적용되지 않습니다**.

**권장 조치 (Critical):**
refreshToken을 서버 사이드에서 Set-Cookie 헤더로 설정하도록 변경해야 합니다.

```
// 서버 응답에서 Set-Cookie 헤더로 전달:
Set-Cookie: refreshToken=xxx; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800
```

클라이언트에서는 refreshToken을 직접 다루지 않고, `/auth/refresh` 요청 시 쿠키가 자동으로 포함되도록 해야 합니다.

```typescript
// 문제 2: refreshToken을 요청 본문에 포함
// client.ts Line 80
const response = await axios.post(`${API_URL}/auth/refresh`, {
  refreshToken,  // <- 본문에 포함하지 않고 쿠키로 자동 전송되어야 함
});
```

---

### 3.2 쿠키 설정 보안 (client.ts)

**파일:** `/Users/sein/Desktop/katc1/src/lib/api/client.ts`

```typescript
// constants.ts Line 34-41
export const COOKIE_OPTIONS = {
  REFRESH_TOKEN_NAME: 'refreshToken',
  REFRESH_TOKEN_MAX_AGE: 7 * 24 * 60 * 60, // 7일
  PATH: '/',
  HTTP_ONLY: true,        // <- 선언만 되어있고 실제 적용 불가
  SECURE: process.env.NODE_ENV === 'production',
  SAME_SITE: 'lax' as const,
};
```

`COOKIE_OPTIONS.HTTP_ONLY = true`로 선언되어 있지만, `setCookie()` 함수에서 `document.cookie`를 사용하므로 이 옵션은 실질적으로 적용되지 않습니다. 이는 설계 의도와 구현의 괴리입니다.

---

### 3.3 타입 안전성 문제 (auth.ts)

**파일:** `/Users/sein/Desktop/katc1/src/types/auth.ts`

```typescript
export interface AuthState {
  user: any | null;       // <- any 타입은 보안 검증 우회 가능성
  accessToken: string | null;
  refreshToken: string | null;  // <- 쿠키에 저장하므로 상태에 불필요
  // ...
}
```

`any` 타입은 타입 체커를 우회하여 잘못된 데이터가 인증 상태에 주입될 수 있습니다.

---

### 3.4 비밀번호 리셋 보안 (auth.ts API)

**파일:** `/Users/sein/Desktop/katc1/src/lib/api/auth.ts`

```typescript
export const resetPasswordAPI = async (token: string, newPassword: string) => {
  return apiClient.post('/auth/reset-password', {
    token,
    newPassword,
  });
};
```

비밀번호 리셋 토큰의 만료 시간, 일회성 사용, 최소 엔트로피 등은 bkend.ai 서버에서 처리해야 합니다. 확인이 필요합니다.

---

## 4. 보안 이슈 우선순위

### Critical (즉시 수정)

| # | 이슈 | 파일 | 설명 |
|---|------|------|------|
| C1 | httpOnly 쿠키 미적용 | `src/lib/api/client.ts` | document.cookie로 httpOnly 불가. 서버측 Set-Cookie로 변경 필요 |
| C2 | 보안 헤더 미설정 | `next.config.js` | HSTS, X-Frame-Options 등 미적용 |

### High (릴리스 전 수정)

| # | 이슈 | 파일 | 설명 |
|---|------|------|------|
| H1 | middleware.ts 미구현 | 프로젝트 루트 | 서버사이드 라우트 보호 없음 |
| H2 | Rate Limiting 미적용 | 미구현 | 브루트포스 공격 취약 |
| H3 | 보안 이벤트 로깅 없음 | 미구현 | 침입 탐지 불가 |

### Medium (다음 스프린트)

| # | 이슈 | 파일 | 설명 |
|---|------|------|------|
| M1 | AuthState 타입 안전성 | `src/types/auth.ts` | user: any -> User | null |
| M2 | AuthState refreshToken 필드 | `src/types/auth.ts` | 쿠키 전용이므로 상태에서 제거 |
| M3 | 의존성 업데이트 | `package.json` | npm audit 실행 및 패치 적용 |
| M4 | 계정 잠금 정책 | 미구현 | 연속 실패 시 잠금 |

### Low (백로그)

| # | 이슈 | 파일 | 설명 |
|---|------|------|------|
| L1 | 외부 CDN SRI | `src/app/globals.css` | Pretendard 폰트 CDN에 SRI 미적용 |
| L2 | CSP 헤더 | `next.config.js` | Content-Security-Policy 세부 설정 |

---

## 5. 보안 설계 점수

| 카테고리 | 점수 | 비고 |
|----------|------|------|
| 인증 설계 | 8/10 | JWT + httpOnly 쿠키(설계 의도) 우수, 구현 보완 필요 |
| 인가 설계 | 6/10 | role 구분은 있으나 middleware 미구현 |
| 토큰 관리 | 7/10 | 토큰 회전 적용, httpOnly 구현 수정 필요 |
| 입력 검증 | 7/10 | zod 도입, 비밀번호 정책 양호 |
| 에러 처리 | 8/10 | 열거 공격 방어 우수 |
| 보안 헤더 | 2/10 | 거의 미적용 |
| 모니터링 | 2/10 | 로깅/감사 미구현 |
| **종합** | **57/100** | **Medium Risk** - 보안 기반 설계는 양호하나 구현 보완 필요 |

---

## 6. 즉시 실행 계획

### Phase 1: Critical 수정 (1-2일)

1. **refreshToken httpOnly 쿠키 전환**
   - 로그인/갱신 API 응답에서 서버가 Set-Cookie 헤더로 refreshToken 설정
   - 클라이언트 setCookie/getCookie 함수에서 refreshToken 관련 코드 제거
   - API 요청 시 `withCredentials: true` 설정으로 쿠키 자동 포함

2. **보안 헤더 추가**
   - `next.config.js`에 보안 헤더 배열 추가

### Phase 2: High 수정 (3-5일)

3. **middleware.ts 구현**
   - 인증 상태 확인 (쿠키 기반)
   - 보호 라우트 정의 (/dashboard, /admin/*)
   - role 기반 접근 제어

4. **Rate Limiting 검토**
   - bkend.ai 서버측 Rate Limiting 설정 확인
   - 필요시 Next.js middleware에서 추가 제한

### Phase 3: Medium/Low 수정 (다음 스프린트)

5. 타입 안전성 개선
6. 보안 로깅 구현
7. 의존성 업데이트
8. CSP 헤더 세부 설정

---

## 7. 최종 승인

### 현재 보안 수준 평가

**등급: CONDITIONAL PASS (조건부 승인)**

현재 보안 설계의 기본 아키텍처는 건전합니다. JWT 토큰 분리 저장 전략, 열거 공격 방어, 비밀번호 정책 등 핵심 보안 설계가 올바르게 수립되어 있습니다. 그러나 다음 조건을 충족해야 최종 승인이 가능합니다:

**필수 충족 조건 (배포 전):**
- [ ] C1: refreshToken을 서버측 Set-Cookie(httpOnly)로 전환
- [ ] C2: next.config.js에 보안 헤더 추가
- [ ] H1: middleware.ts 서버사이드 라우트 보호 구현

**권장 충족 조건 (출시 전):**
- [ ] H2: Rate Limiting 적용 (서버 또는 미들웨어)
- [ ] H3: 보안 이벤트 로깅 최소 구현

### OWASP Top 10 준수 현황

| OWASP | 항목 | 준수 | 비고 |
|-------|------|------|------|
| A01 | Broken Access Control | Partial | middleware 구현 필요 |
| A02 | Cryptographic Failures | Pass | bcrypt + HTTPS |
| A03 | Injection | Pass | React 자동 이스케이핑 |
| A04 | Insecure Design | Partial | Rate Limiting 필요 |
| A05 | Security Misconfiguration | Fail | 보안 헤더 미설정 |
| A06 | Vulnerable Components | Partial | 감사 필요 |
| A07 | Auth Failures | Partial | httpOnly 구현 수정 필요 |
| A08 | Integrity Failures | Pass | 낮은 위험 |
| A09 | Logging Failures | Fail | 로깅 미구현 |
| A10 | SSRF | Pass | 해당 없음 |
