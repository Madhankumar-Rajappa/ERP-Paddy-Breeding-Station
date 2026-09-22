@echo off
TITLE Paddy Breeding Station GIS + ERP - Development Mode
COLOR 0B
CLS

echo ======================================================================
echo   PADDY BREEDING STATION GIS + ERP - DEVELOPMENT MODE
echo ======================================================================
echo.

cd /d "%~dp0"

cd backend
python seed.py
cd ..

echo.
echo Launching FastAPI Backend Server (Port 8000)...
start "Paddy ERP Backend" cmd /k "cd /d "%~dp0backend" && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo.
echo Launching Vite Dev Server (Port 5173)...
start "Paddy ERP Frontend Dev" cmd /k "cd /d "%~dp0frontend" && npm run dev -- --host 127.0.0.1 --port 5173"

echo.
echo Opening browser in 3 seconds...
timeout /t 3 /nobreak >nul
start http://127.0.0.1:5173

pause
