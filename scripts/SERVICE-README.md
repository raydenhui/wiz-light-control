# WizLight Control Service

This document explains how to install and manage the WizLight Control service to ensure your smart lights are properly managed, especially during system shutdowns.

## About the Service

The WizLight Control service ensures that:

1. Your lights are properly turned off when your PC shuts down (based on your settings)
2. The service starts automatically when your PC boots
3. The service is gracefully shut down by Windows before system shutdown

## Installation

### Prerequisites

- Node.js must be installed
- The application must be built (`npm run build`)
- Run `npm install` to install all dependencies (including node-windows)

### Quick Installation (Recommended)

The easiest way to install the service is to use the one-click installer:

```bat
# Run as Administrator
cd scripts
install-service.bat
```

This will handle all the installation steps automatically.

### Alternative Installation Methods

```powershell
# Run as Administrator
# From project root:
npm run service-install
```

Or directly:

```powershell
# Run as Administrator
cd scripts
.\wiz-service.bat install
```

## Managing the Service

### From npm

```powershell
# Check service status
npm run service-status

# Start the service
npm run service-start

# Stop the service
npm run service-stop

# Uninstall the service
npm run service-uninstall
```

### Using the Service Manager

```powershell
# From scripts directory
.\wiz-service.bat status
.\wiz-service.bat start
.\wiz-service.bat stop
.\wiz-service.bat restart
.\wiz-service.bat uninstall
```

### Using Windows Services

You can also manage the service from Windows Services:

1. Press `Win+R`, type `services.msc` and press Enter
2. Find "WizLightControl" in the list
3. Right-click and select Start, Stop, or Restart

## How It Works

The service uses `node-windows` to:

1. Register your application as a proper Windows service
2. Ensure it receives proper shutdown signals when Windows is shutting down
3. Give your application time to gracefully shut down and turn off lights

Your server's existing `handleShutdown` function will properly process the shutdown signal to turn off designated lights before the PC shuts down.

## Troubleshooting

If you encounter any issues:

1. Make sure you're running the commands as Administrator
2. Check that Node.js is properly installed and in your PATH
3. Try uninstalling and reinstalling the service
4. Check the Windows Event Viewer for any service-related errors
