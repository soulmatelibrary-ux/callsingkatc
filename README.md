# ✈️ KATC1 유사호출부호 경고시스템

항공교통관제 안전을 위한 유사호출부호(Look-Alike Call Sign) 관리 및 조치 추적 시스템

## 🎯 주요 기능

- **인증 시스템**: 역할 기반 접근 제어 (Admin/User)
- **유사호출부호 관리**: 호출부호 데이터 업로드 및 조회
- **조치 추적**: 관리자 조치 등록 → 항공사 실행 → 완료 이력
- **실시간 분석**: 오류 유형별 통계 및 세부 분석
- **다중 항공사 지원**: 9개 주요 항공사 관리

## 🛠️ 기술 스택

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **State Management**: Zustand, TanStack Query v5
- **Backend**: Node.js, PostgreSQL
- **BaaS**: bkend.ai (인증, 데이터베이스)
- **배포**: Next.js App Router

## 📋 시스템 요구사항

- Node.js 18+
- PostgreSQL 13+
- npm 또는 yarn
- GitHub 계정 (선택사항)

## 🚀 빠른 시작

### 1️⃣ 저장소 클론

```bash
git clone https://github.com/soulmatelibrary-ux/similar-callsign.git
cd similar-callsign
```

### 2️⃣ 의존성 설치

```bash
npm install
# 또는
yarn install
```

### 3️⃣ 환경 변수 설정

`.env.local` 파일 생성:

```env
# bkend.ai 프로젝트 ID (필수)
# https://bkend.ai에서 프로젝트 생성 후 ID 입력
NEXT_PUBLIC_BKEND_PROJECT_ID=your_bkend_project_id

# PostgreSQL 데이터베이스 (선택)
# 로컬 개발시 기본값: localhost:5432
DATABASE_URL=postgresql://user:password@localhost:5432/katc1
```

### 4️⃣ 데이터베이스 초기화

```bash
# PostgreSQL에서 데이터베이스 생성
psql -U postgres -c "CREATE DATABASE katc1;"

# 스키마 및 샘플 데이터 로드
psql -U postgres -d katc1 -f scripts/init.sql
```

### 5️⃣ 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 열기

### 6️⃣ 빌드 및 배포

```bash
# 프로덕션 빌드
npm run build

# 빌드 결과 실행
npm run start
```

## 📁 프로젝트 구조

```
.
├── src/
│   ├── app/                    # Next.js 앱 라우터
│   │   ├── (main)/             # 인증된 사용자 영역
│   │   ├── admin/              # 관리자 대시보드
│   │   ├── api/                # REST API 엔드포인트
│   │   └── auth/               # 인증 페이지
│   ├── components/             # React 컴포넌트
│   │   ├── actions/            # 조치 관련 컴포넌트
│   │   └── layout/             # 레이아웃 컴포넌트
│   ├── hooks/                  # React 커스텀 훅
│   ├── lib/                    # 유틸리티 함수
│   ├── types/                  # TypeScript 타입 정의
│   └── store/                  # 상태 관리 (Zustand)
├── scripts/
│   └── init.sql                # 데이터베이스 스키마
├── public/                     # 정적 파일
└── package.json

```

## 🔐 인증 흐름

### 회원가입 및 로그인
1. `/auth/signup` - 신규 사용자 등록
2. `/auth/login` - 로그인
3. 토큰 발급 (accessToken + refreshToken)

### 역할 기반 접근
- **Admin**: 조치 등록, 항공사 관리, 전체 현황 조회
- **User**: 자사 항공사 현황 조회, 조치 실행, 완료 등록

## 📊 주요 API 엔드포인트

### 인증
- `POST /api/auth/signup` - 회원가입
- `POST /api/auth/login` - 로그인
- `POST /api/auth/refresh-token` - 토큰 갱신

### 조치 관리
- `GET /api/airlines/[airlineId]/actions` - 항공사별 조치 목록
- `POST /api/airlines/[airlineId]/actions` - 조치 등록
- `PATCH /api/actions/[id]` - 조치 수정/완료
- `GET /api/callsigns` - 유사호출부호 조회

### 항공사 관리
- `GET /api/airlines` - 항공사 목록
- `POST /api/admin/airlines` - 항공사 생성
- `PATCH /api/admin/airlines/[id]` - 항공사 수정
- `DELETE /api/admin/airlines/[id]` - 항공사 삭제

## 📈 데이터베이스 스키마

### 주요 테이블

**airlines** - 항공사
```sql
id, code, name_ko, name_en, display_order
```

**callsigns** - 유사호출부호
```sql
id, airline_id, callsign_pair, my_callsign, other_callsign,
risk_level, similarity, error_type, sub_error, occurrence_count
```

**actions** - 조치 이력
```sql
id, airline_id, callsign_id, action_type, description,
manager_name, status, result_detail, completed_at,
registered_by, registered_at, updated_at, reviewed_by, reviewed_at
```

자세한 스키마는 `scripts/init.sql` 참고

## 🔒 보안 기능

- ✅ JWT 토큰 기반 인증
- ✅ 401/403 자동 에러 처리
- ✅ HSTS, CSP 보안 헤더
- ✅ 비밀번호 강화 규칙 (8자 이상, 대문자, 숫자 포함)
- ✅ 서버사이드 라우트 보호 (middleware)

## 📦 배포 옵션

### Vercel (권장)
```bash
npm install -g vercel
vercel
```

### Docker
```bash
docker build -t katc1 .
docker run -p 3000:3000 katc1
```

### 수동 배포
```bash
npm run build
npm run start
```

## 🧪 테스트 계정

### 관리자
- Email: `admin@katc.com`
- Email: `lsi117@airport.co.kr`
- Password: `Starred3!`

### 일반 사용자 (대한항공)
- Email: `user@kal.com`
- Password: `Starred3!`

> ⚠️ 프로덕션 환경에서는 반드시 변경하세요!

## 🐛 문제 해결

### "Cannot connect to database"
- PostgreSQL이 실행 중인지 확인
- DATABASE_URL이 올바른지 확인
- `scripts/init.sql`으로 스키마 초기화 완료 확인

### "NEXT_PUBLIC_BKEND_PROJECT_ID 에러"
- bkend.ai에서 프로젝트 생성
- `.env.local` 파일에 ID 입력
- `npm run dev` 재실행

### "포트 3000이 이미 사용 중"
```bash
npm run dev -- -p 3001
```

## 📚 문서

- [아키텍처 설계](./docs/01-plan)
- [시스템 설계](./docs/02-design)
- [구현 보고서](./docs/04-report)
- [API 문서](./docs/04-report/features)

## 🤝 기여

버그 리포트 및 기능 요청은 GitHub Issues에 등록해주세요.

## 📄 라이선스

MIT License - 자유롭게 사용, 수정, 배포 가능

## ✨ 개발팀

- Frontend: React/Next.js
- Backend: Node.js/PostgreSQL
- DevOps: bkend.ai

---

**마지막 업데이트**: 2026-02-20
**버전**: 1.0.0
**상태**: ✅ Production Ready

## 🚀 다음 단계

1. `.env.local` 설정
2. `npm install`
3. 데이터베이스 초기화
4. `npm run dev`
5. 브라우저에서 `http://localhost:3000` 열기

행운을 빕니다! 🎉
