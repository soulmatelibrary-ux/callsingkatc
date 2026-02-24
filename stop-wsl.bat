@echo off
chcp 65001 >nul
REM ===============================
REM Windows Stop Script (WSL Docker Engine)
REM ===============================

cd /d "%~dp0"

echo ===============================
echo KATC1 System Stop (Windows)
echo ===============================

echo.
echo [1/2] Next.js process cleanup
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr :3000 ^| findstr LISTENING') do (
    echo   Killing PID %%a...
    taskkill /PID %%a /F >nul 2>&1
)
echo [OK] Next.js stopped

echo.
echo [2/2] PostgreSQL container stop (WSL)
wsl -d Ubuntu -- docker stop katc1-postgres >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] PostgreSQL stopped (data preserved in Docker volume)
) else (
    echo [INFO] PostgreSQL was not running
)

echo.
echo ===============================
echo KATC1 System Stop Complete
echo ===============================
echo.
echo Tip: Restart with start-wsl.bat
echo.
pause
