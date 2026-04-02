@echo off
setlocal EnableExtensions
chcp 65001 >nul

set "REPO_DIR=%~dp0"
if "%REPO_DIR:~-1%"=="\" set "REPO_DIR=%REPO_DIR:~0,-1%"

for /f "delims=" %%I in ('wsl wslpath "%REPO_DIR%" 2^>nul') do set "WSL_REPO=%%I"
if not defined WSL_REPO (
    echo WSL bulunamadi ya da yol cevrilemedi.
    echo Once WSL/Ubuntu kurulu oldugundan emin ol.
    exit /b 1
)

set "BOOK_REL=book_outputs/ornek-kitap"
set "BOOK_WIN=%REPO_DIR%\book_outputs\ornek-kitap"
set "BOOK_WSL=%WSL_REPO%/%BOOK_REL%"

if /I "%~1"=="sample" goto SAMPLE
if /I "%~1"=="epub" goto EPUB
if /I "%~1"=="pdf" goto PDF
if /I "%~1"=="demo" goto DEMO
if /I "%~1"=="open" goto OPEN
if /I "%~1"=="ui" goto UI
if /I "%~1"=="web" goto WEB
if /I "%~1"=="help" goto HELP
if not "%~1"=="" goto HELP

:MENU
cls
echo =======================================
echo   Book Generator - Windows Kolay Menu
echo =======================================
echo.
echo 1. Ornek kitap dosyalarini olustur
echo 2. Ornek EPUB uret
echo 3. Ornek PDF uret
echo 4. Demo calistir
echo 5. Cikti klasorunu ac
echo 6. Eski dashboardu ac
echo 7. Yeni web arayuzunu ac
echo 8. Cikis
echo.
set /p CHOICE=Secim yap: 
if "%CHOICE%"=="1" goto SAMPLE
if "%CHOICE%"=="2" goto EPUB
if "%CHOICE%"=="3" goto PDF
if "%CHOICE%"=="4" goto DEMO
if "%CHOICE%"=="5" goto OPEN
if "%CHOICE%"=="6" goto UI
if "%CHOICE%"=="7" goto WEB
if "%CHOICE%"=="8" exit /b 0
goto MENU

:ASK_AUTHOR
set "AUTHOR=%~2"
if defined AUTHOR goto :eof
set "AUTHOR=Ihsan"
set /p AUTHOR=Yazar adi [Ihsan]: 
if not defined AUTHOR set "AUTHOR=Ihsan"
set "AUTHOR=%AUTHOR:'=%"
goto :eof

:SAMPLE
echo.
echo Ornek kitap klasoru hazirlaniyor...
wsl bash -lc "cd '%WSL_REPO%' && ./create_sample_book.sh '%BOOK_WSL%'"
if errorlevel 1 exit /b 1
echo Hazir: %BOOK_WIN%
echo.
pause
if "%~1"=="" goto MENU
exit /b 0

:EPUB
call :ASK_AUTHOR %*
if not exist "%BOOK_WIN%" call "%~f0" sample
echo.
echo EPUB uretiliyor...
wsl bash -lc "cd '%WSL_REPO%' && ./compile_book.sh '%BOOK_WSL%' epub 3 --author '%AUTHOR%' --generate-cover"
if errorlevel 1 exit /b 1
echo.
echo Tamam. Cikti klasoru: %BOOK_WIN%
if "%~1"=="" explorer "%BOOK_WIN%"
if "%~1"=="" pause
if "%~1"=="" goto MENU
exit /b 0

:PDF
call :ASK_AUTHOR %*
if not exist "%BOOK_WIN%" call "%~f0" sample
echo.
echo PDF uretiliyor...
wsl bash -lc "cd '%WSL_REPO%' && ./compile_book.sh '%BOOK_WSL%' pdf 3 --author '%AUTHOR%' --generate-cover"
if errorlevel 1 exit /b 1
echo.
echo Tamam. Cikti klasoru: %BOOK_WIN%
if "%~1"=="" explorer "%BOOK_WIN%"
if "%~1"=="" pause
if "%~1"=="" goto MENU
exit /b 0

:DEMO
echo.
echo Demo calisiyor...
wsl bash -lc "cd '%WSL_REPO%' && ./demo.sh"
if errorlevel 1 exit /b 1
if "%~1"=="" pause
if "%~1"=="" goto MENU
exit /b 0

:OPEN
if not exist "%BOOK_WIN%" (
    echo Once ornek kitap klasorunu olusturuyorum...
    call "%~f0" sample
)
explorer "%BOOK_WIN%"
if "%~1"=="" goto MENU
exit /b 0

:UI
call "%REPO_DIR%\start-dashboard.bat"
if "%~1"=="" goto MENU
exit /b 0

:WEB
call "%REPO_DIR%\start-web.bat" reset
if "%~1"=="" goto MENU
exit /b 0

:HELP
echo.
echo Kullanim:
echo   book-generator.bat
echo   book-generator.bat sample
echo   book-generator.bat epub "Yazar Adi"
echo   book-generator.bat pdf "Yazar Adi"
echo   book-generator.bat demo
echo   book-generator.bat open
echo   book-generator.bat ui
echo   book-generator.bat web
exit /b 1
