@echo off
REM filepath: c:\Users\rayde\Documents\Github\wiz-light-control\scripts\service-manager.bat
REM Consolidated service management script for WizLight Control
REM Handles all service operations: install, uninstall, start, stop, status, update

setlocal enabledelayedexpansion

set SCRIPT_DIR=%~dp0
set PROJECT_ROOT=%SCRIPT_DIR%..

REM Define usage info
:usage
if "%1"=="" (
    echo WizLight Control Service Manager
    echo ==============================
    echo.
    echo Usage: service-manager.bat [command]
    echo.
    echo Commands:
    echo   install   - Install the service with enhanced shutdown handling
    echo   uninstall - Remove the service
    echo   start     - Start the service
    echo   stop      - Stop the service
    echo   status    - Show service status
    echo   update    - Update existing service with enhanced shutdown handling
    echo.
    goto :eof
)

REM Check for admin privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo This script requires administrator privileges.
    echo Please right-click and select "Run as administrator"
    pause
    exit /b 1
)

REM Process the command
set COMMAND=%1
if /i "%COMMAND%"=="install" goto :install
if /i "%COMMAND%"=="uninstall" goto :uninstall
if /i "%COMMAND%"=="start" goto :start
if /i "%COMMAND%"=="stop" goto :stop
if /i "%COMMAND%"=="status" goto :status
if /i "%COMMAND%"=="update" goto :update
echo Unknown command: %COMMAND%
echo Use 'service-manager.bat' without parameters to see available commands.
exit /b 1

:install
echo Installing WizLight Control service with enhanced shutdown handling...
echo.

REM Make sure dependencies are installed
cd /d "%PROJECT_ROOT%"
echo Ensuring all dependencies are installed...
call npm install

REM Register the direct shutdown script
cd /d "%SCRIPT_DIR%"
echo Creating direct shutdown capability...

REM Install the service
echo Installing the Windows service...
node wiz-service.js install
timeout /t 5

REM Register the shutdown task with Windows (optional but adds reliability)
echo.
echo Registering additional shutdown handler with Windows...
schtasks /Create /TN "WizLightControlShutdown" /TR "%SCRIPT_DIR%direct-shutdown.bat" /SC ONEVENT /EC System /MO "*[System[Provider[@Name='User32'] and EventID=1074]]" /F /RU SYSTEM

echo.
echo Installation complete!
echo The WizLight Control service has been installed with enhanced shutdown handling.
echo Your lights marked with turnOffOnShutdown=true will turn off during system shutdown.
echo.
goto :eof

:uninstall
echo Uninstalling WizLight Control service...
echo.

REM Stop the service first
cd /d "%SCRIPT_DIR%"
node wiz-service.js stop
timeout /t 5

REM Uninstall the service
node wiz-service.js uninstall

REM Remove the scheduled task if it exists
schtasks /Query /TN "WizLightControlShutdown" >nul 2>&1
if %errorLevel% equ 0 (
    echo Removing scheduled shutdown task...
    schtasks /Delete /TN "WizLightControlShutdown" /F
)

echo.
echo Service uninstalled successfully.
goto :eof

:start
echo Starting WizLight Control service...
cd /d "%SCRIPT_DIR%"
node wiz-service.js start
goto :eof

:stop
echo Stopping WizLight Control service...
cd /d "%SCRIPT_DIR%"
node wiz-service.js stop
goto :eof

:status
echo WizLight Control service status:
powershell -Command "Get-Service -Name 'WizLightControl' -ErrorAction SilentlyContinue | Select-Object Name, Status, StartType | Format-Table -AutoSize"
if %errorLevel% neq 0 (
    echo Service is not installed.
)
goto :eof

:update
echo Updating WizLight Control service with enhanced shutdown handling...
echo.

REM Stop the existing service
echo Stopping existing service...
cd /d "%SCRIPT_DIR%"
node wiz-service.js stop
timeout /t 5

REM Uninstall the service
echo Uninstalling service...
node wiz-service.js uninstall
timeout /t 5

REM Make sure dependencies are installed
cd /d "%PROJECT_ROOT%"
echo Ensuring all dependencies are installed...
call npm install

REM Install the service with updated settings
cd /d "%SCRIPT_DIR%"
echo Installing WizLight Control service with enhanced shutdown handling...
node wiz-service.js install

REM Register the shutdown task with Windows (optional but adds reliability)
echo.
echo Updating shutdown handler with Windows...
schtasks /Create /TN "WizLightControlShutdown" /TR "%SCRIPT_DIR%direct-shutdown.bat" /SC ONEVENT /EC System /MO "*[System[Provider[@Name='User32'] and EventID=1074]]" /F /RU SYSTEM

echo.
echo Update complete!
echo The WizLight Control service has been updated with enhanced shutdown handling.
echo Your lights marked with turnOffOnShutdown=true will turn off during system shutdown.
echo.
goto :eof
