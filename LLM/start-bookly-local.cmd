@echo off
cd /d "%~dp0"
set PORT=3010
set HOSTNAME=127.0.0.1
echo Starting BOOKLY at http://127.0.0.1:%PORT%/
echo Keep this window open while testing the app.

if not exist ".next\BUILD_ID" (
  echo Building BOOKLY first...
  node node_modules\next\dist\bin\next build
)

:restart
node node_modules\next\dist\bin\next start -H %HOSTNAME% -p %PORT%
echo.
echo BOOKLY stopped. Restarting in 3 seconds...
timeout /t 3 /nobreak >nul
goto restart
