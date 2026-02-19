#!/bin/bash

# KATC1 중지 스크립트
# 데이터베이스, 백엔드, 프론트엔드를 종료

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
echo -e "${BLUE}  KATC1 시스템 중지${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# ============================================
# 1. Next.js 포트 (3000) 종료
# ============================================
echo -e "\n${YELLOW}[1/2] Next.js 프로세스 종료${NC}"

if lsof -Pi :${FRONTEND_PORT} -sTCP:LISTEN -t >/dev/null 2>&1; then
  PID=$(lsof -Pi :${FRONTEND_PORT} -sTCP:LISTEN -t)
  echo -e "  🔴 포트 ${FRONTEND_PORT}에서 PID ${PID} 종료 중..."
  kill -9 $PID 2>/dev/null || true
  sleep 1
  echo -e "  ✅ Next.js 중지 완료"
else
  echo -e "  ℹ️  포트 ${FRONTEND_PORT}에 실행 중인 프로세스 없음"
fi

# ============================================
# 2. PostgreSQL 프로세스/컨테이너 종료
# ============================================
echo -e "\n${YELLOW}[2/2] PostgreSQL 프로세스 종료${NC}"

# Docker 컨테이너 확인
if command -v docker &> /dev/null && docker ps --format '{{.Names}}' 2>/dev/null | grep -q '^katc1-postgres$'; then
  echo -e "  🐳 Docker PostgreSQL 컨테이너 중지 중..."
  docker stop katc1-postgres 2>/dev/null || true
  sleep 1
  echo -e "  ✅ PostgreSQL 중지 완료 (Docker)"
elif lsof -Pi :${DB_PORT} -sTCP:LISTEN -t >/dev/null 2>&1; then
  PID=$(lsof -Pi :${DB_PORT} -sTCP:LISTEN -t)
  echo -e "  🔴 포트 ${DB_PORT}에서 PID ${PID} 종료 중..."
  kill -9 $PID 2>/dev/null || true
  sleep 1
  echo -e "  ✅ PostgreSQL 중지 완료"
else
  echo -e "  ℹ️  포트 ${DB_PORT}에 실행 중인 프로세스 없음"
fi

# ============================================
# 완료
# ============================================
echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✅ KATC1 시스템 중지 완료!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e ""
echo -e "${BLUE}💡 팁:${NC}"
echo -e "  • 시스템 재시작: ./start.sh"
echo -e ""
