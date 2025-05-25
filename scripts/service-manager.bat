@echo off
REM filepath: c:\Users\rayde\Documents\Github\wiz-light-control\scripts\service-manager.bat
REM Consolidated service management script for WizLight Control
REM Handles all service operations: install, uninstall, start, stop, status, update

setlocal enabledelayedexpansion

set SCRIPT_DIR=%~dp0
set PROJECT_ROOT=%SCRIPT_DIR%..

REM Define usage info
:usage
if "%1"=="" (    echo WizLight Control Service Manager
    echo ==============================
    echo.
    echo This service provides a web interface for controlling Wiz lights
    echo and sets up automatic light control on system startup/shutdown.
    echo.
    echo Usage: service-manager.bat [command]
    echo.    echo Commands:
    echo   install   - Install the service and system startup/shutdown tasks
    echo   uninstall - Remove the service and system tasks
    echo   start     - Start the service
    echo   stop      - Stop the service
    echo   status    - Show service status
    echo   update    - Update existing service and system tasks
    echo   test      - Test the startup/shutdown light controls
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
if /i "%COMMAND%"=="test" goto :test
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

REM Register the system startup and shutdown handlers with Windows
echo.
echo Registering system startup and shutdown handlers with Windows...

REM Create startup task - runs when user logs on
schtasks /Create /TN "WizLightControlStartup" /TR "%SCRIPT_DIR%startup-lights.bat" /SC ONLOGON /F /RU SYSTEM

REM Create shutdown task - runs on system shutdown
schtasks /Create /TN "WizLightControlShutdown" /TR "%SCRIPT_DIR%direct-shutdown.bat" /SC ONEVENT /EC System /MO "*[System[Provider[@Name='User32'] and EventID=1074]]" /F /RU SYSTEM

REM Also create a task that runs when the system starts (before user logon) 
schtasks /Create /TN "WizLightControlSystemStartup" /TR "%SCRIPT_DIR%startup-lights.bat" /SC ONSTART /F /RU SYSTEM

echo.
echo Installation complete!
echo.
echo The WizLight Control service has been installed and will run in the background.
echo System startup/shutdown tasks have been registered to automatically:
echo   - Turn ON lights marked with 'autoTurnOnAtStartup=true' when system starts
echo   - Turn OFF lights marked with 'turnOffOnShutdown=true' when system shuts down
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

REM Remove the scheduled tasks if they exist
schtasks /Query /TN "WizLightControlShutdown" >nul 2>&1
if %errorLevel% equ 0 (
    echo Removing scheduled shutdown task...
    schtasks /Delete /TN "WizLightControlShutdown" /F
)

schtasks /Query /TN "WizLightControlStartup" >nul 2>&1
if %errorLevel% equ 0 (
    echo Removing scheduled startup task...
    schtasks /Delete /TN "WizLightControlStartup" /F
)

schtasks /Query /TN "WizLightControlSystemStartup" >nul 2>&1
if %errorLevel% equ 0 (
    echo Removing scheduled system startup task...
    schtasks /Delete /TN "WizLightControlSystemStartup" /F
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

echo.
echo Scheduled tasks status:
schtasks /query /tn "WizLightControlStartup" /fo LIST 2>nul | findstr "Task Name\|Status\|Next Run Time"
if %errorLevel% neq 0 echo WizLightControlStartup task: Not registered

schtasks /query /tn "WizLightControlShutdown" /fo LIST 2>nul | findstr "Task Name\|Status\|Next Run Time"  
if %errorLevel% neq 0 echo WizLightControlShutdown task: Not registered

schtasks /query /tn "WizLightControlSystemStartup" /fo LIST 2>nul | findstr "Task Name\|Status\|Next Run Time"
if %errorLevel% neq 0 echo WizLightControlSystemStartup task: Not registered

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

REM Register the system startup and shutdown handlers with Windows
echo.
echo Updating system startup and shutdown handlers with Windows...

REM Create startup task - runs when user logs on
schtasks /Create /TN "WizLightControlStartup" /TR "%SCRIPT_DIR%startup-lights.bat" /SC ONLOGON /F /RU SYSTEM

REM Create shutdown task - runs on system shutdown
schtasks /Create /TN "WizLightControlShutdown" /TR "%SCRIPT_DIR%direct-shutdown.bat" /SC ONEVENT /EC System /MO "*[System[Provider[@Name='User32'] and EventID=1074]]" /F /RU SYSTEM

REM Also create a task that runs when the system starts (before user logon) 
schtasks /Create /TN "WizLightControlSystemStartup" /TR "%SCRIPT_DIR%startup-lights.bat" /SC ONSTART /F /RU SYSTEM

echo.
echo Update complete!
echo.
echo The WizLight Control service has been updated and will run in the background.
echo System startup/shutdown tasks have been registered to automatically:
echo   - Turn ON lights marked with 'autoTurnOnAtStartup=true' when system starts
echo   - Turn OFF lights marked with 'turnOffOnShutdown=true' when system shuts down
echo.
goto :eof