# Wiz Light Control

A web application to control Wiz smart lights over your local network. This project consists of a React frontend and a Node.js backend server that communicates with Wiz lights.

## Features

### Client-Side Features

- **Individual Light Control**: Toggle lights on/off, adjust brightness and color temperature for each light
- **Group Management**: Create groups of lights for easier control of multiple lights at once
- **Real-time Updates**: Light status updates in real-time through WebSocket connection
- **Responsive UI**: User-friendly interface built with Material UI
- **Light Management**: Add new lights by IP address, remove lights you no longer need
- **Signal Strength Indicator**: See the WiFi signal strength of each light

### Server-Side Features

- **UDP Communication**: Directly communicates with Wiz lights using the UDP protocol
- **Automatic Discovery**: Automatically detects and connects to Wiz lights by IP address
- **State Persistence**: Saves light and group configurations to JSON files
- **WebSocket Support**: Provides real-time updates to connected clients when light states change
- **RESTful API**: Exposes endpoints for managing and controlling lights and groups
- **Status Monitoring**: Periodically checks and updates the status of all connected lights

## Installation

### Prerequisites

- Node.js 14.x or later
- npm 6.x or later

### Setup Instructions

1. Clone the repository:

   ```shell
   git clone https://github.com/raydenhui/wiz-light-control
   cd wiz-light-control
   ```

2. Install dependencies:

   ```shell
   npm install
   ```

3. Start the server:

   ```shell
   cd server
   node index.js
   ```

4. In a new terminal, start the client:

   ```shell
   npm start
   ```

5. Open your browser and navigate to http://localhost:3000

## Usage

1. Add your Wiz lights by clicking the "+" button and entering the IP address
2. Create groups by clicking the "Add Group" button
3. Add lights to groups using the dropdown menu in each group card
4. Control individual lights or entire groups with the provided controls

## Technical Details

The application uses a React frontend with Material UI components. The backend server uses Express and communicates with Wiz lights using UDP messages on port 38899. Socket.IO is used for real-time communication between the server and clients.

## Development

This application was developed with assistance from AI tools including GitHub Copilot, which helped with code generation, debugging, and implementation of the WebSocket communication between the client and server components.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
