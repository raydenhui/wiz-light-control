const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const dgram = require('dgram');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Store lights and groups data in JSON files
const LIGHTS_DATA_FILE = path.join(__dirname, 'lights.json');
const GROUPS_DATA_FILE = path.join(__dirname, 'groups.json');

// Initialize lights data
let lights = [];
try {
  if (fs.existsSync(LIGHTS_DATA_FILE)) {
    const data = fs.readFileSync(LIGHTS_DATA_FILE, 'utf8');
    lights = JSON.parse(data);
  } else {
    fs.writeFileSync(LIGHTS_DATA_FILE, JSON.stringify([]));
  }
} catch (error) {
  console.error('Error reading lights data:', error);
  fs.writeFileSync(LIGHTS_DATA_FILE, JSON.stringify([]));
}

// Initialize groups data
let groups = [];
try {
  if (fs.existsSync(GROUPS_DATA_FILE)) {
    const data = fs.readFileSync(GROUPS_DATA_FILE, 'utf8');
    groups = JSON.parse(data);
  } else {
    fs.writeFileSync(GROUPS_DATA_FILE, JSON.stringify([]));
  }
} catch (error) {
  console.error('Error reading groups data:', error);
  fs.writeFileSync(GROUPS_DATA_FILE, JSON.stringify([]));
}

// Save lights data to file
const saveLights = () => {
  fs.writeFileSync(LIGHTS_DATA_FILE, JSON.stringify(lights, null, 2));
};

// Save groups data to file
const saveGroups = () => {
  fs.writeFileSync(GROUPS_DATA_FILE, JSON.stringify(groups, null, 2));
};

// UDP client for communicating with Wiz lights
const udpClient = dgram.createSocket('udp4');

// Send UDP message to a light
const sendUdpMessage = (ipAddress, message) => {
  return new Promise((resolve, reject) => {
    const port = 38899;
    const jsonMessage = JSON.stringify(message);
    const buffer = Buffer.from(jsonMessage);

    // Listen for responses
    udpClient.once('message', (response, rinfo) => {
      try {
        const responseData = JSON.parse(response.toString());
        resolve(responseData);
      } catch (error) {
        reject(error);
      }
    });

    // Send the message
    udpClient.send(buffer, 0, buffer.length, port, ipAddress, (err) => {
      if (err) {
        reject(err);
      }
    });

    // Set a timeout for the response
    setTimeout(() => {
      reject(new Error('UDP request timed out'));
    }, 3000);
  });
};

// Get light status
const getLightStatus = async (ipAddress) => {
  try {
    const message = { method: "getPilot", params: {} };
    const response = await sendUdpMessage(ipAddress, message);
    return response;
  } catch (error) {
    return null;
  }
};

// API Routes
// Get all lights
app.get('/api/lights', (req, res) => {
  res.json(lights);
});

// Add a new light
app.post('/api/lights', async (req, res) => {
  const { ipAddress, name } = req.body;
  
  if (!ipAddress) {
    return res.status(400).json({ error: 'IP address is required' });
  }

  // Check if light already exists
  const existingLight = lights.find(light => light.ipAddress === ipAddress);
  if (existingLight) {
    return res.status(400).json({ error: 'Light with this IP already exists' });
  }

  try {
    // Try to get the status to verify it's a valid Wiz light
    const status = await getLightStatus(ipAddress);
    
    if (!status) {
      return res.status(400).json({ error: 'Could not connect to light at this IP address' });
    }

    const newLight = {
      id: uuidv4(),
      ipAddress,
      name: name || `Wiz Light ${lights.length + 1}`,
      status: status.result || {}
    };

    lights.push(newLight);
    saveLights();
    
    // Broadcast light added event
    io.emit('light-added', newLight);
    
    res.status(201).json(newLight);
  } catch (error) {
    console.error('Error adding light:', error);
    res.status(500).json({ error: 'Failed to add light' });
  }
});

// Delete a light
app.delete('/api/lights/:id', (req, res) => {
  const { id } = req.params;
  const lightIndex = lights.findIndex(light => light.id === id);
  
  if (lightIndex === -1) {
    return res.status(404).json({ error: 'Light not found' });
  }
  
  lights.splice(lightIndex, 1);
  saveLights();
  
  // Broadcast light deleted event
  io.emit('light-deleted', id);
  
  res.json({ message: 'Light deleted successfully' });
});

// Control a light
app.post('/api/lights/:id/control', async (req, res) => {
  const { id } = req.params;
  const { action, params } = req.body;
  
  const light = lights.find(light => light.id === id);
  if (!light) {
    return res.status(404).json({ error: 'Light not found' });
  }
  
  try {
    let message = {};
    
    if (action === 'toggle') {
      const currentState = light.status?.state || false;
      message = {
        id: 1,
        method: "setState",
        params: { state: !currentState }
      };
    } else if (action === 'brightness') {
      message = {
        id: 1,
        method: "setPilot",
        params: { dimming: params.dimming }
      };
    } else if (action === 'temperature') {
      message = {
        id: 1,
        method: "setPilot",
        params: { temp: params.temp }
      };
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }
    
    const response = await sendUdpMessage(light.ipAddress, message);
    
    // Update light status
    const updatedStatus = await getLightStatus(light.ipAddress);
    if (updatedStatus && updatedStatus.result) {
      light.status = updatedStatus.result;
      saveLights();
      
      // Broadcast light updated event
      io.emit('light-updated', light);
    }
    
    res.json({ success: true, response });
  } catch (error) {
    console.error(`Error controlling light at ${light.ipAddress}:`, error);
    res.status(500).json({ error: 'Failed to control light' });
  }
});

// Group API endpoints

// Get all groups
app.get('/api/groups', (req, res) => {
  res.json(groups);
});

// Add new group
app.post('/api/groups', (req, res) => {
  const { name, lightIds = [] } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Group name is required' });
  }
  
  const newGroup = {
    id: uuidv4(),
    name,
    lightIds
  };
  
  groups.push(newGroup);
  saveGroups();
  
  // Broadcast group added event
  io.emit('group-added', newGroup);
  
  res.status(201).json(newGroup);
});

// Update group
app.put('/api/groups/:id', (req, res) => {
  const { id } = req.params;
  const { name, lightIds } = req.body;
  
  const groupIndex = groups.findIndex(group => group.id === id);
  if (groupIndex === -1) {
    return res.status(404).json({ error: 'Group not found' });
  }
  
  const updatedGroup = {
    ...groups[groupIndex],
    ...(name && { name }),
    ...(lightIds && { lightIds })
  };
  
  groups[groupIndex] = updatedGroup;
  saveGroups();
  
  // Broadcast group updated event
  io.emit('group-updated', updatedGroup);
  
  res.json(updatedGroup);
});

// Delete group
app.delete('/api/groups/:id', (req, res) => {
  const { id } = req.params;
  
  const groupIndex = groups.findIndex(group => group.id === id);
  if (groupIndex === -1) {
    return res.status(404).json({ error: 'Group not found' });
  }
  
  groups.splice(groupIndex, 1);
  saveGroups();
  
  // Broadcast group deleted event
  io.emit('group-deleted', id);
  
  res.json({ message: 'Group deleted successfully' });
});

// Control group
app.post('/api/groups/:id/control', async (req, res) => {
  const { id } = req.params;
  const { action, params = {}, lightIds = [] } = req.body;
  
  const group = groups.find(group => group.id === id);
  if (!group) {
    return res.status(404).json({ error: 'Group not found' });
  }
  
  // Use provided lightIds or fall back to the group's lightIds
  const targetLightIds = lightIds.length > 0 ? lightIds : group.lightIds;
  const groupLights = lights.filter(light => targetLightIds.includes(light.id));
  
  if (groupLights.length === 0) {
    return res.status(400).json({ error: 'No valid lights found in group' });
  }
  
  try {
    let message = {};
    
    if (action === 'toggle') {
      // Use the targetState from params if provided, otherwise determine based on current states
      const targetState = params.targetState !== undefined 
        ? params.targetState
        : !groupLights.every(light => light.status.state === true);
      
      message = {
        id: 1,
        method: "setState",
        params: { state: targetState }
      };
    } else if (action === 'brightness') {
      message = {
        id: 1,
        method: "setPilot",
        params: { dimming: params.dimming }
      };
    } else if (action === 'temperature') {
      message = {
        id: 1,
        method: "setPilot",
        params: { temp: params.temp }
      };
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }
    
    // Send commands to all lights in the group
    await Promise.all(groupLights.map(light => sendUdpMessage(light.ipAddress, message)));
    
    // Wait a moment for the changes to take effect
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Update statuses for all affected lights
    for (const light of groupLights) {
      const updatedStatus = await getLightStatus(light.ipAddress);
      if (updatedStatus && updatedStatus.result) {
        // Find the light in the lights array and update its status
        const lightToUpdate = lights.find(l => l.id === light.id);
        if (lightToUpdate) {
          lightToUpdate.status = updatedStatus.result;
          // Broadcast the update for this light
          io.emit('light-updated', lightToUpdate);
        }
      }
    }
    
    // Save the updated light statuses
    saveLights();
    
    res.json({ message: 'Group control successful' });
  } catch (error) {
    console.error('Error controlling group:', error);
    res.status(500).json({ error: 'Failed to control group' });
  }
});

// Track connected clients manually to ensure accuracy
const connectedClients = new Set();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected');
  // Add client to our tracking set
  connectedClients.add(socket.id);
  console.log(`Active clients: ${connectedClients.size}`);
  
  // Start status updates when at least one client connects
  startStatusUpdates();
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
    // Remove client from our tracking set
    connectedClients.delete(socket.id);
    console.log(`Remaining clients: ${connectedClients.size}`);
    
    // If no more clients are connected, stop the updates
    if (connectedClients.size === 0) {
      stopStatusUpdates();
    }
  });
});

// Variable to keep track of the status update interval
let statusUpdateInterval = null;

// Function to start periodic status updates
const startStatusUpdates = () => {
  // Only start if not already running
  if (!statusUpdateInterval) {
    console.log('Starting periodic light status updates');
    // Double check that we have clients before starting
    if (connectedClients.size > 0) {
      // Initial update
      updateLightStatuses();
      // Then update every 5 seconds (increased to reduce load)
      statusUpdateInterval = setInterval(updateLightStatuses, 5000);
      console.log(`Status updates started with ${connectedClients.size} active clients`);
    } else {
      console.log('No clients connected, not starting updates');
    }
  } else {
    console.log('Status updates already running');
  }
};

// Function to stop periodic status updates
const stopStatusUpdates = () => {
  if (statusUpdateInterval) {
    console.log('Stopping periodic light status updates - no clients connected');
    clearInterval(statusUpdateInterval);
    statusUpdateInterval = null;
  } else {
    console.log('No status updates running, nothing to stop');
  }
};

// Periodically update light statuses
const updateLightStatuses = async () => {
  let hasChanges = false;
  
  for (const light of lights) {
    try {
      const status = await getLightStatus(light.ipAddress);
      if (status && status.result) {
        const oldStatus = { ...light.status };
        light.status = status.result;
        
        // Check if status has changed
        if (JSON.stringify(oldStatus) !== JSON.stringify(light.status)) {
          io.emit('light-updated', light);
          hasChanges = true;
        }
      }
    } catch (error) {
      console.error(`Error updating status for light at ${light.ipAddress}:`, error);
    }
  }
  
  // Only save to file if there were changes
  if (hasChanges) {
    saveLights();
  }
};

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Monitoring ${lights.length} Wiz lights`);
});