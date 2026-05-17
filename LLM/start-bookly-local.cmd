@echo off
cd /d "%~dp0"
set PORT=3010
set HOSTNAME=127.0.0.1
echo Starting BOOKLY at http://127.0.0.1:%PORT%/
echo Keep this window open while testing the app.
node node_modules\next\dist\bin\next start -H %HOSTNAME% -p %PORT%
pause
