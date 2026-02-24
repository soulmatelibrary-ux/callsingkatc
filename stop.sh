#!/bin/bash

# ===============================
# Mac Stop Script (Docker Desktop)
# ===============================

FRONTEND_PORT=3000

echo "================================================"
echo "  KATC1 System Stop (Mac)"
echo "================================================"

# [1/2] Next.js 종료
echo ""
echo "[1/2] Next.js 프로세스 종료"

if lsof -Pi :${FRONTEND_PORT} -sTCP:LISTEN -t >/dev/null 2>&1; then
  PID=$(lsof -Pi :${FRONTEND_PORT} -sTCP:LISTEN -t)
  echo "  포트 ${FRONTEND_PORT}에서 PID ${PID} 종료 중..."
  kill -9 $PID 2>/dev/null || true
  sleep 1
  echo "  ✅ Next.js 중지 완료"
else
  echo "  ℹ️  포트 ${FRONTEND_PORT}에 실행 중인 프로세스 없음"
fi

# [2/2] PostgreSQL 컨테이너 종료 (Docker Desktop)
echo ""
echo "[2/2] PostgreSQL 컨테이너 종료 (Docker Desktop)"

if docker ps --format '{{.Names}}' 2>/dev/null | grep -q '^katc1-postgres$'; then
  echo "  PostgreSQL 컨테이너 중지 중..."
  docker stop katc1-postgres > /dev/null 2>&1
  echo "  ✅ PostgreSQL 중지 완료 (데이터는 Docker Volume에 보존)"
else
  echo "  ℹ️  PostgreSQL 컨테이너가 실행 중이 아님"
fi

echo ""
echo "================================================"
echo "  ✅ KATC1 System Stop Complete"
echo "================================================"
echo ""
echo "  재시작: ./start.sh"
echo ""
