@echo off
cd /d "%~dp0"
echo Installing SportEase packages... this can take a few minutes.
call npm install
if errorlevel 1 (
  echo.
  echo npm install failed. Copy the error above.
  pause
  exit /b 1
)
echo.
echo Starting SportEase...
call npm run dev
pause
