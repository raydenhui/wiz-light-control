@echo off
REM filepath: c:\Users\rayde\Documents\Github\wiz-light-control\scripts\direct-shutdown.bat
REM Direct shutdown script for WizLight Control
REM This script runs during system shutdown to turn off lights

setlocal enabledelayedexpansion

set SCRIPT_DIR=%~dp0

echo WizLight Control: System shutdown detected, turning off lights...

REM Change to the scripts directory and run the Node.js script
cd /d "%SCRIPT_DIR%"
node shutdown-lights.js

echo WizLight Control: Shutdown script completed
