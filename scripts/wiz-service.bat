@echo off
setlocal

REM WizLight Control Service Manager
REM This is a simple wrapper for the PowerShell script

set SCRIPT_DIR=%~dp0
set PS_SCRIPT=%SCRIPT_DIR%wiz-service-manager.ps1

REM Check for admin privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo This script requires administrator privileges.
    echo Right-click and select "Run as administrator"
    pause
    exit /b 1
)

REM Execute the PowerShell script with the provided command
if "%~1"=="" (
    powershell -ExecutionPolicy Bypass -File "%PS_SCRIPT%"
) else (
    powershell -ExecutionPolicy Bypass -File "%PS_SCRIPT%" %*
)

endlocal
