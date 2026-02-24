@echo off
chcp 65001 >nul
REM ===============================
REM Windows Production Server Startup (WSL Docker Engine)
REM - Docker Engine을 WSL에서 실행
REM - DB가 이미 초기화되어 있으면 init.sql 실행 안함
REM - Docker Volume으로 데이터 영속성 보장
REM ===============================

cd /d "%~dp0"

echo ===============================
echo Docker Engine Start (WSL)
echo ===============================
wsl -d Ubuntu -u root -- service docker start >nul 2>&1
timeout /t 3 /nobreak >nul
echo [OK] Docker Engine started

REM WSL keep-alive: WSL idle 종료 방지 (백그라운드 프로세스)
start /b wsl -d Ubuntu -- bash -c "while true; do sleep 30; done" >nul 2>&1
echo [OK] WSL keep-alive started

echo.
echo ===============================
echo Port 3000 cleanup
echo ===============================
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr :3000 ^| findstr LISTENING') do (
    echo Killing PID %%a...
    taskkill /PID %%a /F >nul 2>&1
)
timeout /t 1 /nobreak >nul
echo [OK] Port 3000 cleanup complete

echo.
echo ===============================
echo PostgreSQL Container (WSL Docker Engine)
echo ===============================

REM docker-compose.yml 경로를 WSL 형식으로 변환하여 실행
set "WIN_PATH=%~dp0"
REM Start existing container or create new one via docker-compose
wsl -d Ubuntu -- docker ps -a --filter "name=katc1-postgres" --format "{{.Names}}" 2>nul | findstr "katc1-postgres" >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Starting existing PostgreSQL container...
    wsl -d Ubuntu -- docker start katc1-postgres >nul 2>&1
    echo [OK] PostgreSQL container started (existing data preserved)
) else (
    echo [INFO] Creating new PostgreSQL container...
    wsl -d Ubuntu -- docker run -d ^
        --name katc1-postgres ^
        --restart=unless-stopped ^
        -e POSTGRES_USER=postgres ^
        -e POSTGRES_PASSWORD=postgres ^
        -e POSTGRES_DB=katc1_dev ^
        -p 5432:5432 ^
        -v similar-callsign_postgres_data:/var/lib/postgresql/data ^
        postgres:15-alpine
    echo [OK] PostgreSQL container created
    set NEED_INIT=1
)

echo Waiting for PostgreSQL to be ready...
timeout /t 5 /nobreak >nul

REM Verify PostgreSQL is running
wsl -d Ubuntu -- docker ps --filter "name=katc1-postgres" --filter "status=running" -q 2>nul | findstr /r "." >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] PostgreSQL is running
) else (
    echo [ERROR] PostgreSQL failed to start
    pause
    exit /b 1
)

echo.
echo ===============================
echo Database Check
echo ===============================

REM Check if users table has data (DB already initialized)
wsl -d Ubuntu -- docker exec katc1-postgres psql -U postgres -d katc1_dev -t -c "SELECT COUNT(*) FROM users;" 2>nul | findstr /r "[1-9]" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Database already has data - skipping init.sql
    echo     Existing data will be preserved
) else (
    echo [INFO] Database is empty - running init.sql...
    if exist "scripts\init.sql" (
        wsl -d Ubuntu -- docker cp "/mnt/c/Users/Administrator/Desktop/similar callsign/similar-callsign/scripts/init.sql" katc1-postgres:/tmp/init.sql 2>nul
        wsl -d Ubuntu -- docker exec katc1-postgres psql -U postgres -d katc1_dev -f /tmp/init.sql >nul 2>&1
        echo [OK] Database initialized
        echo     - Admin: lsi117@airport.co.kr / 1234
        echo     - Korean Air: kal@naver.com / 1234
        echo     - Asiana: aar@naver.com / 1234
    ) else (
        echo [SKIP] init.sql not found
    )
)

echo.
echo ===============================
echo Dependencies Check
echo ===============================
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
) else (
    echo [OK] Dependencies already installed
)

echo.
echo ===============================
echo Building Next.js
echo ===============================
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Build failed
    pause
    exit /b 1
)

echo.
echo ===============================
echo Starting Production Server
echo ===============================
echo Server running on http://localhost:3000
echo Press Ctrl+C to stop
echo.

set PORT=3000
call npm start
