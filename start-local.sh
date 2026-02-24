#!/bin/bash

# KATC1 유사호출부호 경고시스템 - 로컬 데이터베이스 시작 스크립트
# 사용법: ./start-local.sh

set -e

echo "🚀 KATC1 시스템 시작 (로컬 PostgreSQL)"
echo "=================================="

# 1. 로컬 PostgreSQL 상태 확인
echo ""
echo "📍 PostgreSQL 상태 확인..."

# PostgreSQL 서비스 상태 확인
if ! pgrep -x "postgres" > /dev/null; then
    echo "❌ PostgreSQL이 실행 중이 아닙니다."
    echo ""
    echo "다음 명령어로 PostgreSQL을 시작하세요:"
    echo "  # Homebrew를 사용하는 경우:"
    echo "  brew services start postgresql@15"
    echo ""
    echo "  # 또는 수동으로:"
    echo "  postgres -D /usr/local/var/postgres"
    echo ""
    exit 1
fi

echo "✅ PostgreSQL 실행 중"

# 2. .env.local 파일 확인
echo ""
echo "📍 환경 설정 확인..."

if [ ! -f ".env.local" ]; then
    echo "❌ .env.local 파일이 없습니다."
    echo ""
    echo "다음과 같이 .env.local 파일을 생성하세요:"
    echo "---"
    cat << 'ENV'
# Database Configuration (Local PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=katc1_dev

# JWT Configuration
JWT_SECRET=katc_jwt_secret_key_2024_super_secure_key_do_not_share

# bkend.ai Configuration
NEXT_PUBLIC_BKEND_PROJECT_ID=your_project_id_here

# Gmail SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=soulmatelibrary@gmail.com
SMTP_PASSWORD=jtzbikhuzmgcxxgh
SMTP_FROM_EMAIL=soulmatelibrary@gmail.com
ENV
    echo "---"
    exit 1
fi

echo "✅ .env.local 파일 확인됨"

# 3. 데이터베이스 연결 테스트
echo ""
echo "📍 데이터베이스 연결 테스트..."

DB_HOST=$(grep "DB_HOST" .env.local | cut -d'=' -f2)
DB_PORT=$(grep "DB_PORT" .env.local | cut -d'=' -f2)
DB_USER=$(grep "DB_USER" .env.local | cut -d'=' -f2)
DB_NAME=$(grep "DB_NAME" .env.local | cut -d'=' -f2)

if PGPASSWORD=postgres psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "SELECT 1" > /dev/null 2>&1; then
    echo "✅ PostgreSQL 연결 성공"
else
    echo "❌ PostgreSQL 연결 실패"
    echo ""
    echo "다음을 확인하세요:"
    echo "  1. PostgreSQL이 실행 중인지 확인"
    echo "  2. 로컬 PostgreSQL 기본 설정:"
    echo "     - Host: localhost"
    echo "     - Port: 5432"
    echo "     - User: postgres"
    echo "     - Password: postgres"
    exit 1
fi

# 4. 데이터베이스 생성
echo ""
echo "📍 데이터베이스 생성/초기화..."

PGPASSWORD=postgres psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres << SQL
-- 기존 데이터베이스 삭제 및 재생성
DROP DATABASE IF EXISTS $DB_NAME;
CREATE DATABASE $DB_NAME;
SQL

echo "✅ 데이터베이스 생성 완료: $DB_NAME"

# 5. 데이터베이스 스키마 초기화
echo ""
echo "📍 데이터베이스 스키마 초기화..."

PGPASSWORD=postgres psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f scripts/init.sql > /dev/null 2>&1

echo "✅ 데이터베이스 스키마 초기화 완료"

# 6. Next.js 의존성 확인
echo ""
echo "📍 Node.js 의존성 확인..."

if [ ! -d "node_modules" ]; then
    echo "npm install 설치 중..."
    npm install
    echo "✅ npm 의존성 설치 완료"
else
    echo "✅ npm 의존성 이미 설치됨"
fi

# 7. Next.js 개발 서버 시작
echo ""
echo "🚀 Next.js 개발 서버 시작 중..."
echo "=================================="
echo ""
echo "✅ 시스템 준비 완료!"
echo ""
echo "🌐 접속 정보:"
echo "  Local:   http://localhost:3000"
echo "  Network: http://$(hostname -I | awk '{print $1}'):3000"
echo ""
echo "📝 로그인 계정:"
echo "  관리자: admin@katc.com / Admin1234"
echo "  사용자: kal@katc.com / 1234 (등)"
echo ""
echo "데이터베이스: PostgreSQL (Local)"
echo "=================================="
echo ""

# Next.js 개발 서버 실행
npm run dev
