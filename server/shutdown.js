// Direct shutdown script for WizLight Control
// This script directly communicates with the lights to turn them off
// without depending on the main server process

const fs = require('fs');
const path = require('path');
const dgram = require('dgram');

// Get the path to the lights data file
const LIGHTS_DATA_FILE = path.join(__dirname, 'lights.json');

// Initialize UDP client
const udpClient = dgram.createSocket('udp4');

// Send UDP message to a light
const sendUdpMessage = (ipAddress, message) => {
  return new Promise((resolve, reject) => {
    const port = 38899;
    const jsonMessage = JSON.stringify(message);
    const buffer = Buffer.from(jsonMessage);

    // Set a timeout for the request
    const timeout = setTimeout(() => {
      reject(new Error(`UDP request to ${ipAddress} timed out`));
    }, 5000); // Increased timeout to 5 seconds for better reliability during shutdown

    // Send the message
    udpClient.send(buffer, 0, buffer.length, port, ipAddress, (err) => {
      if (err) {
        clearTimeout(timeout);
        reject(err);
      }
    });

    // Listen for responses
    udpClient.once('message', (response) => {
      clearTimeout(timeout);
      try {
        const responseData = JSON.parse(response.toString());
        resolve(responseData);
      } catch (error) {
        reject(error);
      }
    });
  });
};

async function main() {
  console.log('Direct shutdown script executing...');
  
  try {
    // Read the lights data file
    if (!fs.existsSync(LIGHTS_DATA_FILE)) {
      console.log('No lights data file found');
      process.exit(0);
    }

    const data = fs.readFileSync(LIGHTS_DATA_FILE, 'utf8');
    const lights = JSON.parse(data);
    
    // Find lights that should be turned off
    const lightsToTurnOff = lights.filter(light => light.turnOffOnShutdown === true);
    
    if (lightsToTurnOff.length === 0) {
      console.log('No lights to turn off');
      process.exit(0);
    }
    
    console.log(`Turning off ${lightsToTurnOff.length} lights...`);
    
    // Message to turn off a light
    const offMessage = {
      id: 1,
      method: "setState",
      params: { state: false }
    };
    
    // Turn off each light individually
    for (const light of lightsToTurnOff) {
      try {
        console.log(`Turning off light: ${light.name} (${light.ipAddress})`);
        await sendUdpMessage(light.ipAddress, offMessage);
        console.log(`Successfully turned off ${light.name}`);
        // Add a small delay between lights
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`Error turning off light ${light.name}:`, error.message);
      }
    }
    
    console.log('All shutdown operations completed');
  } catch (error) {
    console.error('Error during shutdown:', error);
  } finally {
    // Always close the UDP socket
    try {
      udpClient.close();
    } catch (err) {
      // Ignore errors during cleanup
    }
    process.exit(0);
  }
}

// Execute the shutdown sequence
main();
