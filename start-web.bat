@echo off
setlocal EnableExtensions
chcp 65001 >nul
set "MODE=%~1"
if not defined MODE set "MODE=dev"
if /I "%MODE%"=="fast" set "MODE=dev-fast"
if /I "%MODE%"=="dev-fast" (
  if not defined BOOK_SKIP_DASHBOARD set "BOOK_SKIP_DASHBOARD=1"
  if not defined BOOK_WEB_SKIP_CHECKS set "BOOK_WEB_SKIP_CHECKS=1"
)
powershell -NoLogo -NoExit -ExecutionPolicy Bypass -File "%~dp0start-web.ps1" %MODE%
