#!/bin/bash

# 개발 서버 실행 스크립트
# - 도커가 실행중이지 않으면 docker-compose up -d로 실행 (DB 첫 초기화)
# - 이미 실행중이면 통과 (기존 데이터 보존)
# - Next.js dev 서버를 포트 3000에서 실행

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

# ===============================
# Docker 상태 확인 및 시작
# ===============================
echo "Docker 상태 확인 중..."

if [ -f "docker-compose.yml" ]; then
  # katc1-postgres 컨테이너가 실행중인지 확인
  if docker ps --filter "name=katc1-postgres" --filter "status=running" | grep -q katc1-postgres; then
    echo "✅ PostgreSQL 컨테이너가 이미 실행중입니다. (기존 데이터 유지)"
  else
    echo "PostgreSQL 컨테이너를 시작합니다..."
    docker-compose up -d
    echo "✅ Docker 컨테이너 시작 완료"
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
echo "Next.js 개발 서버를 포트 3000에서 실행합니다."
echo "종료하려면 Ctrl+C를 누르세요."
echo ""

# 포트 3000 고정
PORT=3000 npm run dev
