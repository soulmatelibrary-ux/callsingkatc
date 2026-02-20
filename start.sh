#!/bin/bash

# 간단한 개발 서버 실행 스크립트
# Docker/DB 제어 없이 Next.js dev 서버만 실행합니다.

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

if [ ! -d "node_modules" ]; then
  echo "의존성이 없어 npm install을 실행합니다."
  npm install
fi

echo "Next.js 개발 서버를 npm run dev로 실행합니다."
echo "종료하려면 Ctrl+C를 누르세요."

npm run dev
