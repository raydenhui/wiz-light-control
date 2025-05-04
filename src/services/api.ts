import axios from 'axios';
import { Socket } from 'socket.io-client';
import io from 'socket.io-client';

// API base URL
const API_URL = 'http://localhost:3001/api';

// Socket.io connection
let socket: typeof Socket;
let isConnected = false;

// Initialize socket connection
export const initSocketConnection = () => {
  socket = io('http://localhost:3001');
  
  socket.on('connect', () => {
    console.log('Socket.io connection established');
    isConnected = true;
  });
  
  socket.on('disconnect', () => {
    console.log('Socket.io connection lost');
    isConnected = false;
  });
  
  return socket;
};

// Get socket connection status
export const getSocketConnectionStatus = () => {
  return isConnected;
};

// Light interface
export interface Light {
  id: string;
  ipAddress: string;
  name: string;
  turnOffOnShutdown?: boolean;
  autoTurnOnAtStartup?: boolean;
  status: {
    state?: boolean;
    dimming?: number;
    temp?: number;
    rssi?: number;
    mac?: string;
    sceneId?: number;
  };
}

// Group interface
export interface LightGroup {
  id: string;
  name: string;
  lightIds: string[];
}

// API methods
export const getLights = async (): Promise<Light[]> => {
  try {
    const response = await axios.get(`${API_URL}/lights`);
    return response.data;
  } catch (error) {
    console.error('Error fetching lights:', error);
    return [];
  }
};

export const addLight = async (ipAddress: string, name?: string): Promise<Light | null> => {
  try {
    const response = await axios.post(`${API_URL}/lights`, { ipAddress, name });
    return response.data;
  } catch (error) {
    console.error('Error adding light:', error);
    throw error;
  }
};

export const deleteLight = async (id: string): Promise<void> => {
  try {
    await axios.delete(`${API_URL}/lights/${id}`);
  } catch (error) {
    console.error('Error deleting light:', error);
    throw error;
  }
};

export const toggleLight = async (id: string): Promise<void> => {
  try {
    await axios.post(`${API_URL}/lights/${id}/control`, {
      action: 'toggle'
    });
  } catch (error) {
    console.error('Error toggling light:', error);
    throw error;
  }
};

export const setBrightness = async (id: string, dimming: number): Promise<void> => {
  try {
    await axios.post(`${API_URL}/lights/${id}/control`, {
      action: 'brightness',
      params: { dimming }
    });
  } catch (error) {
    console.error('Error setting brightness:', error);
    throw error;
  }
};

export const setTemperature = async (id: string, temp: number): Promise<void> => {
  try {
    await axios.post(`${API_URL}/lights/${id}/control`, {
      action: 'temperature',
      params: { temp }
    });
  } catch (error) {
    console.error('Error setting temperature:', error);
    throw error;
  }
};

// Toggle turnOffOnShutdown setting
export const toggleTurnOffOnShutdown = async (id: string): Promise<boolean> => {
  try {
    const response = await axios.post(`${API_URL}/lights/${id}/turnOffOnShutdown`);
    return response.data.turnOffOnShutdown;
  } catch (error) {
    console.error('Error toggling turn off on shutdown setting:', error);
    throw error;
  }
};

// Toggle autoTurnOnAtStartup setting
export const toggleAutoTurnOnAtStartup = async (id: string): Promise<boolean> => {
  try {
    const response = await axios.post(`${API_URL}/lights/${id}/autoTurnOnAtStartup`);
    return response.data.autoTurnOnAtStartup;
  } catch (error) {
    console.error('Error toggling auto turn on at startup setting:', error);
    throw error;
  }
};

// Group API methods
export const getGroups = async (): Promise<LightGroup[]> => {
  try {
    const response = await axios.get(`${API_URL}/groups`);
    return response.data;
  } catch (error) {
    console.error('Error fetching groups:', error);
    // Return empty array if API endpoint doesn't exist yet
    return [];
  }
};

export const addGroup = async (name: string): Promise<LightGroup> => {
  try {
    const response = await axios.post(`${API_URL}/groups`, { name, lightIds: [] });
    return response.data;
  } catch (error) {
    console.error('Error adding group:', error);
    // Create a local group if API endpoint doesn't exist yet
    return {
      id: `local-${Date.now()}`,
      name,
      lightIds: []
    };
  }
};

export const updateGroup = async (group: LightGroup): Promise<LightGroup> => {
  try {
    const response = await axios.put(`${API_URL}/groups/${group.id}`, group);
    return response.data;
  } catch (error) {
    console.error('Error updating group:', error);
    // Return the original group if API endpoint doesn't exist yet
    return group;
  }
};

export const deleteGroup = async (id: string): Promise<void> => {
  try {
    await axios.delete(`${API_URL}/groups/${id}`);
  } catch (error) {
    console.error('Error deleting group:', error);
    // No need to throw if API endpoint doesn't exist yet
  }
};

// Group control methods
export const toggleGroup = async (groupId: string, lightIds: string[]): Promise<void> => {
  try {
    // First determine the target state - if any light is off, turn all on, otherwise turn all off
    const lights = await getLights();
    const groupLights = lights.filter(light => lightIds.includes(light.id));
    
    // If any light is off, target state should be ON (true)
    const anyLightOff = groupLights.some(light => !light.status.state);
    const targetState = anyLightOff;
    
    console.log(`Toggling group ${groupId} with ${lightIds.length} lights to state: ${targetState}`);
    
    await axios.post(`${API_URL}/groups/${groupId}/control`, {
      action: 'toggle',
      lightIds, // Pass the light IDs explicitly
      params: { targetState }
    });
  } catch (error) {
    console.error('Error toggling group lights:', error);
    throw error; // Let the component handle the error
  }
};

export const setGroupBrightness = async (groupId: string, lightIds: string[], dimming: number): Promise<void> => {
  try {
    await axios.post(`${API_URL}/groups/${groupId}/control`, {
      action: 'brightness',
      params: { dimming },
      lightIds
    });
  } catch (error) {
    console.error('Error setting group brightness:', error);
    // If API endpoint doesn't exist, set brightness for each light individually
    const promises = lightIds.map(id => setBrightness(id, dimming));
    await Promise.all(promises);
  }
};

export const setGroupTemperature = async (groupId: string, lightIds: string[], temp: number): Promise<void> => {
  try {
    await axios.post(`${API_URL}/groups/${groupId}/control`, {
      action: 'temperature',
      params: { temp },
      lightIds
    });
  } catch (error) {
    console.error('Error setting group temperature:', error);
    // If API endpoint doesn't exist, set temperature for each light individually
    const promises = lightIds.map(id => setTemperature(id, temp));
    await Promise.all(promises);
  }
};