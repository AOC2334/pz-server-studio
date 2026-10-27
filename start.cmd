@echo off
cd /d "%~dp0"
if not exist "node_modules\.bin\electron.cmd" (
 echo Please run npm ci once, or use the packaged desktop EXE.
 pause
 exit /b 1
)
call npm.cmd start
