import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  Slider,
  Box,
  Switch,
  CircularProgress,
  Tooltip,
  Chip
} from '@mui/material';
import { 
  Delete as DeleteIcon,
  Lightbulb as LightbulbIcon,
  WbIncandescent as WbIncandescentIcon,
  SignalWifi4Bar as SignalIcon,
  SignalWifi1Bar as WeakSignalIcon,
  DragIndicator as DragIcon,
  PowerSettingsNew as ShutdownIcon,
  PlayArrow as StartupIcon
} from '@mui/icons-material';
import { Light, toggleLight, setBrightness, setTemperature, deleteLight, toggleTurnOffOnShutdown, toggleAutoTurnOnAtStartup } from '../services/api';

interface LightCardProps {
  light: Light;
  onDelete: (id: string) => void;
  isInGroup?: boolean;
}

const LightCard: React.FC<LightCardProps> = ({ light, onDelete, isInGroup = false }) => {
  const [loading, setLoading] = useState(false);
  const [isControlDisabled, setIsControlDisabled] = useState(false);
  const [displayBrightness, setDisplayBrightness] = useState(light.status.dimming || 0);
  const [displayTemperature, setDisplayTemperature] = useState(light.status.temp || 2700);

  // Update local state when light prop changes
  useEffect(() => {
    setDisplayBrightness(light.status.dimming || 0);
    setDisplayTemperature(light.status.temp || 2700);
  }, [light.status.dimming, light.status.temp]);

  const handleToggle = async () => {
    setLoading(true);
    setIsControlDisabled(true);
    try {
      await toggleLight(light.id);
    } catch (error) {
      console.error('Failed to toggle light', error);
    } finally {
      setLoading(false);
      setTimeout(() => setIsControlDisabled(false), 500);
    }
  };

  const handleBrightnessChange = (event: React.ChangeEvent<{}> | Event, value: number | number[]) => {
    const newValue = value as number;
    setDisplayBrightness(newValue);
  };

  const handleBrightnessChangeCommitted = async (event: React.ChangeEvent<{}> | Event, value: number | number[]) => {
    if (isControlDisabled) return;
    
    const newValue = value as number;
    setIsControlDisabled(true);
    try {
      await setBrightness(light.id, newValue);
    } catch (error) {
      console.error('Failed to set brightness', error);
    } finally {
      setTimeout(() => setIsControlDisabled(false), 500);
    }
  };

  const handleTemperatureChange = (event: React.ChangeEvent<{}> | Event, value: number | number[]) => {
    const newValue = value as number;
    setDisplayTemperature(newValue);
  };

  const handleTemperatureChangeCommitted = async (event: React.ChangeEvent<{}> | Event, value: number | number[]) => {
    if (isControlDisabled) return;
    
    const newValue = value as number;
    setIsControlDisabled(true);
    try {
      await setTemperature(light.id, newValue);
    } catch (error) {
      console.error('Failed to set temperature', error);
    } finally {
      setTimeout(() => setIsControlDisabled(false), 500);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteLight(light.id);
      onDelete(light.id);
    } catch (error) {
      console.error('Failed to delete light', error);
    }
  };

  // Handler for toggling turnOffOnShutdown setting
  const handleToggleTurnOffOnShutdown = async () => {
    try {
      await toggleTurnOffOnShutdown(light.id);
    } catch (error) {
      console.error('Failed to toggle turn off on shutdown setting', error);
    }
  };

  // Handler for toggling autoTurnOnAtStartup setting
  const handleToggleAutoTurnOnAtStartup = async () => {
    try {
      await toggleAutoTurnOnAtStartup(light.id);
    } catch (error) {
      console.error('Failed to toggle auto turn on at startup setting', error);
    }
  };

  const getSignalStrength = () => {
    const rssi = light.status.rssi || -100;
    if (rssi > -60) {
      return { icon: <SignalIcon />, text: 'Good' };
    } else {
      return { icon: <WeakSignalIcon />, text: 'Weak' };
    }
  };

  const signalInfo = getSignalStrength();

  // Use a slightly different styling when the card is part of a group
  const cardStyles = isInGroup ? {
    height: '100%',
    boxShadow: 2,
    bgcolor: light.status.state ? '#fefee9' : 'background.paper',
    transition: 'background-color 0.3s ease',
    '&:hover': {
      boxShadow: 3,
    }
  } : {
    minWidth: 275, 
    maxWidth: 400, 
    boxShadow: 3,
    bgcolor: light.status.state ? '#fefee9' : 'background.paper',
    transition: 'background-color 0.3s ease',
  };

  return (
    <Card sx={cardStyles}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {isInGroup && (
              <DragIcon sx={{ mr: 1, color: 'text.secondary', cursor: 'grab' }} />
            )}
            <Typography variant="h5" component="div">
              {light.name}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {loading ? (
              <CircularProgress size={24} />
            ) : (
              <Switch
                checked={light.status.state || false}
                onChange={handleToggle}
                disabled={isControlDisabled}
                color="primary"
              />
            )}
          </Box>
        </Box>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          IP: {light.ipAddress}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
          <Tooltip title={`Signal Strength: ${light.status.rssi || 'Unknown'} dBm`}>
            <Chip 
              icon={signalInfo.icon} 
              label={signalInfo.text} 
              size="small"
              color={signalInfo.text === 'Good' ? 'success' : 'warning'}
              sx={{ mr: 1 }}
            />
          </Tooltip>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <LightbulbIcon sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2">
                Brightness: {displayBrightness}%
              </Typography>
            </Box>
            <Box 
              sx={{ px: 1 }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              className="no-drag-area"
            >
              <Slider
                value={displayBrightness}
                onChange={handleBrightnessChange}
                onChangeCommitted={handleBrightnessChangeCommitted}
                min={0}
                max={100}
                disabled={!light.status.state || isControlDisabled}
                valueLabelDisplay="auto"
                aria-label="Brightness"
                sx={{ 
                  '& .MuiSlider-thumb': { 
                    pointerEvents: 'auto' 
                  },
                  '& .MuiSlider-track': { 
                    pointerEvents: 'auto' 
                  },
                  '& .MuiSlider-rail': { 
                    pointerEvents: 'auto' 
                  }
                }}
              />
            </Box>
          </Box>
          
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <WbIncandescentIcon sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2">
                Temperature: {displayTemperature}K
              </Typography>
            </Box>
            <Box 
              sx={{ px: 1 }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              className="no-drag-area"
            >
              <Slider
                value={displayTemperature}
                onChange={handleTemperatureChange}
                onChangeCommitted={handleTemperatureChangeCommitted}
                min={2700}
                max={6500}
                step={100}
                disabled={!light.status.state || isControlDisabled}
                valueLabelDisplay="auto"
                aria-label="Temperature"
                marks={[
                  { value: 2700, label: 'Warm' },
                  { value: 6500, label: 'Cool' },
                ]}
                sx={{ 
                  '& .MuiSlider-thumb': { 
                    pointerEvents: 'auto' 
                  },
                  '& .MuiSlider-track': { 
                    pointerEvents: 'auto' 
                  },
                  '& .MuiSlider-rail': { 
                    pointerEvents: 'auto' 
                  }
                }}
              />
            </Box>
          </Box>
        </Box>
      </CardContent>
      
      <CardActions sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex' }}>
          <Tooltip title={light.turnOffOnShutdown ? "This light will turn off when server shuts down" : "This light will stay on when server shuts down"}>
            <IconButton
              size="small"
              color={light.turnOffOnShutdown ? "primary" : "default"}
              onClick={handleToggleTurnOffOnShutdown}
              aria-label="toggle turn off on shutdown"
            >
              <ShutdownIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={light.autoTurnOnAtStartup ? "This light will automatically turn on when server starts" : "This light will remain off when server starts"}>
            <IconButton
              size="small"
              color={light.autoTurnOnAtStartup ? "success" : "default"}
              onClick={handleToggleAutoTurnOnAtStartup}
              aria-label="toggle auto turn on at startup"
            >
              <StartupIcon />
            </IconButton>
          </Tooltip>
        </Box>
        <IconButton 
          size="small" 
          color="error" 
          onClick={handleDelete}
          aria-label="delete light"
        >
          <DeleteIcon />
        </IconButton>
      </CardActions>
    </Card>
  );
};

export default LightCard;