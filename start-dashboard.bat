@echo off
setlocal EnableExtensions
chcp 65001 >nul

set "REPO_DIR=%~dp0"
if "%REPO_DIR:~-1%"=="\" set "REPO_DIR=%REPO_DIR:~0,-1%"

for /f "delims=" %%I in ('wsl wslpath "%REPO_DIR%" 2^>nul') do set "WSL_REPO=%%I"
if not defined WSL_REPO (
    echo WSL bulunamadi.
    exit /b 1
)

wsl bash -lc "cd '%WSL_REPO%' && ./start-dashboard.sh"
if errorlevel 1 exit /b 1
if /I "%BOOK_DASHBOARD_NO_BROWSER%"=="1" exit /b 0
start "" http://127.0.0.1:8765
