# KATC1 시스템 시작 가이드

## 📋 요구사항

시스템을 실행하기 전에 다음 도구들이 설치되어 있어야 합니다:

### macOS 설치 방법

```bash
# PostgreSQL 설치 (Homebrew 사용)
brew install postgresql@15

# Node.js 설치 (Homebrew 또는 nvm)
brew install node@20
```

### Linux 설치 방법

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install postgresql-15 nodejs npm

# CentOS/RHEL
sudo dnf install postgresql-server nodejs npm
```

## 🚀 빠른 시작

### 1단계: 의존성 설치

```bash
cd /Users/sein/Desktop/katc1
npm install
```

### 2단계: 데이터베이스 초기화

```bash
# PostgreSQL 시작 (필요시)
brew services start postgresql@15

# 데이터베이스 생성 및 초기화
createdb katc1_dev

# 스키마 적용
psql -U $(whoami) -d katc1_dev -f scripts/init.sql
```

### 3단계: 환경 변수 설정

```bash
# .env.local 파일 생성
cp .env.example .env.local

# 필요시 .env.local 수정
```

### 4단계: 시스템 시작

```bash
./start.sh
```

✅ 완료! 브라우저에서 http://localhost:3000 로 접속하세요.

---

## 📌 스크립트 사용법

### start.sh - 시스템 시작

전체 시스템을 한 번에 시작합니다:

```bash
./start.sh
```

**기능:**
- 기존 포트의 프로세스 자동 종료 (3000, 5432)
- PostgreSQL 데이터베이스 시작
- Next.js 개발 서버 시작 (프론트엔드 + 백엔드)
- 각 서비스의 준비 상태 확인

**출력 예시:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅ KATC1 시스템 시작 완료!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 서비스 정보:
  🌐 Frontend:  http://localhost:3000
  🗄️  Database:  localhost:5432

📝 프로세스 ID:
  PostgreSQL:  12345
  Next.js:     12346

📂 로그 파일:
  PostgreSQL:  ~/.katc1/postgres.log
  Next.js:     ~/.katc1/nextjs.log
```

### stop.sh - 시스템 중지

실행 중인 모든 프로세스를 안전하게 종료합니다:

```bash
./stop.sh
```

**기능:**
- Next.js 개발 서버 종료 (포트 3000)
- PostgreSQL 종료 (포트 5432)

---

## 🔧 포트 설정

### 기본 포트
- **Frontend (Next.js):** 3000
- **Database (PostgreSQL):** 5432

### 포트 변경하기

`.env.local` 파일에서 포트를 변경할 수 있습니다:

```bash
# .env.local
NEXT_PUBLIC_PORT=3001
DB_PORT=5433
```

**주의:** `start.sh`, `stop.sh` 파일에서도 포트 번호를 수정해야 합니다.

---

## 📝 로그 확인

### Next.js 로그 보기

```bash
# 실시간 로그
tail -f ~/.katc1/nextjs.log

# 마지막 50줄 보기
tail -50 ~/.katc1/nextjs.log

# 오류만 필터링
grep ERROR ~/.katc1/nextjs.log
```

### PostgreSQL 로그 보기

```bash
# 실시간 로그
tail -f ~/.katc1/postgres.log

# 마지막 50줄 보기
tail -50 ~/.katc1/postgres.log
```

---

## 🔍 포트 확인 및 프로세스 관리

### 포트 사용 확인

```bash
# 특정 포트가 사용 중인지 확인
lsof -i :3000
lsof -i :5432

# 모든 포트의 프로세스 보기
netstat -an | grep LISTEN
```

### 프로세스 수동 종료

```bash
# 특정 PID 종료
kill -9 <PID>

# 포트로 프로세스 찾아 종료 (macOS)
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# 포트로 프로세스 찾아 종료 (Linux)
fuser -k 3000/tcp
```

---

## 🐛 트러블슈팅

### 포트 이미 사용 중 오류

```
Error: listen EADDRINUSE :::3000
```

**해결방법:**

```bash
# 자동 해결 (start.sh 실행)
./start.sh

# 또는 수동 해결
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

### PostgreSQL 연결 오류

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**해결방법:**

```bash
# PostgreSQL 상태 확인
pg_isready -p 5432

# PostgreSQL 서비스 시작 (macOS)
brew services start postgresql@15

# 또는 start.sh로 전체 시스템 재시작
./stop.sh
./start.sh
```

### Node.js 모듈 오류

```
Error: Cannot find module '@tanstack/react-query'
```

**해결방법:**

```bash
# 의존성 재설치
npm install

# 캐시 정리 후 재설치
npm cache clean --force
npm install
```

### 데이터베이스 초기화 필요

```bash
# 기존 데이터베이스 제거
dropdb katc1_dev

# 새 데이터베이스 생성
createdb katc1_dev

# 스키마 재적용
psql -U $(whoami) -d katc1_dev -f scripts/init.sql
```

---

## 💻 개발 워크플로우

### 전형적인 개발 세션

```bash
# 1. 시스템 시작
./start.sh

# 2. 브라우저에서 작업
# http://localhost:3000

# 3. 코드 수정 (자동 핫 리로드)
# src/ 파일 수정

# 4. 로그 확인 (필요시)
tail -f ~/.katc1/nextjs.log

# 5. 개발 완료 후 종료
./stop.sh
```

### 데이터베이스 쿼리 테스트

```bash
# PostgreSQL 접속
psql -U $(whoami) -d katc1_dev

# SQL 쿼리 실행
SELECT * FROM users;
SELECT * FROM airlines;

# 종료
\q
```

---

## 📊 시스템 정보

### 기본 로그인 계정

**관리자 계정:**
- 이메일: admin@katc1.com
- 비밀번호: Admin@12345

**테스트 계정:**
- 이메일: user@katc1.com
- 비밀번호: User@12345

> **주의:** 첫 로그인 시 비밀번호 변경을 요구합니다.

### API 엔드포인트

```
인증:
- POST   /api/auth/login           - 로그인
- POST   /api/auth/logout          - 로그아웃
- GET    /api/auth/me              - 현재 사용자 정보
- POST   /api/auth/refresh         - 토큰 갱신
- POST   /api/auth/change-password - 비밀번호 변경

관리자:
- GET    /api/admin/users          - 사용자 목록
- POST   /api/admin/users          - 사용자 생성
- PATCH  /api/admin/users/[id]     - 사용자 상태 변경
```

---

## 🔐 환경 변수

### .env.local 예시

```bash
# 데이터베이스
NEXT_PUBLIC_DB_URL=postgres://localhost:5432/katc1_dev

# API 설정
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_APP_NAME=KATC 유사호출부호 경고시스템

# JWT 시크릿 (production에서는 강한 값 사용)
JWT_SECRET=your_secret_key_here_change_in_production
JWT_REFRESH_SECRET=your_refresh_secret_here

# Node 환경
NODE_ENV=development
```

---

## 📚 유용한 명령어

```bash
# 데이터베이스 백업
pg_dump katc1_dev > backup_$(date +%Y%m%d_%H%M%S).sql

# 데이터베이스 복원
psql katc1_dev < backup_20240219_123456.sql

# npm 의존성 업데이트
npm update

# TypeScript 컴파일 확인
npm run build

# 포맷팅
npm run format

# 린트 확인
npm run lint
```

---

## 🆘 지원

문제가 발생하면:

1. 로그 파일 확인: `tail -f ~/.katc1/nextjs.log`
2. 포트 확인: `lsof -i :3000`
3. 전체 시스템 재시작: `./stop.sh && ./start.sh`
4. 데이터베이스 재초기화 (필요시)

---

마지막 업데이트: 2026-02-19
