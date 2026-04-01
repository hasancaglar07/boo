@echo off
setlocal EnableExtensions
chcp 65001 >nul

set "REPO_DIR=%~dp0"
if "%REPO_DIR:~-1%"=="\" set "REPO_DIR=%REPO_DIR:~0,-1%"

for /f "delims=" %%I in ('wsl wslpath "%REPO_DIR%" 2^>nul') do set "WSL_REPO=%%I"
if not defined WSL_REPO (
    echo WSL bulunamadi.
    set "EC=1"
    goto :finish
)

set "MODE=%~1"
if not defined MODE set "MODE=serve"

if /I "%MODE%"=="help" goto :help
if /I "%MODE%"=="-h" goto :help
if /I "%MODE%"=="--help" goto :help
if /I "%MODE%"=="serve" goto :serve
if /I "%MODE%"=="foreground" goto :foreground
if /I "%MODE%"=="start" goto :start_bg
if /I "%MODE%"=="repair" goto :repair
if /I "%MODE%"=="restart" goto :restart
if /I "%MODE%"=="logs" goto :logs
if /I "%MODE%"=="logs-live" goto :logs_live
if /I "%MODE%"=="logs-clear" goto :logs_clear
if /I "%MODE%"=="build" goto :build
if /I "%MODE%"=="stop" goto :stop

echo Bilinmeyen komut: %MODE%
goto :help

:serve
if not "%BOOK_WEB_NO_BROWSER%"=="1" start "" http://127.0.0.1:3000
echo Web arayuz foreground modda baslatiliyor. Pencereyi kapatinca sunucu durur.
wsl bash -lc "cd '%WSL_REPO%' && ./start-web.sh serve"
set "EC=%ERRORLEVEL%"
goto :finish

:foreground
if not "%BOOK_WEB_NO_BROWSER%"=="1" start "" http://127.0.0.1:3000
echo Web arayuz foreground modda baslatiliyor. Pencereyi kapatinca sunucu durur.
wsl bash -lc "cd '%WSL_REPO%' && ./start-web.sh foreground"
set "EC=%ERRORLEVEL%"
goto :finish

:start_bg
wsl bash -lc "cd '%WSL_REPO%' && ./start-web.sh start"
set "EC=%ERRORLEVEL%"
if not "%EC%"=="0" goto :finish
if not "%BOOK_WEB_NO_BROWSER%"=="1" start "" http://127.0.0.1:3000
goto :finish

:repair
echo Next.js bagimliliklari onariliyor...
wsl bash -lc "cd '%WSL_REPO%' && ./start-web.sh repair"
set "EC=%ERRORLEVEL%"
if not "%EC%"=="0" goto :finish
echo Onarim tamamlandi. Foreground modda aciliyor.
if not "%BOOK_WEB_NO_BROWSER%"=="1" start "" http://127.0.0.1:3000
wsl bash -lc "cd '%WSL_REPO%' && ./start-web.sh serve"
set "EC=%ERRORLEVEL%"
goto :finish

:restart
wsl bash -lc "cd '%WSL_REPO%' && ./start-web.sh restart"
set "EC=%ERRORLEVEL%"
if not "%EC%"=="0" goto :finish
if not "%BOOK_WEB_NO_BROWSER%"=="1" start "" http://127.0.0.1:3000
goto :finish

:logs
wsl bash -lc "cd '%WSL_REPO%' && ./start-web.sh logs"
set "EC=%ERRORLEVEL%"
goto :finish

:logs_live
echo Canli log izleme basladi. Cikmak icin Ctrl+C.
wsl bash -lc "cd '%WSL_REPO%' && ./start-web.sh logs-live"
set "EC=%ERRORLEVEL%"
goto :finish

:logs_clear
wsl bash -lc "cd '%WSL_REPO%' && ./start-web.sh logs-clear"
set "EC=%ERRORLEVEL%"
goto :finish

:build
wsl bash -lc "cd '%WSL_REPO%' && ./start-web.sh build"
set "EC=%ERRORLEVEL%"
goto :finish

:stop
wsl bash -lc "cd '%WSL_REPO%' && ./start-web.sh stop"
set "EC=%ERRORLEVEL%"
goto :finish

:help
echo Kullanim:
echo   start-web.bat            ^(varsayilan: foreground serve^)
echo   start-web.bat serve      ^(pencere acik kaldigi surece calisir^)
echo   start-web.bat start      ^(arkaplanda calisir^)
echo   start-web.bat stop
echo   start-web.bat restart
echo   start-web.bat repair     ^(bagimlilik onar + serve^)
echo   start-web.bat build
echo   start-web.bat logs
echo   start-web.bat logs-live
echo   start-web.bat logs-clear
set "EC=0"
goto :finish

:finish
if "%EC%"=="" set "EC=0"
if not "%EC%"=="0" (
    echo.
    echo Komut hata ile bitti. Kod: %EC%
    pause
)
exit /b %EC%
