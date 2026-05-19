@echo off
cd /d "%~dp0"

set PORT=3038
set HOSTNAME=127.0.0.1

echo.
echo Building the newest BOOKLY version...
node node_modules\next\dist\bin\next build

echo.
echo Starting BOOKLY at http://127.0.0.1:%PORT%/
echo Keep this window open while testing the app.
echo If the port is busy, close the old BOOKLY server window and run this file again.
echo.

:restart
node node_modules\next\dist\bin\next start -H %HOSTNAME% -p %PORT%
echo.
echo BOOKLY stopped. Restarting in 3 seconds...
timeout /t 3 /nobreak >nul
goto restart
