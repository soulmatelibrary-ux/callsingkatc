#!/bin/bash

# ===============================
# Mac Production Server Startup (Docker Desktop)
# - Docker Desktop에서 PostgreSQL 컨테이너 실행
# - Next.js를 빌드 후 프로덕션 서버로 포트 3000에서 실행
# ===============================

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

# ===============================
# Docker Desktop 확인
# ===============================
echo "Docker Desktop 확인 중..."
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker Desktop이 실행되지 않았습니다."
  echo "   Docker Desktop을 먼저 실행해주세요."
  exit 1
fi
echo "✅ Docker Desktop 실행 중"

# ===============================
# 포트 3000 정리
# ===============================
echo ""
echo "포트 3000 정리 중..."
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9 2>/dev/null || true
sleep 1
echo "✅ 포트 3000 정리 완료"

# ===============================
# PostgreSQL 컨테이너 시작 (Docker Desktop)
# ===============================
echo ""
echo "PostgreSQL 컨테이너 시작 중 (Docker Desktop)..."

if docker ps -a --filter "name=katc1-postgres" --format "{{.Names}}" | grep -q katc1-postgres; then
  echo "  기존 컨테이너 시작 중... (데이터 유지)"
  docker start katc1-postgres > /dev/null 2>&1
  echo "✅ PostgreSQL 컨테이너 시작 완료"
else
  echo "  새 컨테이너 생성 중 (docker-compose)..."
  docker compose up -d postgres
  echo "✅ PostgreSQL 컨테이너 생성 완료"
  sleep 3
fi

# PostgreSQL 준비 대기
echo "PostgreSQL 준비 대기 중..."
for i in $(seq 1 15); do
  if docker exec katc1-postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo "✅ PostgreSQL 준비 완료"
    break
  fi
  if [ "$i" -eq 15 ]; then
    echo "❌ PostgreSQL 시작 실패"
    exit 1
  fi
  sleep 1
done

# ===============================
# 데이터베이스 확인
# ===============================
echo ""
echo "데이터베이스 확인 중..."

USER_COUNT=$(docker exec katc1-postgres psql -U postgres -d katc1_dev -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' ' || echo "0")

if [ "$USER_COUNT" -gt 0 ] 2>/dev/null; then
  echo "✅ 데이터베이스에 데이터 있음 (users: ${USER_COUNT}명) - init.sql 건너뜀"
else
  echo "ℹ️  데이터베이스 비어있음 - init.sql 실행 중..."
  if [ -f "scripts/init.sql" ]; then
    docker cp scripts/init.sql katc1-postgres:/tmp/init.sql
    docker exec katc1-postgres psql -U postgres -d katc1_dev -f /tmp/init.sql > /dev/null 2>&1
    echo "✅ 데이터베이스 초기화 완료"
    echo "   - Admin: lsi117@airport.co.kr / 1234"
    echo "   - Korean Air: kal@naver.com / 1234"
    echo "   - Asiana: aar@naver.com / 1234"
  else
    echo "⚠️  init.sql 파일 없음 - 건너뜀"
  fi
fi

# ===============================
# 의존성 확인
# ===============================
echo ""
if [ ! -d "node_modules" ]; then
  echo "의존성 설치 중..."
  npm install
else
  echo "✅ 의존성 설치됨"
fi

# ===============================
# Next.js 빌드 및 실행
# ===============================
echo ""
echo "Next.js 프로덕션 빌드 시작..."
npm run build

echo ""
echo "================================================"
echo "  Next.js 프로덕션 서버 실행"
echo "  http://localhost:3000"
echo "  종료: Ctrl+C"
echo "================================================"
echo ""

PORT=3000 npm start
