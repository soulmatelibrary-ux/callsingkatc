#!/bin/bash

# 🚀 KATC1 로컬 개발 시작 스크립트
# PostgreSQL 또는 SQLite 중 선택 가능

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 함수: 헤더 출력
print_header() {
  echo -e "\n${BLUE}════════════════════════════════════════${NC}"
  echo -e "${BLUE}🛫 KATC1 유사호출부호 경고시스템${NC}"
  echo -e "${BLUE}════════════════════════════════════════${NC}\n"
}

# 함수: 데이터베이스 선택
select_database() {
  echo -e "${YELLOW}📦 데이터베이스 선택:${NC}"
  echo "  1) PostgreSQL (Docker) - 프로덕션 방식"
  echo "  2) SQLite - 가벼운 로컬 개발 (Docker 없음)"
  echo ""
  read -p "선택 (1 or 2): " db_choice

  case $db_choice in
    1)
      echo -e "\n${GREEN}✓ PostgreSQL 선택${NC}"
      start_postgres_mode
      ;;
    2)
      echo -e "\n${GREEN}✓ SQLite 선택${NC}"
      start_sqlite_mode
      ;;
    *)
      echo -e "${RED}✗ 잘못된 선택입니다.${NC}"
      exit 1
      ;;
  esac
}

# 함수: PostgreSQL 모드 시작
start_postgres_mode() {
  echo -e "\n${BLUE}📝 PostgreSQL 환경 설정 중...${NC}"

  # .env.local 확인
  if [ ! -f .env.local ]; then
    echo -e "${YELLOW}⚠️  .env.local 파일이 없습니다. 생성 중...${NC}"
    cat > .env.local << 'EOF'
# PostgreSQL Database
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USER=katc1
DB_PASSWORD=katc1_password
DB_NAME=katc1_auth

# API
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_BKEND_PROJECT_ID=

# JWT
JWT_SECRET=your-secret-key-change-in-production

# Session
SESSION_SECRET=your-session-secret-change-in-production
EOF
    echo -e "${GREEN}✓ .env.local 생성 완료${NC}"
  fi

  # Docker 상태 확인
  if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker가 설치되어 있지 않습니다.${NC}"
    echo "Docker를 설치해주세요: https://docs.docker.com/get-docker/"
    exit 1
  fi

  echo -e "\n${BLUE}🐳 Docker Compose 시작 중...${NC}"
  docker-compose down 2>/dev/null || true
  docker-compose up -d

  # PostgreSQL 준비 대기
  echo -e "${YELLOW}⏳ PostgreSQL 준비 중 (최대 30초)...${NC}"
  for i in {1..30}; do
    if docker-compose exec -T postgres pg_isready -U katc1 > /dev/null 2>&1; then
      echo -e "${GREEN}✓ PostgreSQL 준비 완료${NC}"
      break
    fi
    echo -n "."
    sleep 1
  done

  # Next.js 시작
  start_next_dev
}

# 함수: SQLite 모드 시작
start_sqlite_mode() {
  echo -e "\n${BLUE}📝 SQLite 환경 설정 중...${NC}"

  # .env.local 설정
  cat > .env.local << 'EOF'
# SQLite Database (로컬 개발용)
DB_TYPE=sqlite
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

  echo -e "\n${YELLOW}📌 SQLite 모드 실행 준비 완료${NC}"
  echo "   DB 파일: ./data/katc1.db"
  echo ""

  # Next.js 시작
  start_next_dev
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
  echo -e "${YELLOW}중지하려면 Ctrl+C를 누르세요${NC}\n"

  # Next.js dev 서버 시작
  npm run dev
}

# 함수: 종료 핸들러
cleanup() {
  echo -e "\n\n${YELLOW}🛑 개발 서버를 종료합니다...${NC}"

  # PostgreSQL 컨테이너 중지
  if [ "$db_choice" = "1" ]; then
    echo -e "${YELLOW}🐳 Docker Compose 중지 중...${NC}"
    docker-compose down 2>/dev/null || true
  fi

  echo -e "${GREEN}✓ 종료 완료${NC}"
  exit 0
}

# 메인 실행
main() {
  print_header

  # Ctrl+C 트래핑
  trap cleanup SIGINT SIGTERM

  select_database
}

# 스크립트 실행
main
