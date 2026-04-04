@echo off
setlocal EnableExtensions
chcp 65001 >nul

:: === Proje dizinini ayarla ===
set "REPO_DIR=%~dp0"
if "%REPO_DIR:~-1%"=="\" set "REPO_DIR=%REPO_DIR:~0,-1%"
set "WEB_DIR=%REPO_DIR%\web"

:: === Ayarlar ===
set "PORT=3000"

echo.
echo ============================================
echo   BOOK Web - Localhost Baslatiliyor
echo   http://localhost:%PORT%
echo ============================================
echo.

:: 0) Once eski sunucuyu durdur
echo [0] Eski sunucu durduruluyor...
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":%PORT% " ^| findstr "LISTENING"') do (
    taskkill /PID %%a /F >nul 2>&1
)
ping -n 2 127.0.0.1 >nul

:: 1) node_modules kontrolu
echo [1/4] Bagimliliklar kontrol ediliyor...
if not exist "%WEB_DIR%\node_modules" (
    echo       node_modules bulunamadi, kuruluyor...
    cd /d "%WEB_DIR%"
    call pnpm install
    if errorlevel 1 (
        echo       HATA: pnpm install basarisiz!
        pause
        exit /b 1
    )
)

:: 2) Standalone server.js kontrolu - yoksa temiz build
echo [2/4] Build kontrolu...
if not exist "%WEB_DIR%\.next\standalone\server.js" (
    echo       Standalone build bulunamadi.
    echo       Eski build temizleniyor ve yeniden build aliniyor...
    if exist "%WEB_DIR%\.next" rmdir /s /q "%WEB_DIR%\.next"
    cd /d "%WEB_DIR%"
    call pnpm build
    if errorlevel 1 (
        echo       HATA: Build basarisiz!
        pause
        exit /b 1
    )
)

:: 3) Standalone server.js hala yoksa hata ver
if not exist "%WEB_DIR%\.next\standalone\server.js" (
    echo       HATA: Build tamamlandi ama server.js olusturulamadi!
    echo       next.config.ts dosyasinda "output: standalone" oldugundan emin olun.
    pause
    exit /b 1
)

:: 4) Static dosyalari kopyala (standalone bunu otomatik yapmaz)
echo [3/4] Static dosyalar hazirlaniyor...
if not exist "%WEB_DIR%\.next\standalone\public" (
    if exist "%WEB_DIR%\public" (
        xcopy "%WEB_DIR%\public" "%WEB_DIR%\.next\standalone\public" /E /I /Q /Y >nul
    )
)
if not exist "%WEB_DIR%\.next\standalone\.next\static" (
    if exist "%WEB_DIR%\.next\static" (
        xcopy "%WEB_DIR%\.next\static" "%WEB_DIR%\.next\standalone\.next\static" /E /I /Q /Y >nul
    )
)

:: 5) Sunucuyu baslat + tarayici ac
echo [4/4] Sunucu baslatiliyor...
echo.
echo   Adres: http://localhost:%PORT%
echo   Durdurmak icin: Ctrl+C
echo.

start "" "http://localhost:%PORT%"

cd /d "%WEB_DIR%\.next\standalone"
set "PORT=%PORT%"
set "HOSTNAME=localhost"
node server.js

pause
