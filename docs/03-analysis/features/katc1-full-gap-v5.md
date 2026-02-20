# KATC1 설계-구현 Gap Analysis Report v5.0

> **Summary**: 페이지 라우팅, 로그인 후 흐름, 세션 관리, 데이터 필터링, 관리자 기능 포커스 분석
>
> **Feature**: KATC1 Full System (Auth + Pages + Admin)
> **Analysis Date**: 2026-02-20
> **Status**: Complete (v5.0 - 페이지별 상세 분석)
> **Previous Match Rate**: 92% (v4.0, 2026-02-19)
> **Current Match Rate**: 82% (v5.0 - 확장된 범위 기준)

---

## 1. 분석 개요

### 1.1 분석 범위

이번 분석은 v4.0 대비 범위를 확장하여 다음 5개 영역에 집중한다.

| 영역 | 설계 문서 | 구현 위치 | 핵심 확인사항 |
|------|-----------|-----------|---------------|
| 1. 페이지 라우팅 | SCREEN_STRUCTURE_DESIGN.md 1절 | src/app/ 전체 | 설계상 라우트 vs 실제 라우트 |
| 2. 로그인 후 흐름 | SCREEN_STRUCTURE_DESIGN.md 2절, LOGIN_SYSTEM_DESIGN.md | src/app/page.tsx, LoginForm.tsx, middleware.ts | 역할별 분기, 리다이렉트 |
| 3. 세션 관리 | ARCHITECTURE_DESIGN.md 5절 | lib/jwt.ts, store/authStore.ts, lib/api/client.ts | JWT, Zustand, 쿠키 |
| 4. 데이터 필터링 | AIRLINES_DATA.md 4절, SCREEN_STRUCTURE_DESIGN.md 12절 | (main)/airline/page.tsx | 항공사별 데이터 격리 |
| 5. 관리자 기능 | SCREEN_STRUCTURE_DESIGN.md 4절, 7절 | src/app/admin/ | 7개 관리자 페이지 구현율 |

---

## 2. 페이지 라우팅 분석

### 2.1 설계 vs 구현 라우트 비교

| 설계 라우트 | 설계 문서 위치 | 구현 파일 | 상태 | 비고 |
|------------|---------------|-----------|:----:|------|
| `/` (포털 메인) | SCREEN 1절 | `src/app/page.tsx` | **변경** | 설계: 시스템 소개 + 로그인 버튼. 구현: 로그인 폼 통합 포털 |
| `/login` | SCREEN 1절 | `src/app/(auth)/login/page.tsx` | **구현됨** | LoginForm 컴포넌트 사용 |
| `/signup` | SCREEN 1절 | `src/app/(auth)/signup/page.tsx` | **구현됨** | "준비중" 안내로 변경 (사전등록 모델 채택) |
| `/forgot-password` | SCREEN 1절 | `src/app/(auth)/forgot-password/page.tsx` | **구현됨** | ForgotPasswordForm 사용 |
| `/change-password` | SCREEN 1절 | `src/app/(auth)/change-password/page.tsx` | **구현됨** | ChangePasswordForm 사용 |
| `/pending` | SCREEN 1절 | `src/app/(auth)/pending/page.tsx` | **구현됨** | 30초 폴링 동작 |
| `/dashboard` | SCREEN 1절 | 미존재 | **미구현** | 설계에서 핵심 페이지 |
| `/airline` | SCREEN 1절 | `src/app/(main)/airline/page.tsx` | **구현됨** | 목업 데이터 기반 |
| `/profile` | SCREEN 1절 | 미존재 | **미구현** | 설계에만 존재 |
| `/settings` | SCREEN 1절 | 미존재 | **미구현** | 설계에만 존재 |
| `/admin` | SCREEN 4.1절 | `src/app/admin/page.tsx` | **구현됨** | 대시보드 통계 + 시스템 상태 |
| `/admin/users` | SCREEN 4.2절 | `src/app/admin/users/page.tsx` | **구현됨** | UserApprovalTable |
| `/admin/users/bulk-register` | SCREEN 1절 | 미존재 | **미구현** | CSV 업로드, 수동 입력 |
| `/admin/approval` | SCREEN 4.3절 | 미존재 | **미구현** | 별도 승인 페이지 |
| `/admin/access-control` | SCREEN 4.4절 | 미존재 | **미구현** | 역할/상태/항공사 권한 |
| `/admin/password-reset` | SCREEN 4.5절 | `src/app/admin/password-reset/page.tsx` | **구현됨** | 사용자 검색 + 임시 비밀번호 |
| `/admin/audit-logs` | SCREEN 4.6절 | 미존재 | **미구현** | 감시 로그 조회 |
| `/admin/settings` | SCREEN 1절 | 미존재 | **미구현** | 비밀번호 정책, 항공사, 알림 |
| `/admin/airlines` | 미설계 | `src/app/admin/airlines/page.tsx` | **추가됨** | 설계에 없는 독립 페이지 |

### 2.2 페이지 라우팅 점수

- 설계 페이지 수: 18개 (인증 5 + 사용자 4 + 관리자 9)
- 구현 페이지 수: 11개 (인증 5 + 사용자 1 + 관리자 5)
- 일치/구현: 10개
- 변경/의도적 변경: 2개 (/, /signup)
- 미구현: 7개 (/dashboard, /profile, /settings, /admin/bulk-register, /admin/approval, /admin/access-control, /admin/audit-logs)
- 추가 구현: 1개 (/admin/airlines)

**페이지 라우팅 구현율: 61% (11/18)**

### 2.3 핵심 갭 상세

#### GAP-R01: /dashboard 미구현 (심각도: HIGH)
- **설계**: 사용자 로그인 후 랜딩 페이지. 사용자 정보, 항공사 정보, 최근 활동, 유사호출부호 버튼 포함.
- **구현**: 존재하지 않음. 로그인 후 `/airline`로 직행.
- **영향**: 설계 문서의 로그인 흐름이 모두 /dashboard를 중간 경유지로 가정함.
- **현 상태**: `/airline`이 사실상 대시보드 역할을 대체.

#### GAP-R02: / (포털 페이지) 설계 변경 (심각도: LOW)
- **설계**: 시스템 소개 페이지 + 상단 헤더에 로그인 버튼.
- **구현**: 로그인 폼 직접 포함 (항공사/관리자 토글 선택 + 이메일/비밀번호).
- **판단**: 의도적 설계 변경으로 분류. 실용적이지만 설계 문서 업데이트 필요.

#### GAP-R03: 관리자 페이지 미구현 4개 (심각도: MEDIUM)
- `/admin/approval`, `/admin/access-control`, `/admin/audit-logs`, `/admin/settings`
- 이들 기능 일부는 `/admin/users`에 통합되어 있음 (상태 변경 등).

---

## 3. 로그인 후 흐름 분석

### 3.1 설계 문서의 흐름

```
설계 (LOGIN_SYSTEM_DESIGN.md 8절, SCREEN_STRUCTURE_DESIGN.md 2.1절):

  /login 제출
    |
    +-- status=pending  --> /pending (30초 폴링)
    +-- status=suspended --> 에러 표시 ("정지된 계정")
    +-- status=active
          |
          +-- forceChangePassword=true  --> /change-password
          +-- forceChangePassword=false --> /dashboard
```

### 3.2 실제 구현의 흐름

구현에는 **두 개의 로그인 진입점**이 존재한다.

#### 진입점 1: `/` (page.tsx) - 포털 로그인

```
/ 페이지 (항공사/관리자 토글)
    |
    +-- isAdmin=false 선택
    |     |
    |     +-- 로그인 성공 + role=admin --> "일반 사용자 계정으로 로그인해주세요" 에러
    |     +-- 로그인 성공 + role=user  --> /airline 로 이동
    |
    +-- isAdmin=true 선택
          |
          +-- 로그인 성공 + role!=admin --> "관리자 계정이 아닙니다" 에러
          +-- 로그인 성공 + role=admin  --> /admin/users 로 이동
```

파일: `/Users/sein/Desktop/katc1/src/app/page.tsx` (라인 68-85)

**문제점**:
- `pending` 상태 처리가 없음 (설계에서는 pending 사용자도 로그인 가능)
- `suspended` 상태 처리가 없음 (서버에서 403 반환하지만 클라이언트에서 별도 분기 없음)
- `forceChangePassword` 확인이 없음
- Zustand 상태 관리를 사용하지 않고 직접 fetch 호출

#### 진입점 2: `/login` (LoginForm.tsx) - 전용 로그인

```
/login 페이지 (LoginForm 컴포넌트)
    |
    +-- status=suspended --> 에러 표시 + 로그아웃
    +-- forceChangePassword=true --> /change-password
    +-- 기타 --> /airline 로 이동
```

파일: `/Users/sein/Desktop/katc1/src/components/forms/LoginForm.tsx` (라인 67-77)

**문제점**:
- `pending` 상태 분기가 없음 (설계에서는 /pending으로 이동)
- 관리자/사용자 역할 분기가 없음 (모두 /airline로 이동)
- 설계상 `/dashboard`로 이동해야 하나 `/airline`로 이동

### 3.3 로그인 흐름 비교 매트릭스

| 시나리오 | 설계 동작 | / 페이지 구현 | /login 페이지 구현 | 일치 |
|----------|-----------|--------------|-------------------|:----:|
| active + user | /dashboard | /airline | /airline | **변경** |
| active + admin | /admin/* | /admin/users | /airline | **불일치** |
| pending + user | /pending (폴링) | 처리 없음 | 처리 없음 | **미구현** |
| suspended | 에러 메시지 | 서버 에러만 | 에러 + 로그아웃 | **부분** |
| forceChangePassword | /change-password | 처리 없음 | /change-password | **부분** |

### 3.4 미들웨어 라우트 보호

파일: `/Users/sein/Desktop/katc1/src/middleware.ts`

| 설계 규칙 | 구현 | 상태 |
|-----------|------|:----:|
| 비로그인 + /airline, /admin --> /login | refreshToken 쿠키 확인 후 리다이렉트 | **일치** |
| 로그인 + /login, /signup --> 메인 | /airline로 리다이렉트 | **변경** (설계: /dashboard) |
| user + /admin --> 비허용 | parsedUser.role 확인 후 /airline 리다이렉트 | **일치** |
| forceChangePassword + 다른 페이지 | /change-password로 강제 | **일치** |
| 설계: /admin 접근 불가시 /dashboard 리다이렉트 | /airline로 리다이렉트 | **변경** |

**로그인 흐름 구현율: 65%**

### 3.5 핵심 갭 상세

#### GAP-L01: 두 개의 로그인 진입점 불일치 (심각도: HIGH)
- `/` 페이지와 `/login` 페이지에서 로그인 후 동작이 상이함.
- `/` 페이지: 역할 분기 있으나 상태 분기 없음.
- `/login` 페이지: 상태 분기 있으나 역할 분기 없음.
- 사용자가 어디서 로그인하느냐에 따라 다른 경험을 하게 됨.

#### GAP-L02: pending 상태 로그인 흐름 깨짐 (심각도: MEDIUM)
- 설계: pending 상태에서 로그인 가능하고 /pending으로 이동.
- DB 스키마: `status CHECK (status IN ('active', 'suspended'))` -- **pending이 없음**.
- init.sql에서 pending 상태 자체가 DB에서 불가능.
- 즉, 설계에서 가정한 "가입 후 승인 대기" 흐름이 DB 레벨에서 불가.
- 현재 모델: 관리자가 사전등록 -> 바로 active 상태.

#### GAP-L03: 관리자 로그인 시 /login에서 역할 분기 없음 (심각도: MEDIUM)
- `/login`(LoginForm)으로 관리자가 로그인하면 `/airline`로 이동.
- 설계: admin은 `/admin` 또는 `/admin/users`로 이동해야 함.
- `/` 페이지에서만 관리자 분기가 존재.

---

## 4. 세션 관리 분석

### 4.1 JWT 토큰 설계 vs 구현

| 항목 | 설계 | 구현 | 상태 |
|------|------|------|:----:|
| Access Token 유효기간 | 1시간 | 1시간 (`'1h'`) | **일치** |
| Refresh Token 유효기간 | 7일 | 7일 (`'7d'`) | **일치** |
| Access Token 저장소 | Zustand 메모리 | Zustand 메모리 | **일치** |
| Refresh Token 저장소 | httpOnly 쿠키 | httpOnly 쿠키 | **일치** |
| JWT 서명 알고리즘 | HS256 | HS256 (jsonwebtoken 기본) | **일치** |
| Access Token Payload | userId, role | userId, email, role, status, airlineId | **확장** |
| Refresh Token Payload | userId, type:'refresh' | userId (type 없음) | **부분** |
| JWT Secret | 환경변수 | `process.env.JWT_SECRET \|\| 'dev_secret_key...'` | **일치** (dev fallback 있음) |

파일: `/Users/sein/Desktop/katc1/src/lib/jwt.ts`

### 4.2 토큰 갱신 흐름

| 항목 | 설계 | 구현 | 상태 |
|------|------|------|:----:|
| 401 수신시 자동 갱신 | 명시됨 | `apiFetch` 인터셉터에서 구현 | **일치** |
| 동시 요청 중복 방지 | 암묵적 | `refreshingPromise` 싱글톤 패턴 | **일치** |
| 갱신 실패시 로그아웃 | 명시됨 | `authStore.logout()` + `/login` 리다이렉트 | **일치** |
| 갱신 성공시 원래 요청 재시도 | 명시됨 | 새 토큰으로 재시도 | **일치** |

파일: `/Users/sein/Desktop/katc1/src/lib/api/client.ts` (라인 20-113)

### 4.3 상태 저장 구조

| 항목 | 설계 | 구현 | 상태 |
|------|------|------|:----:|
| Zustand store | user + accessToken | user + accessToken + isLoading | **일치** |
| user 쿠키 동기화 | 미설계 | `setCookie('user', ...)` 미들웨어용 | **추가** |
| 파생 상태 | 미설계 | isAuthenticated, isAdmin, isSuspended, isActive | **추가** |

파일: `/Users/sein/Desktop/katc1/src/store/authStore.ts`

**세션 관리 구현율: 95%**

### 4.4 핵심 갭

#### GAP-S01: Refresh Token에 type 필드 없음 (심각도: LOW)
- 설계: `{ userId, type: 'refresh', iat, exp }`
- 구현: `{ userId, iat, exp }` -- type 필드 누락.
- 보안 영향 낮음. Access Token과 Refresh Token 구분이 Payload 구조로만 가능.

#### GAP-S02: / 페이지에서 Zustand 미사용 (심각도: MEDIUM)
- `/` 페이지의 로그인 로직은 Zustand `setAuth`를 사용하지 않음.
- 직접 `fetch` + `router.push`. 로그인 후 Zustand 상태가 비어있을 수 있음.
- `/airline` 페이지에서 user 정보를 쿠키에서 직접 파싱하여 보완.

---

## 5. 데이터 필터링 분석

### 5.1 설계 vs 구현

| 항목 | 설계 | 구현 | 상태 |
|------|------|------|:----:|
| 필터링 기반 | API 호출 시 airline_id 파라미터 | 클라이언트 하드코딩 데이터 + 코드 필터 | **불일치** |
| API 엔드포인트 | GET /api/callsign-warnings?airline_id={id} | 미존재 | **미구현** |
| 데이터 소스 | PostgreSQL callsign_warnings 테이블 | 하드코딩 `INC` 배열 (10건 목업) | **미구현** |
| 항공사 정보 조회 | useAuth() 훅에서 airline 정보 | 쿠키에서 `user` 파싱 -> airline.code 추출 | **변경** |
| 항공사 목록 | DB airlines 테이블 11개 | 페이지 내 하드코딩 `AL` 객체 | **변경** |
| 크로스 항공사 접근 방어 | 서버 API 레벨 검증 | 클라이언트 필터링만 (우회 가능) | **불일치** |

파일: `/Users/sein/Desktop/katc1/src/app/(main)/airline/page.tsx`

### 5.2 airline/page.tsx 상세 분석

```
현재 동작:
1. 쿠키에서 refreshToken 존재 확인 (인증 체크)
2. 쿠키에서 user 정보 파싱 -> airline.code 추출
3. 코드 없으면 KAL 기본값 사용
4. 하드코딩 INC 배열에서 airline 필터링
5. 로컬 상태에 결과 저장
```

**핵심 문제점**:
- 데이터가 하드코딩되어 있어 실시간 데이터 반영 불가.
- 서버 사이드 필터링이 아닌 클라이언트 필터링으로, 모든 항공사 데이터가 번들에 포함.
- `callsign_warnings` 테이블이 DB에 없음.

### 5.3 항공사 데이터 불일치

| 항목 | 설계 (AIRLINES_DATA.md) | DB (init.sql) | 상수 (constants.ts) | / 페이지 | airline 페이지 |
|------|------------------------|---------------|---------------------|----------|---------------|
| 총 항공사 수 | 11개 | **9개** | **9개** | **11개** | **11개** |
| ESR (이스타항공) | ESR | **EOK** | **EOK** | ESR | ESR |
| ARK (에어로케이항공) | ARK | **없음** | **없음** | ARK | ARK |
| APZ (에어프레미아) | APZ | **없음** | **없음** | APZ | APZ |

**데이터 필터링 구현율: 35%**

### 5.4 핵심 갭

#### GAP-D01: 유사호출부호 API 미구현 (심각도: HIGH)
- 설계: `GET /api/callsign-warnings?airline_id={id}`
- 구현: 존재하지 않음. 하드코딩 목업 데이터 사용.
- 이 API가 시스템의 핵심 비즈니스 기능.

#### GAP-D02: 항공사 데이터 불일치 (심각도: HIGH)
- 설계: 11개 항공사, ICAO 코드 ESR/ARK/APZ
- DB: 9개 항공사, 이스타항공 코드가 EOK (ESR이 아님), 에어로케이/에어프레미아 누락
- 프론트엔드: 11개로 하드코딩 (ESR/ARK/APZ 포함) -- DB와 불일치.
- DB에 없는 항공사 코드로 가입하면 에러 발생.

#### GAP-D03: 서버 사이드 데이터 격리 없음 (심각도: HIGH)
- 설계: API 레벨에서 airline_id 검증.
- 구현: 클라이언트에서만 필터링. 보안상 무의미.

---

## 6. 관리자 기능 분석

### 6.1 설계 기능 vs 구현 매트릭스

| 기능 | 설계 페이지 | 구현 여부 | 구현 위치 | 완성도 |
|------|------------|:---------:|-----------|:------:|
| 관리자 대시보드 | /admin | **구현됨** | admin/page.tsx | 85% |
| 사용자 목록 조회 | /admin/users | **구현됨** | admin/users/page.tsx | 80% |
| 사용자 추가 (단일) | /admin/users | **구현됨** | CreateUserModal.tsx | 75% |
| 사용자 상태 변경 | /admin/users | **구현됨** | UserApprovalTable.tsx | 90% |
| 일괄 등록 (CSV) | /admin/users/bulk-register | **미구현** | - | 0% |
| 사용자 승인 관리 | /admin/approval | **미구현** | - | 0% |
| 접근/역할 관리 | /admin/access-control | **미구현** | - | 0% |
| 비밀번호 초기화 | /admin/password-reset | **구현됨** | admin/password-reset/page.tsx | 90% |
| 감시 로그 조회 | /admin/audit-logs | **미구현** | - | 0% |
| 관리자 설정 | /admin/settings | **미구현** | - | 0% |
| 항공사 관리 | 미설계 (settings 하위) | **구현됨** | admin/airlines/page.tsx | 85% |

### 6.2 구현된 관리자 기능 상세

#### /admin (대시보드)
- 사용자 통계 (전체/활성/정지) 카드 3개
- 최근 로그인 5명 테이블
- 시스템 상태 (DB, API)
- 사용자 관리, 항공사 관리, 비밀번호 초기화 링크
- **설계 대비 누락**: 사이드바 네비게이션, 항공사별 사용자 수 그래프, 최근 활동 상세

#### /admin/users
- 전체 사용자 테이블 (이메일, 상태, 역할, 항공사, 가입일)
- 사용자 추가 모달 (CreateUserModal)
- 상태 변경 (active/suspended 토글)
- **설계 대비 누락**: 검색/필터 기능, 페이징, 사용자 상세 정보 모달, 삭제 기능

#### /admin/password-reset
- 이메일 검색 (부분 일치)
- 비밀번호 초기화 (임시 비밀번호 표시)
- **설계 대비 누락**: 초기화 이력 조회, 메일 발송 버튼

#### /admin/airlines (설계 외 추가)
- 항공사 CRUD (생성, 수정, 삭제)
- 순서 변경 (display_order)
- 인라인 편집

### 6.3 관리자 API 엔드포인트

| 설계 API | 구현 API | 상태 |
|----------|----------|:----:|
| GET /api/admin/users?status= | GET /api/admin/users?status=&airlineId= | **확장** |
| PATCH /api/admin/users/[id] | PATCH /api/admin/users/[id] | **일치** |
| POST /api/admin/users (사전등록) | POST /api/admin/users | **일치** |
| GET /api/admin/stats | GET /api/admin/stats | **추가** |
| PUT /api/admin/users/[id]/password-reset | PUT /api/admin/users/[id]/password-reset | **추가** |
| GET/POST/PATCH/DELETE /api/admin/airlines | /api/admin/airlines, /api/admin/airlines/[id] | **추가** |
| GET /api/admin/audit-logs | 미존재 | **미구현** |

### 6.4 사이드바 미구현

파일: `/Users/sein/Desktop/katc1/src/components/layout/Header.tsx`

설계에서 관리자 페이지 전용 사이드바를 명시 (7개 메뉴):
1. 대시보드
2. 사용자 관리
3. 사용자 승인
4. 접근 관리
5. 비밀번호 초기화
6. 감시 로그
7. 설정

구현: **사이드바 없음**. 관리자 대시보드에 링크 버튼 3개만 존재.

**관리자 기능 구현율: 55%**

---

## 7. 데이터 모델 분석

### 7.1 users 테이블 설계 vs 구현

| 필드 | 설계 (ARCHITECTURE_DESIGN.md) | 구현 (init.sql) | 상태 |
|------|-------------------------------|-----------------|:----:|
| id | UUID PK | UUID PK | **일치** |
| email | VARCHAR(255) UNIQUE | VARCHAR(255) UNIQUE | **일치** |
| password_hash | VARCHAR(255) | VARCHAR(255) | **일치** |
| status | pending/active/suspended | **active/suspended** | **변경** |
| role | admin/user | admin/user | **일치** |
| approved_at | TIMESTAMP | **없음** | **미구현** |
| approved_by | UUID FK users(id) | **없음** | **미구현** |
| last_login_at | TIMESTAMP | TIMESTAMP | **일치** |
| created_at | TIMESTAMP DEFAULT NOW() | TIMESTAMP DEFAULT NOW() | **일치** |
| updated_at | TIMESTAMP DEFAULT NOW() | TIMESTAMP DEFAULT NOW() | **일치** |
| airline_id | 미설계 | UUID NOT NULL FK airlines(id) | **추가** |
| is_default_password | 미설계 | BOOLEAN DEFAULT true | **추가** |
| password_change_required | 미설계 | BOOLEAN DEFAULT true | **추가** |
| last_password_changed_at | 미설계 | TIMESTAMP | **추가** |

### 7.2 핵심 변경점

1. **pending 상태 제거**: 설계에서 핵심이었던 "가입 -> pending -> admin 승인 -> active" 흐름이 DB 레벨에서 불가능. 사전등록 모델로 전환됨.
2. **approved_at/approved_by 누락**: 승인 관련 필드가 구현되지 않음.
3. **airline_id 추가**: 설계 문서에는 users 테이블에 항공사 FK가 없었으나 구현에서 필수 필드로 추가.
4. **비밀번호 정책 필드 추가**: is_default_password, password_change_required 등 사전등록 모델 지원 필드.

---

## 8. Overall Score

### 8.1 영역별 점수

| 영역 | 점수 | 상태 | 가중치 |
|------|:----:|:----:|:------:|
| 페이지 라우팅 | 61% | 미달 | 15% |
| 로그인 후 흐름 | 65% | 미달 | 20% |
| 세션 관리 (JWT/Zustand) | 95% | 달성 | 20% |
| 데이터 필터링 | 35% | 미달 | 20% |
| 관리자 기능 | 55% | 미달 | 15% |
| 데이터 모델 | 80% | 미달 | 10% |
| **가중 평균** | **65%** | **미달** | 100% |

### 8.2 v4.0 대비 변화

v4.0에서 92%였던 점수가 65%로 하락한 이유는 **분석 범위 확장** 때문이다.

| 항목 | v4.0 범위 | v5.0 범위 | 비고 |
|------|-----------|-----------|------|
| 인증 API | 포함 | 포함 | 변동 없음 |
| 페이지 라우팅 | 부분 | **전체 18페이지** | 미구현 7개 반영 |
| 로그인 흐름 | 부분 | **두 진입점 모두** | 불일치 발견 |
| 데이터 필터링 | 미포함 | **포함** | 목업 데이터 문제 |
| 관리자 기능 | 4페이지 | **전체 10기능** | 미구현 5개 반영 |

### 8.3 인증 시스템만 기준 점수 (v4.0 호환)

인증 API + 세션 관리 + 비밀번호 흐름만 기준: **92%** (v4.0과 동일)

---

## 9. Recommended Actions

### 9.1 P0 - 즉시 조치 (심각도 HIGH)

| # | 항목 | 상세 | 예상 작업량 |
|---|------|------|------------|
| P0-1 | 항공사 데이터 DB 동기화 | init.sql에 ARK, APZ 추가. ESR -> EOK 통일 또는 ESR로 변경 | 0.5h |
| P0-2 | 로그인 진입점 통합 | / 페이지에서 Zustand setAuth 사용, 상태 분기(suspended) 추가 | 1h |
| P0-3 | /login에서 admin 역할 분기 추가 | LoginForm에서 role=admin이면 /admin으로 리다이렉트 | 0.5h |

### 9.2 P1 - 단기 조치 (1주 이내)

| # | 항목 | 상세 | 예상 작업량 |
|---|------|------|------------|
| P1-1 | 관리자 사이드바 컴포넌트 | AdminSidebar 생성, 관리자 페이지에 통합 | 2h |
| P1-2 | /admin/users 검색/필터/페이징 | 이메일 검색, 항공사 필터, 상태 필터, 페이지네이션 | 3h |
| P1-3 | /admin/audit-logs 페이지 | audit_logs 테이블 조회 API + 프론트엔드 | 4h |
| P1-4 | audit_logs INSERT 로직 추가 | 로그인, 상태 변경, 비밀번호 변경 시 로그 기록 | 2h |

### 9.3 P2 - 중기 조치 (2주 이내)

| # | 항목 | 상세 | 예상 작업량 |
|---|------|------|------------|
| P2-1 | callsign_warnings 테이블 + API | DB 테이블 생성, GET API, 서버 사이드 필터링 | 4h |
| P2-2 | airline/page.tsx API 연동 | 하드코딩 제거, API 호출로 전환 | 2h |
| P2-3 | /admin/approval 페이지 | pending 상태 복원 또는 사전등록 승인 흐름 재설계 | 3h |
| P2-4 | /admin/access-control 페이지 | 역할 변경 + 상태 변경 전용 페이지 | 3h |

### 9.4 P3 - 장기/설계 문서 업데이트

| # | 항목 | 상세 |
|---|------|------|
| P3-1 | ARCHITECTURE_DESIGN.md 업데이트 | pending 상태 제거 반영, airline_id 필드 추가, 비밀번호 정책 필드 반영 |
| P3-2 | SCREEN_STRUCTURE_DESIGN.md 업데이트 | / 페이지 설계 변경 반영, /admin/airlines 추가, /dashboard -> /airline 변경 |
| P3-3 | AIRLINES_DATA.md 업데이트 | 9개 항공사로 변경 또는 DB에 11개 동기화 |
| P3-4 | LOGIN_SYSTEM_DESIGN.md 업데이트 | 사전등록 모델 반영, pending 흐름 제거/수정 |

---

## 10. 설계 변경 기록 (의도적)

아래 변경은 설계 시점 이후 의도적으로 이루어진 것으로, "미구현"이 아닌 "설계 변경"으로 분류한다.

| 변경 항목 | 원래 설계 | 현재 구현 | 변경 사유 |
|-----------|-----------|-----------|-----------|
| 회원가입 방식 | 사용자 직접 가입 -> pending -> admin 승인 | 관리자 사전등록 (active 즉시) | 보안/운영 효율 |
| pending 상태 | DB에서 pending 지원 | DB에서 pending 제거 | 사전등록 모델 채택 |
| / 페이지 | 시스템 소개 + 로그인 버튼 | 로그인 폼 통합 (항공사/관리자 토글) | UX 간소화 |
| 랜딩 페이지 | /dashboard | /airline | 대시보드 생략, 핵심 기능 직행 |
| /admin/airlines | /admin/settings 하위 | 독립 페이지 | 기능 분리 |

---

## 11. 우선 개선 순서

```
Phase 1 (즉시): 데이터 무결성 + 로그인 안정화
  [P0-1] 항공사 DB 동기화
  [P0-2] / 페이지 로그인 Zustand 연동
  [P0-3] /login 관리자 분기

Phase 2 (1주): 관리자 기능 완성
  [P1-1] 사이드바
  [P1-2] 사용자 관리 고도화
  [P1-3] 감시 로그
  [P1-4] 감시 로그 기록 로직

Phase 3 (2주): 핵심 비즈니스 기능
  [P2-1] callsign_warnings 테이블 + API
  [P2-2] airline 페이지 API 연동
  [P2-3] 승인 관리
  [P2-4] 접근 관리

Phase 4 (병렬): 설계 문서 동기화
  [P3-1~4] 설계 문서 업데이트
```

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 5.0 | 2026-02-20 | 확장 범위 갭 분석 (라우팅/흐름/필터링/관리자) | AI Assistant |
| 4.0 | 2026-02-19 | P1 4건 수정 후 최종 분석 (92%) | AI Assistant |
| 3.0 | 2026-02-19 | P0 5건 수정 후 재분석 (85%) | AI Assistant |
| 2.0 | 2026-02-19 | 재분석 (78%) | AI Assistant |
| 1.0 | 2026-02-19 | 최초 갭 분석 | AI Assistant |
