#!/bin/bash

# KATC1 시작 스크립트
# 데이터베이스, 백엔드, 프론트엔드를 순서대로 실행
# 기존 포트의 프로세스를 먼저 종료

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 포트 정의
FRONTEND_PORT=3000
DB_PORT=5432

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  KATC1 시스템 시작${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# ============================================
# 1. 기존 포트 프로세스 종료
# ============================================
echo -e "\n${YELLOW}[1/3] 기존 프로세스 정리${NC}"

# Next.js 포트 (3000) 확인 및 종료
if lsof -Pi :${FRONTEND_PORT} -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo -e "  ⚠️  포트 ${FRONTEND_PORT}에서 실행 중인 프로세스 발견"
  PID=$(lsof -Pi :${FRONTEND_PORT} -sTCP:LISTEN -t)
  echo -e "  🔴 PID ${PID} 종료 중..."
  kill -9 $PID 2>/dev/null || true
  sleep 1
  echo -e "  ✅ 포트 ${FRONTEND_PORT} 정리 완료"
else
  echo -e "  ✅ 포트 ${FRONTEND_PORT} 비어있음"
fi

# PostgreSQL 포트 (5432) 확인 및 종료
if lsof -Pi :${DB_PORT} -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo -e "  ⚠️  포트 ${DB_PORT}에서 실행 중인 프로세스 발견"
  PID=$(lsof -Pi :${DB_PORT} -sTCP:LISTEN -t)
  echo -e "  🔴 PID ${PID} 종료 중..."
  kill -9 $PID 2>/dev/null || true
  sleep 2
  echo -e "  ✅ 포트 ${DB_PORT} 정리 완료"
else
  echo -e "  ✅ 포트 ${DB_PORT} 비어있음"
fi

# ============================================
# 2. 데이터베이스 시작
# ============================================
echo -e "\n${YELLOW}[2/3] PostgreSQL 데이터베이스 시작${NC}"

# Docker daemon 상태 확인 및 필요시 자동 실행
if command -v docker &> /dev/null; then
  if ! docker ps &> /dev/null; then
    echo -e "  🐳 Docker daemon이 실행 중이 아닙니다. Docker Desktop 시작 중..."
    open /Applications/Docker.app 2>/dev/null || true

    # Docker daemon이 준비될 때까지 대기 (최대 30초)
    echo -e "  ⏳ Docker daemon 준비 대기..."
    for i in {1..60}; do
      if docker ps &> /dev/null; then
        echo -e "  ✅ Docker daemon 준비 완료"
        break
      fi
      sleep 0.5
    done

    if ! docker ps &> /dev/null; then
      echo -e "  ${RED}❌ Docker daemon 시작 실패${NC}"
      echo -e "  Docker Desktop을 수동으로 실행해주세요."
      exit 1
    fi
  fi
fi

# Docker 또는 로컬 PostgreSQL 선택
if command -v docker &> /dev/null && docker ps &> /dev/null; then
  echo -e "  🐳 Docker를 사용하여 PostgreSQL 시작..."

  # 기존 컨테이너 확인 및 제거
  if docker ps -a --format '{{.Names}}' | grep -q '^katc1-postgres$'; then
    echo -e "  🔴 기존 Docker 컨테이너 종료 중..."
    docker stop katc1-postgres 2>/dev/null || true
    docker rm katc1-postgres 2>/dev/null || true
    sleep 1
  fi

  # Docker에서 PostgreSQL 실행
  echo -e "  🚀 PostgreSQL Docker 컨테이너 시작 중..."
  docker run -d \
    --name katc1-postgres \
    -e POSTGRES_USER=postgres \
    -e POSTGRES_PASSWORD=postgres \
    -e POSTGRES_DB=katc1_dev \
    -p ${DB_PORT}:5432 \
    -v katc1-postgres-data:/var/lib/postgresql/data \
    postgres:15 \
    > "$HOME/.katc1/postgres.log" 2>&1

  DB_PID=$(docker inspect -f '{{.State.Pid}}' katc1-postgres 2>/dev/null)

  # PostgreSQL이 준비될 때까지 대기 (최대 20초)
  echo -e "  ⏳ PostgreSQL 준비 대기..."
  for i in {1..40}; do
    if pg_isready -h localhost -p ${DB_PORT} -U postgres >/dev/null 2>&1; then
      echo -e "  ✅ PostgreSQL 준비 완료 (Docker)"
      break
    fi
    sleep 0.5
  done

  if ! pg_isready -h localhost -p ${DB_PORT} -U postgres >/dev/null 2>&1; then
    echo -e "  ${RED}❌ PostgreSQL 시작 실패${NC}"
    echo -e "  로그 파일: $HOME/.katc1/postgres.log"
    docker logs katc1-postgres 2>&1 | tail -20 >> "$HOME/.katc1/postgres.log"
    exit 1
  fi

elif command -v postgres &> /dev/null; then
  echo -e "  🚀 로컬 PostgreSQL 시작..."

  # PostgreSQL 홈 디렉토리 확인
  if [ ! -d "$HOME/.katc1/postgres" ]; then
    echo -e "  📁 데이터베이스 디렉토리 생성 중..."
    mkdir -p "$HOME/.katc1/postgres"
  fi

  # 백그라운드에서 PostgreSQL 실행
  postgres -D "$HOME/.katc1/postgres" \
    -p ${DB_PORT} \
    -k /tmp \
    > "$HOME/.katc1/postgres.log" 2>&1 &
  DB_PID=$!

  # PostgreSQL이 준비될 때까지 대기 (최대 10초)
  echo -e "  ⏳ PostgreSQL 준비 대기..."
  for i in {1..20}; do
    if pg_isready -p ${DB_PORT} >/dev/null 2>&1; then
      echo -e "  ✅ PostgreSQL 준비 완료 (PID: ${DB_PID})"
      break
    fi
    sleep 0.5
  done

  if ! pg_isready -p ${DB_PORT} >/dev/null 2>&1; then
    echo -e "  ${RED}❌ PostgreSQL 시작 실패${NC}"
    echo -e "  로그 파일: $HOME/.katc1/postgres.log"
    exit 1
  fi

else
  echo -e "  ${RED}❌ PostgreSQL 또는 Docker 설치 필요${NC}"
  echo -e "  설치 방법:"
  echo -e "    • Docker: brew install docker"
  echo -e "    • 또는 로컬: brew install postgresql@15"
  exit 1
fi

# ============================================
# 3. Next.js 개발 서버 시작
# ============================================
echo -e "\n${YELLOW}[3/3] Next.js 개발 서버 시작${NC}"

# 프로젝트 디렉토리 확인
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

# node_modules 확인
if [ ! -d "node_modules" ]; then
  echo -e "  📦 의존성 설치 중..."
  npm install
fi

echo -e "  🚀 Next.js 개발 서버 시작 (포트 ${FRONTEND_PORT})..."
echo -e "  📝 로그 파일: $HOME/.katc1/nextjs.log"

npm run dev > "$HOME/.katc1/nextjs.log" 2>&1 &
NEXT_PID=$!

# Next.js가 준비될 때까지 대기 (최대 30초)
echo -e "  ⏳ Next.js 준비 대기..."
for i in {1..60}; do
  if curl -s http://localhost:${FRONTEND_PORT} > /dev/null 2>&1; then
    echo -e "  ✅ Next.js 준비 완료 (PID: ${NEXT_PID})"
    break
  fi
  sleep 0.5
done

# ============================================
# 시작 완료
# ============================================
echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✅ KATC1 시스템 시작 완료!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e ""
echo -e "${BLUE}📌 서비스 정보:${NC}"
echo -e "  🌐 Frontend:  http://localhost:${FRONTEND_PORT}"
echo -e "  🗄️  Database:  localhost:${DB_PORT}"
echo -e ""
echo -e "${BLUE}📝 프로세스 ID:${NC}"
echo -e "  PostgreSQL:  ${DB_PID}"
echo -e "  Next.js:     ${NEXT_PID}"
echo -e ""
echo -e "${BLUE}📂 로그 파일:${NC}"
echo -e "  PostgreSQL:  $HOME/.katc1/postgres.log"
echo -e "  Next.js:     $HOME/.katc1/nextjs.log"
echo -e ""
echo -e "${YELLOW}💡 팁:${NC}"
echo -e "  • 시스템 중지: ./stop.sh"
echo -e "  • 로그 확인:  tail -f $HOME/.katc1/nextjs.log"
echo -e "  • 포트 확인:  lsof -i :${FRONTEND_PORT}"
echo -e ""

# 프로세스 유지 (Ctrl+C로 종료)
wait
