@echo off
TITLE Paddy Breeding Station GIS + ERP System
COLOR 0A
CLS

echo ======================================================================
echo    PADDY BREEDING STATION GIS + ERP SYSTEM (E4A PROTOTYPE)
echo ======================================================================
echo.
echo  [1/4] Checking Python and Node.js environment...
echo.

cd /d "%~dp0"

python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python is not found in PATH. Please install Python 3.10+.
    pause
    exit /b 1
)

call npm --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js / npm is not found in PATH. Please install Node.js.
    pause
    exit /b 1
)

echo  [2/4] Seeding Database with Plot E4A & Demo Varieties...
cd backend
python seed.py
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Seed script encountered a notice or table already seeded.
)
cd ..

if not exist "%~dp0frontend\dist" (
    echo.
    echo Building frontend production assets for preview...
    cd "%~dp0frontend"
    call npm run build
    cd /d "%~dp0"
)

echo.
echo  [3/4] Launching FastAPI Backend Server (Port 8000)...
start "Paddy ERP Backend Server (Port 8000)" cmd /k "cd /d "%~dp0backend" && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000"

echo.
echo  [4/4] Launching React Vite Frontend Application (Port 4173)...
start "Paddy ERP Frontend Web App (Port 4173)" cmd /k "cd /d "%~dp0frontend" && npm run preview -- --host 127.0.0.1 --port 4173"

echo.
echo ======================================================================
echo   SUCCESS! Paddy Breeding Station GIS + ERP System is starting...
echo ======================================================================
echo.
echo   Frontend Application : http://127.0.0.1:4173
echo   Backend API Server   : http://127.0.0.1:8000
echo   Swagger Documentation: http://127.0.0.1:8000/docs
echo.
echo   DEMO CREDENTIALS:
echo   -----------------
echo   Researcher (Default) : researcher / researcher123
echo   Administrator        : admin      / admin123
echo   Field Staff          : fieldstaff / field123
echo.
echo   Opening browser in 3 seconds...
timeout /t 3 /nobreak >nul
start http://127.0.0.1:4173

echo.
echo   Keep the backend and frontend command windows open while using the app.
echo ======================================================================
pause
