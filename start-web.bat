@echo off
setlocal EnableExtensions
chcp 65001 >nul

set "REPO_DIR=%~dp0"
if "%REPO_DIR:~-1%"=="\" set "REPO_DIR=%REPO_DIR:~0,-1%"

for /f "delims=" %%I in ('wsl wslpath "%REPO_DIR%" 2^>nul') do set "WSL_REPO=%%I"
if not defined WSL_REPO (
    echo WSL bulunamadi ya da yol cevrilemedi.
    echo Windows tarafinda Linux node_modules/native binding uyumsuzlugu oldugu icin web bu script ile WSL uzerinden acilir.
    exit /b 1
)

set "MODE=%~1"
if not defined MODE set "MODE=dev"

set "HOST=127.0.0.1"
set "PORT=3000"
set "DASHBOARD_PORT=8765"

if /I "%MODE%"=="help" goto HELP
if /I "%MODE%"=="-h" goto HELP
if /I "%MODE%"=="--help" goto HELP
if /I "%MODE%"=="stop" goto STOP
if /I "%MODE%"=="logs" goto LOGS
if /I "%MODE%"=="logs-live" goto LOGS_LIVE
if /I "%MODE%"=="prod" goto PROD
if /I "%MODE%"=="start" goto PROD
if /I "%MODE%"=="reset" goto RESET
if /I "%MODE%"=="dev" goto DEV

echo Gecersiz mod: %MODE%
goto HELP

:PRINT_HEADER
echo.
echo ============================================
echo   BOOK Web - Localhost Baslatiliyor
echo   http://localhost:%PORT%
echo ============================================
echo.
exit /b 0

:ENSURE_DASHBOARD
wsl bash -lc "cd '%WSL_REPO%' && ./start-dashboard.sh start >/dev/null 2>&1 || true"
if errorlevel 1 (
    echo Dashboard baslatilamadi.
    exit /b 1
)
exit /b 0

:DEV
call :PRINT_HEADER
call :ENSURE_DASHBOARD
if errorlevel 1 exit /b 1

echo [mode] dev (hizli local test)
echo [info] Durdurmak icin Ctrl+C
echo.

start "" "http://localhost:%PORT%"
wsl bash -lc "cd '%WSL_REPO%/web' && PATH='%WSL_REPO%/.tools/node-current/bin:$PATH' && if [ ! -d node_modules ] || [ ! -f node_modules/next/dist/bin/next ]; then CI=true corepack pnpm install --frozen-lockfile --config.confirmModulesPurge=false; fi && CI=true corepack pnpm dev --hostname %HOST% --port %PORT%"
exit /b %errorlevel%

:PROD
call :PRINT_HEADER
call :ENSURE_DASHBOARD
if errorlevel 1 exit /b 1

echo [mode] prod (next start / standalone)
echo.

start "" "http://localhost:%PORT%"
wsl bash -lc "cd '%WSL_REPO%' && BOOK_WEB_HOST=%HOST% BOOK_WEB_PORT=%PORT% ./start-web.sh start"
exit /b %errorlevel%

:RESET
call :PRINT_HEADER
call :ENSURE_DASHBOARD
if errorlevel 1 exit /b 1

echo [mode] reset (eski sureci kapat, foreground calistir)
echo.

start "" "http://localhost:%PORT%"
wsl bash -lc "cd '%WSL_REPO%' && BOOK_WEB_HOST=%HOST% BOOK_WEB_PORT=%PORT% ./start-web.sh reset"
exit /b %errorlevel%

:STOP
echo Web ve dashboard durduruluyor...
wsl bash -lc "cd '%WSL_REPO%' && ./start-web.sh stop >/dev/null 2>&1 || true && ./start-dashboard.sh stop >/dev/null 2>&1 || true"
echo Durduruldu.
exit /b 0

:LOGS
wsl bash -lc "cd '%WSL_REPO%' && ./start-web.sh logs"
exit /b %errorlevel%

:LOGS_LIVE
wsl bash -lc "cd '%WSL_REPO%' && ./start-web.sh logs-live"
exit /b %errorlevel%

:HELP
echo.
echo Kullanim:
echo   start-web.bat                 ^(varsayilan: dev^)
echo   start-web.bat dev             ^(hizli local test, onerilen^)
echo   start-web.bat prod            ^(production benzeri start^)
echo   start-web.bat reset           ^(foreground reset^)
echo   start-web.bat stop            ^(web+dashboard durdur^)
echo   start-web.bat logs
echo   start-web.bat logs-live
echo.
exit /b 1
