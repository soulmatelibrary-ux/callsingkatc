#!/bin/bash

# 🚀 KATC1 로컬 개발 시작 스크립트
# SQLite + 3000 포트 자동 설정

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PORT=3000

# 함수: 헤더 출력
print_header() {
  echo -e "\n${BLUE}════════════════════════════════════════${NC}"
  echo -e "${BLUE}🛫 KATC1 유사호출부호 경고시스템${NC}"
  echo -e "${BLUE}════════════════════════════════════════${NC}\n"
}

# 함수: 포트 킬 (기존 프로세스 종료)
kill_port() {
  echo -e "\n${YELLOW}🔍 포트 $PORT 확인 중...${NC}"

  # macOS/Linux에서 포트 사용 중인 프로세스 찾기
  if lsof -i :$PORT > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  포트 $PORT이(가) 이미 사용 중입니다. 프로세스 종료 중...${NC}"

    # PID 찾아서 종료
    pid=$(lsof -ti :$PORT)
    if [ ! -z "$pid" ]; then
      kill -9 $pid 2>/dev/null || true
      echo -e "${GREEN}✓ 포트 $PORT의 프로세스 종료 완료 (PID: $pid)${NC}"
      sleep 1
    fi
  else
    echo -e "${GREEN}✓ 포트 $PORT 사용 가능${NC}"
  fi
}

# 함수: SQLite 환경 설정
setup_sqlite() {
  echo -e "\n${BLUE}📝 SQLite 환경 설정 중...${NC}"

  # .env.local 생성
  cat > .env.local << 'EOF'
# SQLite Database (로컬 개발용)
DB_PATH=./data/katc1.db

# API
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_BKEND_PROJECT_ID=

# JWT
JWT_SECRET=dev-secret-key-for-local-only

# Session
SESSION_SECRET=dev-session-secret-for-local-only
EOF

  echo -e "${GREEN}✓ .env.local 설정 완료 (SQLite)${NC}"

  # data 디렉토리 생성
  mkdir -p ./data
  echo -e "${GREEN}✓ 데이터 디렉토리 준비 완료${NC}"
}

# 함수: Next.js 개발 서버 시작
start_next_dev() {
  echo -e "\n${BLUE}📦 의존성 설치 확인 중...${NC}"

  if [ ! -d node_modules ]; then
    echo -e "${YELLOW}⏳ npm install 중...${NC}"
    npm install
  fi

  echo -e "\n${GREEN}════════════════════════════════════════${NC}"
  echo -e "${GREEN}✓ 개발 서버 시작!${NC}"
  echo -e "${GREEN}════════════════════════════════════════${NC}"
  echo -e "\n${BLUE}📍 로컬 애플리케이션:${NC}"
  echo -e "   ${BLUE}http://localhost:3000${NC}"
  echo ""
  echo -e "${YELLOW}테스트 계정:${NC}"
  echo -e "   관리자: admin@katc.com / Admin1234"
  echo -e "   사용자: kal-user@katc.com / User1234"
  echo ""
  echo -e "${YELLOW}데이터베이스:${NC}"
  echo -e "   SQLite: ./data/katc1.db"
  echo ""
  echo -e "${YELLOW}중지하려면 Ctrl+C를 누르세요${NC}\n"

  # Next.js dev 서버 시작
  npm run dev
}

# 함수: 종료 핸들러
cleanup() {
  echo -e "\n\n${YELLOW}🛑 개발 서버를 종료합니다...${NC}"
  echo -e "${GREEN}✓ 종료 완료${NC}"
  exit 0
}

# 메인 실행
main() {
  print_header

  # Ctrl+C 트래핑
  trap cleanup SIGINT SIGTERM

  # 포트 체크 및 킬
  kill_port

  # SQLite 설정
  setup_sqlite

  # Next.js 시작
  start_next_dev
}

# 스크립트 실행
main
