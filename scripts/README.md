# WizLight Control Service

This document explains how to install and manage the WizLight Control service to ensure your smart lights are properly managed, especially during system shutdowns.

## About the Service

The WizLight Control service ensures that:

1. Your lights are properly turned off when your PC shuts down (based on your settings)
2. The service starts automatically when your PC boots
3. Your lights turn on at startup if they're marked with `autoTurnOnAtStartup=true`

## Light Settings

In the WizLight Control application, you can mark lights with two special settings:

- **Turn Off On Shutdown**: When enabled, these lights will automatically turn off when your PC shuts down or when the service stops
- **Auto Turn On At Startup**: When enabled, these lights will automatically turn on when the service starts

## Installation

### Prerequisites

- Node.js must be installed
- The application must be built (`npm run build`)
- Run `npm install` to install all dependencies (including node-windows)

### Quick Installation

```bat
# Run as Administrator
cd scripts
service-manager.bat install
```

This will handle all the installation steps automatically, including enhanced shutdown handling.

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

### Using npm scripts

```powershell
# From project root
npm run service-install   # Install service
npm run service-start     # Start service
npm run service-stop      # Stop service
npm run service-status    # Show status
npm run service-uninstall # Uninstall service
```

## How It Works

The service uses several mechanisms to ensure reliable operation:

1. **Windows Service Integration**: Uses `node-windows` to register as a proper Windows service
2. **Shutdown Handling**: Multiple mechanisms ensure lights turn off during shutdown:
   - Service shutdown event handlers
   - Direct shutdown script
   - Windows scheduled task (for added reliability)
3. **Startup Control**: Automatically turns on designated lights after startup

## Troubleshooting

### Lights Not Turning Off During Shutdown

If your lights aren't turning off during system shutdown:

1. Make sure the lights are marked with `turnOffOnShutdown=true` in the application
2. Check that your lights are reachable on the network
3. Try running `service-manager.bat update` to update the service with enhanced shutdown handling

### Common Issues

1. **Service won't install**: Make sure you're running the commands as Administrator
2. **Lights won't respond**: Verify network connectivity to your lights
3. **Service won't start**: Check Windows Event Viewer for any service-related errors
