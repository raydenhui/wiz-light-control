# WizLight Control Service Scripts

This directory contains scripts for managing the WizLight Control service and system integration.

## Files

### service-manager.bat
Main service management script that handles all operations:
- **install**: Installs the Windows service and registers system startup/shutdown tasks
- **uninstall**: Removes the service and all scheduled tasks
- **start/stop**: Controls the service
- **status**: Shows current service status
- **update**: Updates an existing installation

### wiz-service.js
Node.js script that creates and manages the Windows service using node-windows.

### startup-lights.bat
Script that runs during system startup to turn on lights marked with `autoTurnOnAtStartup=true`.
This script is automatically registered as a Windows scheduled task.

### startup-lights.js
Node.js script that handles the actual light control logic for startup.

### direct-shutdown.bat
Script that runs during system shutdown to turn off lights marked with `turnOffOnShutdown=true`.
This script is automatically registered as a Windows scheduled task.

### shutdown-lights.js
Node.js script that handles the actual light control logic for shutdown.

### test-system.bat
Test script to verify that both startup and shutdown light controls work correctly without rebooting.

## How It Works

The system now works with actual computer startup/shutdown rather than just service start/stop:

1. **System Startup**: When Windows starts, scheduled tasks run `startup-lights.bat` which:
   - Waits for network initialization
   - Reads the lights configuration
   - Turns on all lights marked with `autoTurnOnAtStartup=true`

2. **System Shutdown**: When Windows shuts down, scheduled tasks run `direct-shutdown.bat` which:
   - Reads the lights configuration  
   - Turns off all lights marked with `turnOffOnShutdown=true`
   - Runs independently of the main service

3. **Service**: The main service runs continuously in the background providing:
   - Web API at http://localhost:3001
   - Real-time light control and monitoring
   - WebSocket updates for the frontend

## Light Settings

In the WizLight Control application, you can mark lights with two special settings:

- **Turn Off On Shutdown**: When enabled, these lights will automatically turn off when your computer shuts down
- **Auto Turn On At Startup**: When enabled, these lights will automatically turn on when your computer starts

## Installation

### Prerequisites

- Node.js must be installed
- Run `npm install` to install all dependencies (including node-windows)
- Administrator privileges required

### Quick Installation

```bat
# Run as Administrator
cd scripts
service-manager.bat install
```

This will:
- Install all npm dependencies
- Create the Windows service
- Register system startup/shutdown tasks
- Start the service

## Configuration

Use the web interface at http://localhost:3001 to:
- Add/remove lights
- Configure which lights turn on at startup (`autoTurnOnAtStartup`)
- Configure which lights turn off at shutdown (`turnOffOnShutdown`)
- Control lights manually
- Create and manage light groups

## Managing the Service

### Using the Service Manager

```bat
# From scripts directory
service-manager.bat status   # Check status
service-manager.bat start    # Start the service
service-manager.bat stop     # Stop the service
service-manager.bat update   # Update existing service
service-manager.bat uninstall # Remove the service
```

### Using Windows Services

You can also manage the service from Windows Services:

1. Press `Win+R`, type `services.msc` and press Enter
2. Find "WizLightControl" in the list
3. Right-click and select Start, Stop, or Restart

## Troubleshooting

If lights don't turn on/off during system startup/shutdown:

1. Check that scheduled tasks are registered: 
   ```powershell
   schtasks /query /tn "WizLightControl*"
   ```
2. Check task logs in Windows Event Viewer
3. Verify lights are properly configured in the web interface
4. Ensure network connectivity during startup/shutdown

### Common Issues

1. **Service won't install**: Make sure you're running the commands as Administrator
2. **Lights won't respond**: Verify network connectivity to your lights
3. **Service won't start**: Check Windows Event Viewer for any service-related errors
