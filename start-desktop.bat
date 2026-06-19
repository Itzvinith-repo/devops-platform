@echo off
title DevOps Platform - Desktop App
color 0B
echo.
echo  ====================================================
echo    DevOps Platform - Desktop Application Launcher
echo  ====================================================
echo.

:: Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo  [ERROR] Node.js is not installed or not in PATH.
    echo  Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

:: Check if Python is installed
where python >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo  [ERROR] Python is not installed or not in PATH.
    echo  Please install Python from https://python.org
    pause
    exit /b 1
)

echo  [1/3] Checking dependencies...

:: Install frontend dependencies if needed
cd /d "%~dp0frontend"
if not exist "node_modules" (
    echo  [1/3] Installing frontend dependencies...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo  [ERROR] Failed to install frontend dependencies.
        pause
        exit /b 1
    )
)

:: Install backend dependencies if needed
cd /d "%~dp0backend"
if not exist "venv" (
    echo  [1/3] Setting up Python virtual environment...
    python -m venv venv
    call venv\Scripts\activate.bat
    pip install -r requirements.txt
) else (
    call venv\Scripts\activate.bat
)

echo  [2/3] Starting application...
echo.

:: Go to frontend directory and launch Electron
cd /d "%~dp0frontend"

echo  [3/3] Launching DevOps Platform Desktop...
echo.
echo  The application window will open shortly.
echo  Close this window to stop the application.
echo.

:: Run Electron in dev mode (Vite + Electron concurrently)
call npm run electron:dev

:: Cleanup on exit
echo.
echo  Application closed. Goodbye!
timeout /t 2 >nul
