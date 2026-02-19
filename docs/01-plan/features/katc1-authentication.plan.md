# KATC1 인증 시스템 - 계획 문서

**프로젝트**: KATC1 유사호출부호 경고시스템
**기능**: 사용자 인증 및 권한 관리
**버전**: 1.0.0
**상태**: 계획 완료 → 구현 진행 중
**작성일**: 2026-02-19

---

## 1. 프로젝트 요구사항

### 1.1 핵심 기능

#### 인증 기능
- [x] 이메일/비밀번호 로그인 (변경: 회원가입 제거 → 사전등록으로 변경)
- [x] JWT 기반 토큰 관리 (accessToken + refreshToken)
- [x] 로그아웃 및 세션 관리
- [x] 토큰 자동 갱신
- [x] 초기 비밀번호 강제 변경 (첫 로그인 시)

#### 보안 기능
- [x] 비밀번호: 8자 이상, 대문자, 소문자, 숫자, 특수문자 모두 포함 (강화)
- [x] 90일마다 비밀번호 변경 강제
- [x] 비밀번호 변경 이력 관리

#### 항공사 관리
- [x] 항공사별 사전등록 (국내 항공사 8-9개)
- [x] 항공사별 데이터 격리 및 필터링
- [x] 항공사 정보 테이블 관리

#### 관리 기능
- [x] 관리자: 사용자 일괄 등록 (CSV 또는 폼)
- [x] 관리자: 사용자 상태 관리
- [ ] 2FA (향후)
- [ ] OAuth (향후)

### 1.2 사용자 유형 (변경됨)
1. **항공사 직원**: 사전등록 → 임시 비밀번호 로그인 → 비밀번호 강제 변경 → 대시보드
2. **관리자**: 사용자 사전등록 → 사용자 관리 → 통계 조회

### 1.3 사전등록 정책 (NEW)
- **가입 방식**: 사용자 회원가입 제거 → 관리자가 이메일 주소 사전 등록
- **항공사 선택**: 국내 항공사 11개 (이미지 기준)
  - KAL (대한항공), AAR (아시아나항공), JJA (제주항공)
  - JNA (진에어), TWB (티웨이항공), ABL (에어부산)
  - ASV (에어서울), ESR (이스타항공), FGW (플라이강원)
  - ARK (에어로케이항공), APZ (에어프레미아)
- **임시 비밀번호**: 관리자가 생성 또는 시스템에서 자동 생성
- **데이터 격리**: 사용자는 자신의 항공사에 해당하는 데이터만 조회
  - 예: KAL(대한항공) 사용자 → callsign_warnings에서 airline_code='KAL'인 데이터만 조회
  - 예: AAR(아시아나) 사용자 → callsign_warnings에서 airline_code='AAR'인 데이터만 조회

### 1.4 비밀번호 정책 (강화됨)
- **최소 길이**: 8자 이상
- **필수 포함**:
  - 대문자 (A-Z)
  - 소문자 (a-z)
  - 숫자 (0-9)
  - 특수문자 (!@#$%^&*()_+-=[]{}|;:,.<>? 등)
- **변경 주기**: 90일마다 강제 변경 (last_password_changed_at 기반)
- **변경 이력**: 최근 5개 비밀번호와 동일 비밀번호 사용 불가
- **초기 변경**: 첫 로그인 시 임시 비밀번호에서 새 비밀번호로 반드시 변경

---

## 2. 기술 스택 선택

### 2.1 Frontend
```
✓ Next.js 14 + React (풀스택: frontend + backend 통합)
✓ TypeScript (타입 안전성)
✓ Tailwind CSS (스타일링)
✓ Zustand (상태 관리: accessToken, user)
✓ TanStack Query v5 (서버 상태: 사용자 폴링)
✓ react-hook-form + zod (폼 처리 및 검증)
✓ lucide-react (아이콘)
```

### 2.2 Backend
```
✓ Next.js API Routes (Express 불필요)
✓ PostgreSQL 15 (데이터베이스)
✓ JWT (토큰 인증)
✓ bcryptjs (비밀번호 해싱)
✓ pg (PostgreSQL 드라이버)
```

### 2.3 배포
```
✓ Docker + Docker Compose (로컬 개발 및 프로덕션)
✓ AWS (Phase 1: 초기 배포)
✓ 공공기관 서버 (Phase 2: 최종 목표)
```

### 2.4 ORM 선택: 순수 SQL 유지
**이유**:
- 현재 프로젝트 규모 (3-5 테이블)에 최적
- 성능 미세 최적화 용이
- 마이그레이션 단계 불필요
- 배포 환경 단순화

---

## 3. 아키텍처 개요

### 3.1 3계층 구조
```
┌─────────────────────────────────────┐
│  Frontend (React)                   │
│  - LoginForm, SignupForm            │
│  - UserApprovalTable                │
│  - Zustand + TanStack Query         │
└──────────────┬──────────────────────┘
               │ HTTP/HTTPS
               ↓
┌─────────────────────────────────────┐
│  Backend (Next.js API Routes)       │
│  - /api/auth/signup                │
│  - /api/auth/login                 │
│  - /api/admin/users                │
└──────────────┬──────────────────────┘
               │ TCP 5432
               ↓
┌─────────────────────────────────────┐
│  Database (PostgreSQL)              │
│  - users table                      │
│  - audit_logs table                 │
└─────────────────────────────────────┘
```

### 3.2 보안 구조
```
클라이언트:
  - accessToken: Zustand 메모리 (1시간 유효)
  - refreshToken: httpOnly 쿠키 (7일 유효)
  - user: Zustand 메모리

서버:
  - JWT 검증 (매 요청마다)
  - bcrypt 비밀번호 검증
  - 역할 기반 접근 제어 (RBAC)
  - 상태 기반 접근 제어

데이터베이스:
  - 비밀번호 해시 저장 (평문 저장 금지)
  - 감시 로그 기록
  - 인덱스 최적화
```

---

## 4. 데이터 모델 (변경됨)

### 4.1 Airlines 테이블 (NEW)
```sql
CREATE TABLE airlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) UNIQUE NOT NULL,      -- 'KAL', 'AAR', 'TWB' 등
  name_ko VARCHAR(100) NOT NULL,         -- '대한항공', '아시아나항공' 등
  name_en VARCHAR(100),                  -- 'Korean Air' 등
  created_at TIMESTAMP DEFAULT NOW()
);

-- 기본 항공사 데이터 (국내 항공사 11개)
INSERT INTO airlines (code, name_ko, name_en) VALUES
('KAL', '대한항공', 'Korean Air'),
('AAR', '아시아나항공', 'Asiana Airlines'),
('JJA', '제주항공', 'Jeju Air'),
('JNA', '진에어', 'Jin Air'),
('TWB', '티웨이항공', 'T''way Air'),
('ABL', '에어부산', 'Air Busan'),
('ASV', '에어서울', 'Air Seoul'),
('ESR', '이스타항공', 'Eastar Jet'),
('FGW', '플라이강원', 'Fly Gangwon'),
('ARK', '에어로케이항공', 'Air Korea'),
('APZ', '에어프레미아', 'Air Premia');
```

### 4.2 Users 테이블 (수정됨)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  airline_id UUID NOT NULL REFERENCES airlines(id),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user')),

  -- 비밀번호 정책
  is_default_password BOOLEAN DEFAULT true,           -- 초기 비밀번호 여부
  password_change_required BOOLEAN DEFAULT true,       -- 비밀번호 변경 필수 여부
  last_password_changed_at TIMESTAMP,                 -- 마지막 비밀번호 변경 시간

  -- 기타
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_airline_id ON users(airline_id);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
```

**주요 변경사항**:
- `airline_id` 추가: 항공사별 데이터 필터링 용
- `is_default_password` 추가: 초기 비밀번호 여부 (true = 반드시 변경)
- `password_change_required` 추가: 90일 주기 강제 변경 여부
- `last_password_changed_at` 추가: 비밀번호 변경 추적
- `status` 변경: pending 제거 → active/suspended만 사용 (사전등록이므로 pending 불필요)

### 4.3 Password History 테이블 (NEW)
```sql
CREATE TABLE password_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  password_hash VARCHAR(255) NOT NULL,
  changed_at TIMESTAMP DEFAULT NOW(),
  changed_by VARCHAR(50)  -- 'self', 'admin', 'system'
);

-- 인덱스
CREATE INDEX idx_password_history_user_id ON password_history(user_id);

-- 기능: 최근 5개 비밀번호와 같은 비밀번호 사용 방지
```

### 4.4 Audit Logs 테이블
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(50),
  table_name VARCHAR(50),
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
```

### 4.5 모든 데이터 테이블 (항공사 필터링 적용)
**중요**: KATC 시스템의 모든 데이터 테이블에 `airline_id` 또는 `airline_code` 필드 추가
```sql
-- 예시: callsign_warnings
ALTER TABLE callsign_warnings ADD COLUMN airline_id UUID REFERENCES airlines(id);
ALTER TABLE callsign_warnings ADD COLUMN airline_code VARCHAR(10);
CREATE INDEX idx_callsign_warnings_airline_id ON callsign_warnings(airline_id);

-- API 조회 시 항공사 필터링:
-- SELECT * FROM callsign_warnings WHERE airline_id = (사용자 항공사)
```

---

## 5. API 엔드포인트

### 5.1 인증 API
| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | /api/auth/signup | 회원가입 |
| POST | /api/auth/login | 로그인 |
| POST | /api/auth/logout | 로그아웃 |
| GET | /api/auth/me | 사용자 정보 |
| POST | /api/auth/refresh | 토큰 갱신 |

### 5.2 관리자 API
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /api/admin/users | 사용자 목록 |
| PATCH | /api/admin/users/[id] | 사용자 상태 변경 |

---

## 6. 페이지 구조

### 6.1 인증 페이지 (비로그인 사용자)
```
/ (포털 메인 페이지)
├── /login (로그인)
├── /forgot-password (비밀번호 찾기)
├── /change-password (비밀번호 변경)
└── /pending (승인 대기 - 30초 폴링)
```

### 6.2 사용자 페이지 (로그인 후)
```
/dashboard (메인 대시보드)
├── 사용자 정보 표시
├── 항공사 정보
├── 최근 활동
└── [유사호출부호] 버튼 → /airline 이동

/airline (유사호출부호 경고 시스템)
├── airline.html 모움 파일 (임시)
├── 항공사 데이터 필터링
└── 경고 목록 조회

/profile (프로필 관리)
└── 사용자 정보 수정

/settings (설정)
└── 개인 설정
```

### 6.3 관리자 페이지 (관리자만)
```
/admin (관리자 대시보드)
├── 사용자 현황 통계
├── 시스템 상태
└── 최근 로그

/admin/users (사용자 관리)
├── 사용자 목록 조회
├── 사용자 추가 (단일/일괄)
└── 사용자 상세 정보

/admin/users/bulk-register (일괄 등록)
├── CSV 파일 업로드
├── 수동 입력 폼
└── 등록 결과 확인

/admin/approval (사용자 승인)
├── 승인 대기 목록
├── 승인 / 거절
└── 메일 발송

/admin/access-control (접근 관리)
├── 역할 관리 (admin/user)
├── 상태 관리 (active/suspended)
└── 항공사별 권한 설정

/admin/password-reset (비밀번호 초기화)
├── 사용자 검색
├── 임시 비밀번호 생성
└── 리셋 이력 조회

/admin/audit-logs (감시 로그)
├── 로그 조회 (필터링)
├── 사용자별 활동 추적
└── 시스템 변경 이력

/admin/settings (관리자 설정)
├── 비밀번호 정책 설정
├── 항공사 관리
└── 알림 설정
```

---

## 7. 워크플로우 (변경됨)

### 7.1 사전등록 흐름 (관리자) (NEW)
```
관리자: /admin/users/bulk-register 접속
    ↓
CSV 파일 업로드 또는 수동 입력
    - email: user@airline.com
    - airline_code: KAL (또는 드롭다운 선택)
    - temp_password: Temp@1234 (자동 생성 또는 입력)
    ↓
POST /api/admin/users/register-bulk
    ↓
서버 로직:
1. 이메일 중복 확인
2. 항공사 코드 확인 (airlines 테이블)
3. 임시 비밀번호 bcrypt 해싱
4. users 테이블 INSERT:
   - status = 'active'
   - airline_id = (항공사 ID)
   - is_default_password = true
   - password_change_required = true
    ↓
응답: 등록 결과 (성공/실패)
    ↓
(선택) 이메일 발송:
제목: [KATC] 초기 로그인 정보
내용: 이메일, 임시 비밀번호, 첫 로그인 후 반드시 비밀번호 변경 안내
```

### 7.2 첫 로그인 및 비밀번호 강제 변경 (NEW)
```
사용자가 이메일 + 임시 비밀번호로 로그인
    ↓
POST /api/auth/login
    ↓
서버 로직:
1. 이메일 조회
2. bcrypt.compare (임시 비밀번호)
3. 성공 시 JWT 토큰 생성
4. is_default_password = true 확인
    ↓
응답: user + accessToken + forceChangePassword: true
    ↓
클라이언트 확인:
- forceChangePassword = true
  → /change-password 페이지로 즉시 리다이렉트
- (로그아웃 불가능 - 강제)
    ↓
사용자: 새 비밀번호 입력 (강화된 정책)
- 8자 이상
- 대문자, 소문자, 숫자, 특수문자 모두 포함
    ↓
POST /api/auth/change-initial-password
    ↓
서버 로직:
1. 현재 비밀번호(임시) 검증
2. 새 비밀번호 정책 검증
3. 새 비밀번호 bcrypt 해싱
4. users 테이블 UPDATE:
   - password_hash = new hash
   - is_default_password = false
   - password_change_required = false
   - last_password_changed_at = NOW()
5. password_history 테이블 INSERT
    ↓
응답: 성공
    ↓
클라이언트: /dashboard로 자동 이동
```

### 7.3 일반 로그인 흐름 (변경됨)
```
사용자 입력
    ↓
클라이언트 검증
    ↓
POST /api/auth/login
    ↓
서버: 이메일 조회
서버: bcrypt.compare (비밀번호)
서버: 상태 확인 (pending/active/suspended)
서버: JWT 토큰 생성
    ↓
응답: user + accessToken + refreshToken
    ↓
클라이언트:
  - Zustand: accessToken 저장
  - 쿠키: refreshToken 저장
    ↓
라우팅:
  - status='pending' → /pending
  - status='active' → /dashboard
  - status='suspended' → 에러
```

### 7.3 토큰 자동 갱신
```
API 요청
    ↓
accessToken 검증
    ↓
만료됨 (401)
    ↓
POST /api/auth/refresh
    ↓
refreshToken 검증
    ↓
새 accessToken 생성
    ↓
응답: 새 accessToken
    ↓
원래 요청 재시도
```

### 7.4 메인 페이지 흐름 (/)
```
초기 접속
    ↓
헤더 확인:
- 비로그인 상태: [로그인] 버튼 표시
- 로그인 상태: [사용자명] [대시보드] [로그아웃] 표시
- 관리자: [사용자명] [관리자 페이지] [대시보드] [로그아웃] 표시
    ↓
메인 콘텐츠:
- 시스템 소개 및 로고
- 주요 기능 버튼 표시
  - [유사호출부호] (로그인 사용자만)
  - [기타 기능] (향후)
    ↓
[유사호출부호] 버튼 클릭 (로그인한 사용자)
    ↓
/airline 페이지 이동
    ↓
airline.html 모움 파일 표시
(사용자 항공사 데이터만 필터링)
```

---

## 8. 보안 설계

### 8.1 인증
- JWT 토큰 (1시간 + 7일)
- bcrypt 해싱 (10 라운드)
- httpOnly 쿠키 (XSS 방어)

### 8.2 인가
- RBAC (admin, user)
- 상태 기반 (pending, active, suspended)

### 8.3 공격 방어
- SQL Injection: 매개변수화 쿼리
- XSS: httpOnly 쿠키
- CSRF: SameSite 쿠키
- Enumeration: 동일 에러 메시지
- Timing Attack: bcrypt timing 안전

---

## 9. 배포 전략

### Phase 1: 로컬 개발 ✅
- Docker PostgreSQL
- npm run dev
- localhost:3001

### Phase 2: AWS 배포 (1-2주)
- AWS RDS PostgreSQL
- AWS EC2 + Docker
- Nginx 리버스 프록시
- Let's Encrypt SSL

### Phase 3: 공공기관 마이그레이션 (1-2개월)
- 병렬 운영
- 트래픽 점진적 전환
- AWS 서비스 종료

---

## 10. 구현 로드맵

### Completed ✅
- [x] 프로젝트 초기화
- [x] 데이터베이스 설계
- [x] API 엔드포인트 구현
- [x] Frontend 컴포넌트 구현
- [x] 인증 로직 구현
- [x] 보안 설정
- [x] 로컬 테스트 환경
- [x] 배포 설정 (Docker)
- [x] 설계 문서 작성
- [x] 코드 정리

### In Progress 🔄
- [ ] 로컬 회원가입-로그인 통합 테스트
- [ ] Docker Compose 테스트

### Pending ⏳
- [ ] AWS 배포
- [ ] 공공기관 마이그레이션
- [ ] 2FA 구현
- [ ] OAuth 구현

---

## 11. 현재 상태 요약

| 영역 | 상태 | 진행률 |
|------|------|--------|
| 설계 | ✅ 완료 | 100% |
| 백엔드 구현 | ✅ 완료 | 100% |
| 프론트엔드 구현 | ✅ 완료 | 100% |
| 데이터베이스 | ✅ 준비 | 100% |
| 로컬 테스트 | 🔄 진행 중 | 50% |
| AWS 배포 | ⏳ 예정 | 0% |
| 공공기관 마이그레이션 | ⏳ 예정 | 0% |

---

## 12. 문서 구조

```
docs/
├── 01-plan/
│   └── features/
│       ├── katc1-authentication.plan.md (이 문서)
│       └── implementation-priority.md (구현 우선순위)
├── 02-design/
│   ├── ARCHITECTURE_DESIGN.md (시스템 아키텍처 설계 완료)
│   ├── LOGIN_SYSTEM_DESIGN.md (로그인 시스템 설계 완료)
│   ├── SCREEN_STRUCTURE_DESIGN.md (화면 구조 및 관리자 페이지 설계 완료)
│   └── security-spec.md (보안 사양)
├── 03-analysis/ (향후 갭 분석)
│   └── features/
│       └── katc1-auth-gap.md
└── 04-report/ (향후 완료 보고서)
    └── features/
        └── katc1-auth-v1.md
```

---

## 13. 다음 단계

### 즉시 (오늘)
1. 설계 검토 및 승인
2. 로컬 테스트 (회원가입-로그인 흐름)

### 1주일 이내
1. Docker Compose 테스트
2. AWS 배포 준비

### 2-4주
1. AWS 배포 실행
2. 공공기관 서버 준비

---

**상태**: ✅ 계획 수립 완료
**다음**: DESIGN Phase 검증 → DO Phase (구현 및 테스트) → CHECK Phase (갭 분석)

