@echo off
setlocal EnableExtensions
chcp 65001 >nul
set "MODE=%~1"
if not defined MODE set "MODE=dev"
powershell -NoLogo -NoExit -ExecutionPolicy Bypass -File "%~dp0start-web.ps1" %MODE%
