@echo off
title Mitior OS Desktop Launcher
echo =======================================================================
echo          MITIOR OS - PROFESSIONAL OFFLINE DESKTOP LAUNCHER
echo =======================================================================
echo.
echo [1/3] Verifying runtime dependencies...

:: Check if Node.js is installed
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in your PATH.
    echo.
    echo To run this application locally with a simple double click:
    echo 1. Download and run the Node.js installer: https://nodejs.org/
    echo 2. Run this "launch.bat" script again.
    echo.
    echo Press any key to open the Node.js download page and exit...
    pause >nul
    start "" https://nodejs.org/
    exit /b
)

echo [OK] Node.js runtime detected.

:: Check if node_modules exists
if not exist "node_modules\" (
    echo.
    echo [2/3] Installing dependencies (this only happens on the first run)...
    call npm install
) else (
    echo [OK] Local dependencies already present.
)

:: Run production build if dist directory not found
if not exist "dist\" (
    echo.
    echo [3/3] Building native production assets...
    call npm run build
)

echo.
echo =======================================================================
echo     SUCCESS: Mitior OS is starting on port 3000 in Desktop Mode!
echo =======================================================================
echo.

:: Launch the app in a dedicated Chrome/Edge app window for a true desktop application feel
where chrome >nul 2>&1
if %errorlevel% eq 0 (
    start "" chrome --app="http://localhost:3000" --user-data-dir="%temp%/mitior-os-profile" --new-window
) else (
    where msedge >nul 2>&1
    if %errorlevel% eq 0 (
        start "" msedge --app="http://localhost:3000" --new-window
    ) else (
        echo Chrome/Edge not found, launching in default browser...
        start "" "http://localhost:3000"
    )
)

:: Start the local preview server
call npm run start

pause
