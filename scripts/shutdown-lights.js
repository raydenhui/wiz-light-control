const fs = require('fs');
const dgram = require('dgram');
const path = require('path');

// Get the server directory path
const serverDir = path.join(__dirname, '..', 'server');
const LIGHTS_DATA_FILE = path.join(serverDir, 'lights.json');

console.log('WizLight Control: Reading lights configuration...');

// Read lights data
let lights = [];
try {
  if (fs.existsSync(LIGHTS_DATA_FILE)) {
    const data = fs.readFileSync(LIGHTS_DATA_FILE, 'utf8');
    lights = JSON.parse(data);
  } else {
    console.log('No lights configuration found at:', LIGHTS_DATA_FILE);
    process.exit(0);
  }
} catch (error) {
  console.error('Error reading lights data:', error);
  process.exit(1);
}

// Find lights that should be turned off
const lightsToTurnOff = lights.filter(light => light.turnOffOnShutdown === true);

if (lightsToTurnOff.length === 0) {
  console.log('No lights marked for shutdown (turnOffOnShutdown=true)');
  process.exit(0);
}

console.log(`Turning off ${lightsToTurnOff.length} lights during system shutdown...`);

const udpClient = dgram.createSocket('udp4');

// Function to send UDP message
const sendUdpMessage = (ipAddress, message) => {
  return new Promise((resolve, reject) => {
    const port = 38899;
    const jsonMessage = JSON.stringify(message);
    const buffer = Buffer.from(jsonMessage);

    udpClient.send(buffer, 0, buffer.length, port, ipAddress, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });

    // Set a timeout for the response
    setTimeout(() => {
      resolve(); // Don't reject on timeout during shutdown
    }, 1000);
  });
};

// Turn off lights
const turnOffLights = async () => {
  const offMessage = {
    id: 1,
    method: 'setState',
    params: { state: false }
  };

  for (const light of lightsToTurnOff) {
    try {
      console.log(`Turning off light: ${light.name} (${light.ipAddress})`);
      await sendUdpMessage(light.ipAddress, offMessage);
      // Small delay between lights
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Error turning off light ${light.name}:`, error);
    }
  }

  // Give time for messages to be sent
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log('Shutdown lights process complete');
  
  udpClient.close();
  process.exit(0);
};

// Start the process
turnOffLights().catch(error => {
  console.error('Fatal error in shutdown lights script:', error);
  try {
    udpClient.close();
  } catch (e) {
    // Ignore cleanup errors
  }
  process.exit(1);
});
