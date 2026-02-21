#!/bin/bash

# 간단한 개발 서버 실행 스크립트
# Docker/DB 제어 없이 Next.js dev 서버만 실행합니다.
# 포트 3000을 정리 후 항상 3000에서 실행

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

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
