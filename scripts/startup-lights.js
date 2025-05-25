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

// Find lights that should be turned on
const lightsToTurnOn = lights.filter(light => light.autoTurnOnAtStartup === true);

if (lightsToTurnOn.length === 0) {
  console.log('No lights marked for startup (autoTurnOnAtStartup=true)');
  process.exit(0);
}

console.log(`Turning on ${lightsToTurnOn.length} lights during system startup...`);

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
      resolve(); // Don't reject on timeout during startup
    }, 2000);
  });
};

// Turn on lights
const turnOnLights = async () => {
  const onMessage = {
    id: 1,
    method: 'setState',
    params: { state: true }
  };

  for (const light of lightsToTurnOn) {
    try {
      console.log(`Turning on light: ${light.name} (${light.ipAddress})`);
      await sendUdpMessage(light.ipAddress, onMessage);
      // Small delay between lights
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`Error turning on light ${light.name}:`, error);
    }
  }

  // Give time for messages to be sent
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log('Startup lights process complete');
  
  udpClient.close();
  process.exit(0);
};

// Start the process
turnOnLights().catch(error => {
  console.error('Fatal error in startup lights script:', error);
  try {
    udpClient.close();
  } catch (e) {
    // Ignore cleanup errors
  }
  process.exit(1);
});
