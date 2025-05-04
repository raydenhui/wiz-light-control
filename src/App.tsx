import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Button,
  Fab,
  Alert,
  Snackbar,
  CircularProgress,
  Paper,
  Divider,
  Chip
} from '@mui/material';
import { Add as AddIcon, Refresh as RefreshIcon, Group as GroupIcon, Wifi as WifiIcon, WifiOff as WifiOffIcon } from '@mui/icons-material';
import LightCard from './components/LightCard';
import GroupCard from './components/GroupCard';
import AddLightDialog from './components/AddLightDialog';
import AddGroupDialog from './components/AddGroupDialog';
import { 
  getLights, 
  getGroups, 
  Light, 
  LightGroup, 
  initSocketConnection,
  getSocketConnectionStatus
} from './services/api';
import { Socket } from 'socket.io-client';

function App() {
  const [lights, setLights] = useState<Light[]>([]);
  const [groups, setGroups] = useState<LightGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightDialogOpen, setLightDialogOpen] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [socket, setSocket] = useState<typeof Socket | null>(null);
  const [notification, setNotification] = useState<{message: string; type: 'success' | 'error' | 'info'} | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Initialize socket connection and fetch lights on component mount
  useEffect(() => {
    const newSocket = initSocketConnection();
    setSocket(newSocket);

    // Add connection status tracking
    const updateConnectionStatus = () => {
      const connected = getSocketConnectionStatus();
      setIsConnected(connected);
    };

    // Set initial connection status
    updateConnectionStatus();

    // Update connection status whenever it changes
    newSocket.on('connect', updateConnectionStatus);
    newSocket.on('disconnect', updateConnectionStatus);

    // Handle real-time updates
    newSocket.on('light-added', (light: Light) => {
      setLights(prevLights => [...prevLights.filter(l => l.id !== light.id), light]);
      setNotification({ message: `Light "${light.name}" added`, type: 'success' });
    });

    newSocket.on('light-updated', (light: Light) => {
      setLights(prevLights => prevLights.map(l => l.id === light.id ? light : l));
    });

    newSocket.on('light-deleted', (id: string) => {
      setLights(prevLights => prevLights.filter(l => l.id !== id));
      // Also remove the light from any groups it belongs to
      setGroups(prevGroups => 
        prevGroups.map(group => ({
          ...group,
          lightIds: group.lightIds.filter(lightId => lightId !== id)
        }))
      );
    });

    // Add listeners for group events
    newSocket.on('group-added', (group: LightGroup) => {
      setGroups(prevGroups => [...prevGroups.filter(g => g.id !== group.id), group]);
      setNotification({ message: `Group "${group.name}" added`, type: 'success' });
    });

    newSocket.on('group-updated', (group: LightGroup) => {
      setGroups(prevGroups => prevGroups.map(g => g.id === group.id ? group : g));
    });

    newSocket.on('group-deleted', (id: string) => {
      setGroups(prevGroups => prevGroups.filter(g => g.id !== id));
    });

    // Fetch initial data
    fetchLights();
    fetchGroups();

    // Clean up socket connection on unmount
    return () => {
      newSocket.disconnect();
    };
  }, []);

  const fetchLights = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const fetchedLights = await getLights();
      setLights(fetchedLights);
    } catch (err) {
      console.error('Failed to fetch lights:', err);
      setError('Failed to load lights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    setLoading(true);
    setError(null);

    try {
      const fetchedGroups = await getGroups();
      setGroups(fetchedGroups);
    } catch (err) {
      console.error('Failed to fetch groups:', err);
      setError('Failed to load groups. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLightAdded = () => {
    fetchLights();
    setNotification({ message: 'Light added successfully', type: 'success' });
  };

  const handleLightDeleted = (id: string) => {
    const light = lights.find(l => l.id === id);
    if (light) {
      setNotification({ message: `Light "${light.name}" deleted`, type: 'info' });
    }
  };

  const handleGroupAdded = () => {
    fetchGroups();
    setNotification({ message: 'Group created successfully', type: 'success' });
  };

  const handleGroupDeleted = (id: string) => {
    const group = groups.find(g => g.id === id);
    if (group) {
      setGroups(prevGroups => prevGroups.filter(g => g.id !== id));
      setNotification({ message: `Group "${group.name}" deleted`, type: 'info' });
    }
  };

  const handleGroupUpdated = (updatedGroup: LightGroup) => {
    setGroups(prevGroups => 
      prevGroups.map(group => 
        group.id === updatedGroup.id ? updatedGroup : group
      )
    );
  };

  const handleRefresh = () => {
    fetchLights();
    fetchGroups();
    setNotification({ message: 'Refreshed light and group statuses', type: 'info' });
  };

  const closeNotification = () => {
    setNotification(null);
  };

  return (
    <div>
      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Wiz Light Control
          </Typography>
          <Chip
            icon={isConnected ? <WifiIcon /> : <WifiOffIcon />}
            label={isConnected ? "Connected" : "Disconnected"}
            color={isConnected ? "success" : "default"}
            size="small"
            sx={{ mr: 2 }}
          />
          <Button 
            color="inherit" 
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Refresh
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            <Box sx={{ 
              bgcolor: 'info.light', 
              color: 'info.contrastText', 
              p: 1.5, 
              mb: 2, 
              mt: 2, 
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Typography variant="body2" textAlign="center">
                <strong>Tip:</strong> Use the dropdown menu in each group to select and add lights.
                You can also remove lights from a group by clicking the remove button.
              </Typography>
            </Box>
            
            {lights.length === 0 ? (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                mt: 8,
                p: 4,
                borderRadius: 2,
                bgcolor: 'background.paper',
                boxShadow: 1
              }}>
                <Typography variant="h5" gutterBottom>
                  No Lights Added Yet
                </Typography>
                <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 3 }}>
                  Click the "+" button to add your first Wiz light by IP address
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  startIcon={<AddIcon />}
                  onClick={() => setLightDialogOpen(true)}
                >
                  Add Light
                </Button>
              </Box>
            ) : (
              <Box>
                {/* Groups section first */}
                {groups.length > 0 && (
                  <Box sx={{ mb: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        Groups
                      </Typography>
                      <Button 
                        variant="contained" 
                        color="primary" 
                        size="small"
                        startIcon={<GroupIcon />}
                        onClick={() => setGroupDialogOpen(true)}
                      >
                        Add Group
                      </Button>
                    </Box>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {groups.map(group => (
                        <GroupCard 
                          key={group.id}
                          group={group}
                          lights={lights}
                          onDelete={handleGroupDeleted}
                          onUpdate={handleGroupUpdated}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
                
                {/* Add Group button when no groups exist */}
                {groups.length === 0 && (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    p: 3, 
                    mb: 3,
                    borderRadius: 1,
                    border: '1px dashed',
                    borderColor: 'divider'
                  }}>
                    <Typography variant="subtitle1" gutterBottom>
                      No Groups Added Yet
                    </Typography>
                    <Button 
                      variant="outlined" 
                      color="primary" 
                      startIcon={<GroupIcon />}
                      onClick={() => setGroupDialogOpen(true)}
                      sx={{ mt: 1 }}
                    >
                      Create Group
                    </Button>
                  </Box>
                )}
                
                {/* Divider between groups and lights */}
                <Divider sx={{ my: 3 }} />
                
                {/* All lights section */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    All Lights
                  </Typography>
                  <Paper
                    sx={{
                      p: 2,
                      bgcolor: 'background.paper',
                      borderRadius: 1,
                      boxShadow: 1,
                      minHeight: 100,
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 2
                    }}
                  >
                    {lights.map((light) => (
                      <LightCard 
                        key={light.id}
                        light={light}
                        onDelete={handleLightDeleted}
                      />
                    ))}
                  </Paper>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Use the dropdown selector in each group to add these lights to groups
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        )}

        <Fab 
          color="primary" 
          aria-label="add" 
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => setLightDialogOpen(true)}
        >
          <AddIcon />
        </Fab>
      </Container>

      <AddLightDialog 
        open={lightDialogOpen}
        onClose={() => setLightDialogOpen(false)}
        onLightAdded={handleLightAdded}
      />

      <AddGroupDialog 
        open={groupDialogOpen}
        onClose={() => setGroupDialogOpen(false)}
        onGroupAdded={handleGroupAdded}
      />

      {notification && (
        <Snackbar
          open={true}
          autoHideDuration={4000}
          onClose={closeNotification}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          <Alert onClose={closeNotification} severity={notification.type} sx={{ width: '100%' }}>
            {notification.message}
          </Alert>
        </Snackbar>
      )}
    </div>
  );
}

export default App;
