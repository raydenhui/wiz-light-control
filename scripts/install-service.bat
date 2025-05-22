@echo off
setlocal

REM WizLight Control Service One-Click Installer
REM This script will install the WizLight Control service

echo WizLight Control Service - One-Click Installer
echo ==============================================
echo.

REM Check for admin privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo This script requires administrator privileges.
    echo Please right-click and select "Run as administrator"
    pause
    exit /b 1
)

set SCRIPT_DIR=%~dp0
set PROJECT_ROOT=%SCRIPT_DIR%..

REM Make sure dependencies are installed
cd /d "%PROJECT_ROOT%"
echo Ensuring all dependencies are installed...
call npm install

REM Install the service
cd /d "%SCRIPT_DIR%"
echo Installing WizLight Control service...
node wiz-service.js install

echo.
echo Installation complete!
echo The WizLight Control service is now installed and running.
echo It will start automatically when Windows starts and shut down gracefully when Windows shuts down.
echo.
echo You can manage the service using:
echo   - scripts\wiz-service.bat [start|stop|status]
echo   - Services.msc (Windows Services)
echo.

pause
endlocal
