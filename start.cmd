@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
 echo Please install Node.js 24.5 or newer.
 pause
 exit /b 1
)
node -e "const v=process.versions.node.split('.').map(Number);process.exit(v[0]>24||(v[0]===24&&v[1]>=5)?0:1)"
if errorlevel 1 (
 echo Node.js 24.5 or newer is required for Steam network proxy support.
 pause
 exit /b 1
)
node --use-env-proxy server.js --open
pause
