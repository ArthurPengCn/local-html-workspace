@echo off
setlocal
cd /d "%~dp0"

rem ---- Locate Node.js (auto-detect, no personal paths) ----
set "NODE="
for /d %%d in ("%USERPROFILE%\.workbuddy\binaries\node\versions\*") do (
  if exist "%%d\node.exe" set "NODE=%%d\node.exe"
)
if not defined NODE if exist "%ProgramFiles%\nodejs\node.exe" set "NODE=%ProgramFiles%\nodejs\node.exe"
if not defined NODE (
  for /f "delims=" %%i in ('where node 2^>nul') do set "NODE=%%i"
)
if not defined NODE (
  echo [ERROR] Node.js 18+ not found.
  echo Install from https://nodejs.org
  pause
  exit /b 1
)

echo Starting workspace...
echo Node: %NODE%
"%NODE%" launcher.js

echo.
echo Service stopped.
pause
