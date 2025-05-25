@echo off
REM Direct shutdown script for WizLight Control lights
REM This script directly executes the shutdown.js file to reliably turn off lights
REM It can be called from various Windows shutdown scenarios

setlocal
set SCRIPT_DIR=%~dp0
set PROJECT_ROOT=%SCRIPT_DIR%..
set SHUTDOWN_SCRIPT=%PROJECT_ROOT%\server\shutdown.js

echo WizLight Control - Direct Shutdown
echo ================================

REM Run the Node.js shutdown script directly
cd /d "%PROJECT_ROOT%"
node "%SHUTDOWN_SCRIPT%"

exit /b 0
