# CLAUDE.md - Claude Code 프로젝트 지침서

> 이 파일은 Claude Code가 프로젝트를 효율적으로 진행하기 위한 규칙, 패턴, 자동화 지침을 정의합니다.
> Claude Code는 이 지침을 우선시하여 작업합니다.

---

## 📋 프로젝트 기본 정보

### 프로젝트 개요
- **프로젝트명**: KATC1 - 항공사 유사호출부호 경고시스템
- **설명**: 항공사 운항 중 발생하는 유사 호출부호 상황을 감지하고 관리하는 시스템
- **레벨**: Dynamic (Next.js + PostgreSQL + TanStack Query)
- **배포**: Vercel (예정)

### 기술 스택
```
Frontend: Next.js 14, TypeScript, Tailwind CSS, Zustand, TanStack Query v5
Backend: Node.js (API Routes), PostgreSQL 15
Auth: JWT (AccessToken + RefreshToken)
Tools: Docker, bash scripts
```

### 주요 데이터베이스
- **테이블**: users, airlines, callsigns, actions, announcements, file_uploads
- **핵심**: callsigns (156개 유사호출부호 데이터 보유)

---

## 📁 폴더 구조 및 규칙

### 핵심 디렉토리
```
src/
├── app/                    # Next.js App Router
│   ├── (main)/            # 사용자 서비스
│   ├── admin/             # 관리자 서비스
│   ├── api/               # REST API 엔드포인트
│   └── auth/              # 인증 관련
├── components/            # React 컴포넌트
├── hooks/                 # 커스텀 훅 (TanStack Query)
├── lib/                   # 유틸리티 및 설정
├── store/                 # Zustand 상태 관리
├── types/                 # TypeScript 타입 정의
└── scripts/               # 데이터베이스 초기화 스크립트
```

### 명명 규칙
```typescript
// 파일명: kebab-case
// 예: user-approval-table.tsx, useAirlineCallsigns.ts

// 컴포넌트: PascalCase
// 예: export function UserApprovalTable() {}

// 훅: camelCase + 'use' 접두사
// 예: export function useAirlineCallsigns() {}

// 상수: UPPER_SNAKE_CASE
// 예: const MAX_LIMIT = 1000;

// 함수: camelCase
// 예: function calculateRiskLevel() {}
```

---

## 🔄 API 설계 규칙

### REST API 엔드포인트 패턴
```
공개 API:
GET    /api/airlines                     # 항공사 목록
GET    /api/airlines/{id}/callsigns      # 항공사별 유사호출부호
GET    /api/callsigns/stats              # 통계

관리자 API:
GET    /api/admin/users                  # 사용자 목록
POST   /api/admin/users/{id}/approve     # 사용자 승인
GET    /api/admin/airlines               # 항공사 관리

인증 API:
POST   /api/auth/login                   # 로그인
POST   /api/auth/logout                  # 로그아웃
POST   /api/auth/refresh                 # 토큰 갱신
```

### 응답 형식 (통일)
```typescript
// 단일 데이터
{ data: T, success: boolean }

// 목록 데이터
{ data: T[], pagination: { page, limit, total, totalPages } }

// 에러
{ error: string, status: 400|401|403|404|500 }
```

### 쿼리 파라미터 규칙
```
필터: ?riskLevel=매우높음&status=in_progress
페이지: ?page=1&limit=100
정렬: ?sortBy=created_at&order=desc
범위: ?dateFrom=2026-02-01&dateTo=2026-02-25
```

---

## 🛠️ 서브에이전트 활용 규칙

### 자동 호출 조건
아래 상황에서 Claude Code는 **자동으로 서브에이전트를 활용**합니다:

#### 1️⃣ **코드 구현 완료 후** (자동 실행)
```
조건: 새 기능 구현 또는 버그 수정 완료
액션:
  - 자동으로 gap-detector 실행 → 설계-구현 일치도 확인
  - 일치도 < 90% → pdca-iterator 자동 실행 → 개선
```

#### 2️⃣ **API 구현 완료 후** (자동 실행)
```
조건: POST/PATCH/DELETE 엔드포인트 구현
액션:
  - 자동으로 security-architect 실행 → 보안 검증
  - XSS, CSRF, SQL Injection 등 취약점 확인
```

#### 3️⃣ **데이터베이스 스키마 변경 후** (자동 실행)
```
조건: SQL 마이그레이션 또는 스키마 수정
액션:
  - 자동으로 API 쿼리 일관성 검증
  - 컬럼 존재 여부 확인
```

#### 4️⃣ **성능 최적화 필요** (수동 호출)
```
명령어: "성능 분석해줘" 또는 "/analyze"
에이전트: enterprise-expert
액션: 병목 구간 분석, 캐싱 전략 제안
```

#### 5️⃣ **배포 전 최종 검증** (수동 호출)
```
명령어: "배포 준비 확인해줘"
에이전트:
  - code-analyzer (코드 품질)
  - security-architect (보안)
  - qa-strategist (테스트)
```

---

## 📝 코드 스타일 및 주의사항

### TypeScript
```typescript
// ✅ 필수: 타입 정의
interface UserApprovalProps {
  userId: string;
  adminId: string;
  status: 'pending' | 'approved' | 'rejected';
}

// ❌ 금지: any 타입 사용
const data: any = response.data;  // 사용 금지!

// ✅ 권장: 명시적 타입
const data: Callsign[] = response.data;
```

### 주석 규칙
```typescript
// ✅ 필수: 복잡한 로직 설명
/**
 * callsigns 테이블에서 in_progress 상태의 데이터만 조회
 * - riskLevel 필터 적용 가능
 * - 페이지네이션 지원 (최대 1000개)
 */

// ✅ 중요: 조치사항 표시
// 📌 IMPORTANT: 이 값은 환경 변수에서 반드시 설정해야 합니다
// 🔴 CRITICAL: 토큰 만료 시 자동으로 갱신됩니다

// ❌ 불필요: 자명한 코드 주석은 생략
const count = items.length;  // 아이템 개수 (불필요)
```

### 금지 사항 ⛔
```typescript
// ❌ 1. force-push 또는 destructive git 명령
git push --force
git reset --hard

// ❌ 2. 환경 변수 하드코딩
const API_KEY = "sk-12345...";  // 절대 금지!

// ❌ 3. console.log 남기기
console.log("DEBUG:", data);  // 제거 필수

// ❌ 4. 주석 처리된 코드 커밋
// const oldFunction = () => {};  // 삭제 필수

// ❌ 5. 타입 검증 생략
if (data === undefined) {  // ❌ undefined 체크 누락
  // ...
}
```

### 권장 사항 ✅
```typescript
// ✅ 1. 에러 처리는 명시적으로
try {
  const result = await query(sql, params);
} catch (error) {
  console.error('[Database] Query error:', error);
  return NextResponse.json({ error: '...' }, { status: 500 });
}

// ✅ 2. 로그는 구조화된 형식으로
console.log('[COMPONENT_NAME] Action description:', { key: value });

// ✅ 3. API 응답은 항상 검증
if (!response.ok) {
  throw new Error(`API error: ${response.status}`);
}
```

---

## 🔐 보안 규칙

### 인증 & 인가
```typescript
// ✅ 모든 API는 토큰 검증 필수
const token = request.headers.get('Authorization')?.substring(7);
const payload = verifyToken(token);

if (!payload) {
  return NextResponse.json(
    { error: '인증이 필요합니다.' },
    { status: 401 }
  );
}

// ✅ 역할 기반 접근 제어 (RBAC)
if (payload.role !== 'admin') {
  return NextResponse.json(
    { error: '권한이 없습니다.' },
    { status: 403 }
  );
}
```

### 데이터 검증
```typescript
// ✅ 입력값 검증 필수
if (!email || !email.includes('@')) {
  return NextResponse.json({ error: '유효한 이메일이 아닙니다.' }, { status: 400 });
}

// ✅ SQL Injection 방지 (파라미터화 쿼리)
const result = await query(
  'SELECT * FROM users WHERE email = $1',  // ✅ $1 사용
  [email]                                   // ✅ 파라미터 분리
);

// ❌ SQL Injection (절대 금지!)
const result = await query(
  `SELECT * FROM users WHERE email = '${email}'`  // 위험!
);
```

---

## 🔄 개발 워크플로우

### 1단계: 작업 시작
```bash
# 새 브랜치 생성 (선택사항)
git checkout -b feature/description

# 작업 시작 전 상태 확인
git status
```

### 2단계: 구현 진행
```
- 코드 작성
- 테스트 실행 (필요시)
- 주석 추가
```

### 3단계: 커밋 (중요!)
```bash
# 파일 스테이징
git add [files]

# 의미 있는 메시지로 커밋
git commit -m "feat: 설명 또는 fix: 버그 설명"

# 커밋 메시지 형식 (필수)
# feat: 새 기능 추가
# fix: 버그 수정
# refactor: 코드 개선
# docs: 문서 수정
# chore: 설정/빌드 변경
```

### 4단계: 검증 (자동 실행)
```
- gap-detector: 설계-구현 일치도 확인 (자동)
- code-analyzer: 코드 품질 검증 (자동)
- security-architect: 보안 검증 (자동)
```

### 5단계: Push
```bash
git push origin [branch]
# 또는 main 브랜치로
git push origin master
```

---

## 🚀 배포 전 체크리스트

배포 전 반드시 확인할 항목:

```
[ ] 모든 TypeScript 에러 제거 (npm run build)
[ ] 환경 변수 설정 (.env.local)
[ ] 데이터베이스 마이그레이션 완료
[ ] 보안 헤더 설정 확인 (HSTS, CSP, X-Frame-Options)
[ ] API 토큰 검증 확인
[ ] SQL Injection 방지 확인 (파라미터화 쿼리)
[ ] 에러 처리 로직 확인
[ ] 로그 출력 제거 (console.log 등)
[ ] 주석 처리된 코드 삭제
[ ] git push 완료
```

---

## 📞 특수 명령어

### Claude Code에 직접 지시하는 방법

```
"gap 분석해줘"
  → gap-detector 자동 실행 (설계-구현 비교)

"보안 검토해줘"
  → security-architect 자동 실행

"코드 품질 확인해줘"
  → code-analyzer 자동 실행

"성능 분석해줘"
  → enterprise-expert 자동 실행

"배포 준비 확인"
  → qa-strategist + code-analyzer 순차 실행

"/pdca status"
  → 현재 PDCA 단계 확인

"/pdca iterate"
  → 자동 개선 반복 (최대 5회)
```

---

## 🔗 주요 파일 및 경로

```
설정 파일:
- .env.local                          # 환경 변수
- next.config.js                      # Next.js 설정
- tsconfig.json                       # TypeScript 설정

데이터베이스:
- scripts/init.sql                    # DB 초기화 스크립트
- docker-compose.yml                  # Docker 설정

핵심 API:
- src/app/api/auth/login/route.ts    # 로그인
- src/app/api/airlines/[id]/callsigns/route.ts  # 유사호출부호 조회

상태 관리:
- src/store/authStore.ts              # 인증 상태
- src/hooks/useAirlineCallsigns.ts    # 데이터 조회 훅
```

---

## 📊 최근 개선 사항 (2026-02-25)

| 날짜 | 항목 | 상태 |
|------|------|------|
| 2026-02-24 | DB 스키마 불일치 수정 | ✅ |
| 2026-02-25 | API limit 100→1000 상향 | ✅ |
| 2026-02-25 | 156개 전체 데이터 조회 가능 | ✅ |

---

## 💡 주의사항

> **최우선 원칙**: 이 CLAUDE.md의 규칙을 따르면, Claude Code는 더 효율적이고 안전하게 작업합니다.
> 규칙에 충돌하는 사항이 있으면 이 파일의 지침을 우선합니다.

> **자동화 활성화**: 서브에이전트는 조건을 만족하면 사용자 명령 없이 자동으로 실행됩니다.
> 불필요한 경우 "자동화 비활성화"로 요청하세요.

---

**최종 수정**: 2026-02-25
**관리자**: sein
