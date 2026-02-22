#!/bin/bash

# 프로덕션 서버 실행 스크립트
# - PostgreSQL Docker 컨테이너 시작 (app은 로컬에서 실행)
# - Next.js를 빌드 후 프로덕션 서버로 포트 3000에서 실행

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

# ===============================
# PostgreSQL 컨테이너 시작 (로컬 앱 실행용)
# ===============================
echo "PostgreSQL 컨테이너 시작 중..."

if [ -f "docker-compose.yml" ]; then
  # 컨테이너가 이미 존재하는지 확인
  if docker ps -a --filter "name=katc1-postgres" | grep -q katc1-postgres; then
    echo "✅ PostgreSQL 컨테이너가 이미 존재합니다. (기존 데이터 유지하며 시작)"
    docker-compose start postgres
  else
    echo "PostgreSQL 컨테이너를 생성합니다..."
    docker-compose up -d postgres
    echo "✅ PostgreSQL 컨테이너 생성 완료"
    sleep 3  # DB 초기화 시간 확보
  fi
else
  echo "⚠️  docker-compose.yml을 찾을 수 없습니다."
fi

# ===============================
# 포트 3000 정리 로직
# ===============================
echo "포트 3000 정리 중..."
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9 2>/dev/null || true
sleep 1
echo "✅ 포트 3000 정리 완료"

if [ ! -d "node_modules" ]; then
  echo "의존성이 없어 npm install을 실행합니다."
  npm install
fi

echo ""
echo "Next.js 프로덕션 빌드를 시작합니다..."
npm run build

echo ""
echo "Next.js 프로덕션 서버를 포트 3000에서 실행합니다."
echo "종료하려면 Ctrl+C를 누르세요."
echo ""

# 포트 3000 고정
PORT=3000 npm start
