# WizLight Control Service Manager
param (
  [Parameter(Position = 0)]
  [string]$Command = "help"
)

# Set working directory to script location
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath
$projectRoot = (Get-Item $scriptPath).Parent.FullName

function Install-Service {
  Write-Host "Installing WizLight Control as a Windows service..." -ForegroundColor Yellow
    
  # Make sure node-windows is available
  Write-Host "Checking for node-windows..." -ForegroundColor Yellow
  $nodeModulesPath = Join-Path $projectRoot "node_modules\node-windows"
  if (-not (Test-Path $nodeModulesPath)) {
    Write-Host "Node-windows not found. Installing project dependencies..." -ForegroundColor Yellow
    Set-Location $projectRoot
    npm install
  }
    
  # Run the service installer
  Set-Location $scriptPath
  node wiz-service.js install
    
  Write-Host "`nService installed successfully!" -ForegroundColor Green
  Write-Host "The service will start automatically on system boot and shut down gracefully on system shutdown."
  Write-Host "You can manage the service through Services.msc or using this script."
}

function Uninstall-Service {
  Write-Host "Uninstalling WizLight Control service..." -ForegroundColor Yellow
  Set-Location $scriptPath
  node wiz-service.js uninstall
}

function Start-WizService {
  Write-Host "Starting WizLight Control service..." -ForegroundColor Yellow
  Set-Location $scriptPath
  node wiz-service.js start
}

function Stop-WizService {
  Write-Host "Stopping WizLight Control service..." -ForegroundColor Yellow
  Set-Location $scriptPath
  node wiz-service.js stop
}

function Restart-WizService {
  Write-Host "Restarting WizLight Control service..." -ForegroundColor Yellow
  Set-Location $scriptPath
  node wiz-service.js restart
}

function Show-Status {
  $service = Get-Service -Name "WizLightControl" -ErrorAction SilentlyContinue
  if ($service) {
    Write-Host "WizLight Control Service Status: " -NoNewline
    if ($service.Status -eq "Running") {
      Write-Host $service.Status -ForegroundColor Green
    }
    else {
      Write-Host $service.Status -ForegroundColor Red
    }
    Write-Host "Start Type: $($service.StartType)"
  }
  else {
    Write-Host "WizLight Control service is not installed." -ForegroundColor Red
  }
}

function Show-Help {
  Write-Host "WizLight Control Service Manager" -ForegroundColor Cyan
  Write-Host "================================="
  Write-Host "Usage: .\wiz-service-manager.ps1 [command]" -ForegroundColor White
  Write-Host "`nCommands:"
  Write-Host "  install    - Install WizLight Control as a Windows service"
  Write-Host "  uninstall  - Remove the Windows service"
  Write-Host "  start      - Start the service"
  Write-Host "  stop       - Stop the service"
  Write-Host "  restart    - Restart the service"
  Write-Host "  status     - Show service status"
  Write-Host "  help       - Show this help message"
  Write-Host "`nThe service will automatically start on system boot and shut down gracefully when Windows shuts down."
}

# Execute command
switch ($Command.ToLower()) {
  "install" {
    Install-Service
  }
  "uninstall" {
    Uninstall-Service
  }
  "start" {
    Start-WizService
  }
  "stop" {
    Stop-WizService
  }
  "restart" {
    Restart-WizService
  }
  "status" {
    Show-Status
  }
  default {
    Show-Help
  }
}
