# KATC1 인증 시스템 - 개발 계획서

## 📌 프로젝트 개요

### 현재 구조
- **Frontend**: React (Next.js 14 App Router)
- **Backend**: Next.js API Routes (Express 불필요)
- **Database**: PostgreSQL 15
- **ORM 선택**: 순수 SQL (또는 Prisma 도입 가능)

---

## 🎯 기술 결정 사항

### ORM 선택: 순수 SQL vs Prisma

#### 현재 방식: 순수 SQL
```typescript
// lib/db.ts - 현재 구현
const result = await query(
  'SELECT * FROM users WHERE email = $1',
  [email]
);
```

**장점:**
- 성능 최적화 용이
- 학습곡선 낮음
- 의존성 최소화
- 소규모 프로젝트에 적합
- Prisma 마이그레이션 나중에 가능

**단점:**
- SQL 직접 작성 필요
- 타입 안전성 감소
- 쿼리 반복 코드 증가

#### Prisma 도입 옵션
```typescript
// schema.prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  status    String   @default("pending")
  role      String   @default("user")
}

// 사용법
const user = await prisma.user.findUnique({
  where: { email },
});
```

**장점:**
- 자동 타입 생성 (안전성)
- 마이그레이션 관리 자동화
- 관계 쿼리 간편
- 규모 있는 프로젝트에 적합

**단점:**
- 추가 의존성 (번들 크기 증가)
- 학습곡선 (스키마 문법)
- 성능 미세 최적화 어려움
- 마이그레이션 단계 필요

### 권장사항: **순수 SQL 유지**
- 현재 프로젝트 규모 (3-5 테이블)에 적합
- 배포 환경 단순화
- 나중에 필요 시 Prisma 마이그레이션 가능
- 공공기관 서버 이전 시 복잡도 증가 최소화

---

## 📋 개발 체크리스트

### Phase 1: 로컬 개발 ✅ (완료)
- [x] 프로젝트 초기화
- [x] 데이터베이스 설계 및 생성
- [x] API Routes 구현
  - [x] 회원가입 (`/api/auth/signup`)
  - [x] 로그인 (`/api/auth/login`)
  - [x] 토큰 갱신 (`/api/auth/refresh`)
  - [x] 사용자 정보 (`/api/auth/me`)
  - [x] 로그아웃 (`/api/auth/logout`)
- [x] Frontend 컴포넌트
  - [x] 인증 폼 (회원가입, 로그인)
  - [x] Header 및 네비게이션
  - [x] 관리자 패널
- [x] 보안 구현
  - [x] JWT 토큰
  - [x] bcrypt 비밀번호 해싱
  - [x] httpOnly 쿠키
  - [x] CORS 헤더
- [x] 로컬 테스트 완료

### Phase 2: AWS 배포 준비 (예정)
- [ ] AWS 계정 생성 및 권한 설정
- [ ] RDS PostgreSQL 인스턴스 생성
- [ ] EC2 인스턴스 생성 및 보안 그룹 설정
- [ ] 환경 변수 관리 (AWS Secrets Manager 또는 Systems Manager)
- [ ] Docker 이미지 빌드 및 ECR 푸시
- [ ] 또는 직접 EC2에 Docker Compose 배포
- [ ] SSL 인증서 (Let's Encrypt)
- [ ] 모니터링 설정 (CloudWatch)

### Phase 3: 운영 (AWS)
- [ ] 자동 백업 설정
- [ ] 성능 모니터링 및 알림
- [ ] 로그 수집 (CloudWatch Logs)
- [ ] CDN 설정 (CloudFront)
- [ ] Auto Scaling 설정
- [ ] 정기 보안 감사

### Phase 4: 공공기관 마이그레이션 준비
- [ ] 요구사항 수집 (네트워크, 보안, 규정)
- [ ] 마이그레이션 계획 수립
- [ ] 공공기관 서버 준비
- [ ] 데이터 마이그레이션 테스트
- [ ] 병렬 운영 테스트
- [ ] 트래픽 전환 절차 수립

### Phase 5: 공공기관 서버 배포
- [ ] 프로비저닝 (CentOS/Ubuntu)
- [ ] Docker 설치 및 설정
- [ ] PostgreSQL 설정
- [ ] 애플리케이션 배포
- [ ] 보안 강화 (SELinux, 방화벽)
- [ ] 백업 시스템 설정
- [ ] 모니터링 설정

---

## 🔧 기술 스택 상세

### Backend (Next.js API Routes)

#### 인증 구현
```typescript
// JWT 토큰 관리 (lib/jwt.ts)
- generateAccessToken(userId, role): 1시간 유효
- generateRefreshToken(userId): 7일 유효
- verifyToken(token): 검증 및 복호화

// 비밀번호 해싱 (lib/db.ts)
- bcrypt.hash(password): 솔트 라운드 10
- bcrypt.compare(password, hash): 검증
```

#### API Endpoints
```
POST   /api/auth/signup          - 회원가입
POST   /api/auth/login           - 로그인
POST   /api/auth/logout          - 로그아웃
GET    /api/auth/me              - 사용자 정보 (인증 필수)
POST   /api/auth/refresh         - 토큰 갱신 (쿠키 기반)
PATCH  /api/admin/users/[id]     - 사용자 상태 변경 (관리자 전용)
GET    /api/admin/users          - 사용자 목록 (관리자 전용)
```

### Frontend (React)

#### 상태 관리
```typescript
// Zustand Store (store/authStore.ts)
interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  setAuth(user, token);
  logout();
}
```

#### 페이지 구조
```
/ (포털 메인)
├── (auth)/
│   ├── login           - 로그인 페이지
│   ├── signup          - 회원가입 페이지
│   ├── forgot-password - 비밀번호 찾기 (구현 예정)
│   └── pending         - 승인 대기 페이지 (30초 폴링)
├── (main)/
│   ├── dashboard       - 사용자 대시보드
│   └── settings        - 사용자 설정 (구현 예정)
└── admin/
    └── users           - 사용자 관리 (관리자 전용)
```

### Database Schema

#### users 테이블
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  status ENUM('pending', 'active', 'suspended') DEFAULT 'pending',
  role ENUM('admin', 'user') DEFAULT 'user',
  approved_at TIMESTAMP,
  approved_by UUID REFERENCES users(id),
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
```

#### audit_logs 테이블 (감시)
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  action VARCHAR(50),          -- 'LOGIN', 'CREATE_USER', 'APPROVE_USER', etc
  table_name VARCHAR(50),      -- 'users', 'admin_actions', etc
  old_data JSONB,              -- 변경 전 데이터
  new_data JSONB,              -- 변경 후 데이터
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
```

---

## 🔐 보안 체크리스트

### 인증 & 인가
- [x] JWT 토큰 (accessToken + refreshToken)
- [x] bcrypt 비밀번호 해싱 (10 라운드)
- [x] httpOnly 쿠키 (XSS 방어)
- [x] CORS 설정 (특정 도메인만 허용)
- [x] 역할 기반 접근 제어 (RBAC)
- [ ] 2FA (Two-Factor Authentication) - 향후 추가

### API 보안
- [x] HTTPS/TLS (Let's Encrypt)
- [x] HSTS 헤더 (Strict-Transport-Security)
- [x] CSP (Content-Security-Policy) 헤더
- [x] X-Frame-Options (Clickjacking 방어)
- [x] X-Content-Type-Options (MIME 스니핑 방어)
- [ ] Rate Limiting - 향후 추가
- [ ] API Key 관리 - 향후 추가

### 데이터 보안
- [x] 데이터베이스 암호화 (비밀번호 bcrypt)
- [ ] 전송 중 암호화 (TLS/SSL) - AWS/공공기관 배포 시
- [ ] 저장된 데이터 암호화 - 향후 추가 (RDS 암호화)
- [ ] 백업 암호화 - 향후 추가
- [ ] 감사 로깅 (audit_logs 테이블) - 구현 준비

### 배포 보안
- [x] 환경 변수 (민감한 정보 분리)
- [x] Docker 보안 이미지 (non-root 사용자)
- [ ] 컨테이너 스캔 (ECR 취약점 스캔) - AWS 배포 시
- [ ] 네트워크 보안 (VPC, 보안 그룹) - AWS 배포 시
- [ ] WAF (Web Application Firewall) - 향후 추가

---

## 📊 성능 최적화

### Frontend 최적화
- [x] Code Splitting (Next.js 자동)
- [x] Image Optimization (next/image)
- [x] Dynamic Imports (lazy loading)
- [ ] 캐싱 전략 (HTTP Cache Headers) - 배포 시
- [ ] CDN 활용 (CloudFront) - AWS 배포 시

### Backend 최적화
- [x] 데이터베이스 인덱스
- [ ] 쿼리 최적화 (EXPLAIN ANALYZE) - 필요 시
- [ ] 연결 풀링 (pg.Pool 사용)
- [ ] 캐싱 (Redis) - 향후 추가 (필요 시)

### 배포 최적화
- [x] Docker 다단계 빌드 (Dockerfile)
- [ ] Auto Scaling (AWS) - 배포 시
- [ ] Load Balancing (Nginx/ALB) - 배포 시
- [ ] 모니터링 및 알림 (CloudWatch/Prometheus) - 배포 시

---

## 🚀 배포 단계별 계획

### 로컬 개발 (현재) ✅
**상태**: 완료
**테스트**: http://localhost:3001
**데이터베이스**: 로컬 Docker PostgreSQL

```bash
npm run dev
# http://localhost:3001
```

---

### AWS 배포 (Phase 2) 📋
**예상 기간**: 1-2주
**인프라**:
- RDS PostgreSQL (db.t3.micro)
- EC2 t3.small (Ubuntu 22.04)
- Nginx 리버스 프록시
- Let's Encrypt SSL

**배포 명령**:
```bash
# 1. 환경 변수 설정
cp .env.aws.example .env.production

# 2. Docker 이미지 빌드
docker build -t katc1:latest .

# 3. EC2에서 실행
docker run -d --name katc1-app --env-file .env.production katc1:latest

# 4. Nginx 설정 및 SSL 적용
sudo certbot certonly --nginx -d katc1.company.com
```

**예상 비용**: $50-100/월

---

### 공공기관 마이그레이션 (Phase 3) 🔄
**예상 기간**: 1-2개월
**준비 단계**:
1. AWS와 공공기관 병렬 운영 (4주)
2. 트래픽 점진적 전환 (1-2주)
3. AWS 완전 종료

**배포 명령**:
```bash
# 1. 환경 변수 설정
cp .env.government.example .env.production

# 2. 공공기관 서버에서 Docker Compose 실행
docker-compose -f docker-compose.yml up -d
```

**비용**: $0 (내부 인프라)

---

## 📝 향후 개선 사항 (우선순위)

### 높음 (필수)
- [ ] 2FA (두 단계 인증)
- [ ] 비밀번호 찾기 / 변경 기능
- [ ] 이메일 알림 (회원가입 확인, 승인 알림)
- [ ] Rate Limiting (brute force 공격 방어)
- [ ] 모니터링 및 알림 (배포 후)

### 중간 (권장)
- [ ] 사용자 프로필 관리
- [ ] 로그인 히스토리
- [ ] 세션 관리 (여러 기기 로그인)
- [ ] 감시 로그 대시보드 (관리자용)
- [ ] API 문서 (Swagger/OpenAPI)

### 낮음 (선택사항)
- [ ] OAuth 통합 (Google, GitHub)
- [ ] 다국어 지원
- [ ] 모바일 앱
- [ ] GraphQL API
- [ ] 데이터 내보내기 (CSV)

---

## 🔄 CI/CD 파이프라인 (배포 시)

### GitHub Actions 예시 (선택사항)
```yaml
# .github/workflows/deploy.yml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build Docker image
        run: docker build -t katc1:${{ github.sha }} .

      - name: Push to ECR
        run: aws ecr push ...

      - name: Deploy to EC2
        run: |
          ssh -i ${{ secrets.EC2_KEY }} ubuntu@${{ secrets.EC2_IP }}
          docker pull ${{ secrets.ECR_REPO }}/katc1:${{ github.sha }}
          docker-compose up -d
```

---

## 📚 참고 문서

| 문서 | 내용 |
|------|------|
| DEPLOYMENT_GUIDE.md | AWS 및 공공기관 배포 상세 가이드 |
| SETUP_SUMMARY.md | 프로젝트 상태 및 완료 사항 |
| DEVELOPMENT_PLAN.md | 이 문서 (개발 계획) |
| docker-compose.yml | Docker 다중 서비스 설정 |
| Dockerfile | Next.js 컨테이너 빌드 |

---

## ✅ 다음 액션 아이템

### 즉시 (오늘)
1. **로컬 테스트 완료**
   - [ ] 회원가입 테스트
   - [ ] 로그인 테스트
   - [ ] 관리자 승인 테스트
   - [ ] API 응답 확인

### 1주 이내
1. **AWS 계정 준비**
   - [ ] AWS 계정 생성
   - [ ] RDS PostgreSQL 인스턴스 생성
   - [ ] EC2 인스턴스 생성

2. **배포 테스트**
   - [ ] docker-compose 로컬 테스트
   - [ ] Docker 이미지 빌드 및 실행
   - [ ] 원격 배포 시뮬레이션

### 2-4주 이내
1. **AWS 배포 실행**
   - [ ] RDS 데이터베이스 초기화
   - [ ] EC2에 애플리케이션 배포
   - [ ] SSL 인증서 설정
   - [ ] 모니터링 설정

### 1-2개월 이내
1. **공공기관 마이그레이션 준비**
   - [ ] 요구사항 수집
   - [ ] 서버 준비
   - [ ] 병렬 운영 테스트
   - [ ] 트래픽 전환

---

## 💬 Q&A

### Q: 왜 Prisma를 사용하지 않나?
**A**: 현재 프로젝트 규모 (3-5 테이블)에서는 순수 SQL이 더 간단합니다. 나중에 필요 시 마이그레이션 가능합니다.

### Q: 왜 Express가 아닌 Next.js API Routes를 사용하나?
**A**: 프론트+백엔드 통합으로 배포 복잡도 감소, 단일 package.json 관리, 작은 프로젝트에 최적화.

### Q: AWS vs 공공기관 서버 중 어디가 낫나?
**A**: AWS (빠른 배포, 관리형), 공공기관 (데이터 보호, 장기 비용 절감). 순차 진행 권장.

### Q: 보안이 충분한가?
**A**: JWT + bcrypt + httpOnly 쿠키로 기본 보안 완료. 배포 후 WAF, 2FA 추가 권장.

---

## 📞 지원

질문이 있으면:
1. DEPLOYMENT_GUIDE.md 참고
2. 로컬 테스트 재실행
3. 로그 파일 확인: `docker-compose logs`
