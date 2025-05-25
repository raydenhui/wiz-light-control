@echo off
REM filepath: c:\Users\rayde\Documents\Github\wiz-light-control\scripts\startup-lights.bat
REM Startup script for WizLight Control
REM This script runs during system startup to turn on lights

setlocal enabledelayedexpansion

set SCRIPT_DIR=%~dp0

echo WizLight Control: System startup detected, turning on lights...

REM Wait a bit for network to be ready
timeout /t 10 /nobreak

REM Change to the scripts directory and run the Node.js script
cd /d "%SCRIPT_DIR%"
node startup-lights.js

echo WizLight Control: Startup script completed
