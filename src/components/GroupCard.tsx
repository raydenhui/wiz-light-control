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
  Paper,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Button,
  SelectChangeEvent,
  ListItemText,
  Checkbox
} from '@mui/material';
import { 
  Delete as DeleteIcon,
  Lightbulb as LightbulbIcon,
  Edit as EditIcon,
  SaveAlt as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  RemoveCircle as RemoveIcon
} from '@mui/icons-material';
import { LightGroup, Light, toggleGroup, setGroupBrightness, deleteGroup, updateGroup } from '../services/api';
import LightCard from './LightCard';
import './GroupCard.css';

interface GroupCardProps {
  group: LightGroup;
  lights: Light[];
  onDelete: (id: string) => void;
  onUpdate: (group: LightGroup) => void;
}

const GroupCard: React.FC<GroupCardProps> = ({ group, lights, onDelete, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(group.name);
  
  // Filter lights that belong to this group
  const groupLights = lights.filter(light => group.lightIds.includes(light.id));
  
  // Calculate if all lights are on
  const allLightsOn = groupLights.length > 0 && 
    groupLights.every(light => light.status.state === true);
  
  // Initialize group brightness from the first light's brightness, or default to 50
  const calculateAverageBrightness = () => {
    if (groupLights.length === 0) return 50;
    
    const onLights = groupLights.filter(light => light.status.state);
    if (onLights.length === 0) return 50;
    
    const totalBrightness = onLights.reduce((sum, light) => sum + (light.status.dimming || 0), 0);
    return Math.round(totalBrightness / onLights.length);
  };

  // Initialize group brightness state using the calculated average
  const [groupBrightness, setGroupBrightnessState] = useState(calculateAverageBrightness());

  // Update group brightness whenever the lights change
  useEffect(() => {
    setGroupBrightnessState(calculateAverageBrightness());
  }, [lights]);

  // State for light selection
  const [selectedLightIds, setSelectedLightIds] = useState<string[]>([]);
  
  // All lights that can be added to the group (not already in it)
  const availableLights = lights.filter(light => !group.lightIds.includes(light.id));

  // Handle light selection
  const handleLightSelectionChange = (event: SelectChangeEvent<string[]>) => {
    const {
      target: { value },
    } = event;
    setSelectedLightIds(typeof value === 'string' ? value.split(',') : value);
  };
  
  // Add selected lights to the group
  const handleAddSelectedLights = async () => {
    if (selectedLightIds.length === 0) return;
    
    const updatedGroup = {
      ...group,
      lightIds: [...group.lightIds, ...selectedLightIds]
    };
    
    try {
      await updateGroup(updatedGroup);
      onUpdate(updatedGroup);
      setSelectedLightIds([]);
    } catch (error) {
      console.error('Failed to add lights to group', error);
    }
  };
  
  // Remove a light from the group
  const handleRemoveLight = async (lightId: string) => {
    const updatedGroup = {
      ...group,
      lightIds: group.lightIds.filter(id => id !== lightId)
    };
    
    try {
      await updateGroup(updatedGroup);
      onUpdate(updatedGroup);
    } catch (error) {
      console.error('Failed to remove light from group', error);
    }
  };

  // Handle toggle all lights in the group
  const handleToggleGroup = async () => {
    if (groupLights.length === 0) return;
    
    setLoading(true);
    try {
      await toggleGroup(group.id, group.lightIds);
      // No need to update local state here as it will be updated via socket
    } catch (error) {
      console.error('Failed to toggle group lights', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle brightness change for all lights in the group
  const handleBrightnessChange = (event: Event | React.SyntheticEvent<Element, Event>, value: number | number[]) => {
    setGroupBrightnessState(value as number);
  };

  const handleBrightnessChangeCommitted = async (event: Event | React.SyntheticEvent<Element, Event>, value: number | number[]) => {
    if (groupLights.length === 0) return;
    
    const brightness = value as number;
    setLoading(true);
    try {
      await setGroupBrightness(group.id, group.lightIds, brightness);
    } catch (error) {
      console.error('Failed to set group brightness', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle group deletion
  const handleDelete = async () => {
    try {
      await deleteGroup(group.id);
      onDelete(group.id);
    } catch (error) {
      console.error('Failed to delete group', error);
    }
  };

  // Handle group name edit
  const startEditing = () => {
    setIsEditingName(true);
    setEditedName(group.name);
  };

  const cancelEditing = () => {
    setIsEditingName(false);
  };

  const saveEditing = async () => {
    if (!editedName.trim()) return;
    
    try {
      const updatedGroup = { ...group, name: editedName.trim() };
      await updateGroup(updatedGroup);
      onUpdate(updatedGroup);
      setIsEditingName(false);
    } catch (error) {
      console.error('Failed to update group name', error);
    }
  };

  return (
    <Card 
      className={`group-card ${allLightsOn ? 'group-card--active' : ''}`}
      sx={{ 
        boxShadow: 3,
        bgcolor: allLightsOn ? undefined : 'background.paper',
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          {isEditingName ? (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', width: '100%' }}>
              <input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="group-name-input"
                autoFocus
              />
              <IconButton size="small" color="primary" onClick={saveEditing}>
                <SaveIcon />
              </IconButton>
              <IconButton size="small" color="error" onClick={cancelEditing}>
                <CancelIcon />
              </IconButton>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="h5" component="div">
                {group.name}
              </Typography>
              <IconButton size="small" onClick={startEditing} sx={{ ml: 1 }}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Chip 
              label={`${groupLights.length} lights`} 
              size="small" 
              color="primary" 
              variant="outlined"
              sx={{ mr: 2 }}
            />
            {loading ? (
              <CircularProgress size={24} />
            ) : (
              <Switch
                checked={allLightsOn}
                onChange={handleToggleGroup}
                disabled={groupLights.length === 0}
                color="primary"
              />
            )}
          </Box>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <LightbulbIcon sx={{ mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2">
              Group Brightness: {groupBrightness}%
            </Typography>
          </Box>
          <Box 
            className="no-drag-area slider-interactive-elements"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <Slider
              value={groupBrightness}
              onChange={handleBrightnessChange}
              onChangeCommitted={handleBrightnessChangeCommitted}
              min={0}
              max={100}
              disabled={groupLights.length === 0}
              valueLabelDisplay="auto"
              aria-label="Group Brightness"
            />
          </Box>
        </Box>

        <Divider sx={{ mb: 2 }} />
        
        <Typography variant="subtitle1" gutterBottom>
          Lights in this group:
        </Typography>

        <Box sx={{ mb: 3 }}>
          {/* Available lights selection */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <FormControl sx={{ flexGrow: 1 }}>
              <InputLabel id="available-lights-label">Add Lights</InputLabel>
              <Select
                labelId="available-lights-label"
                multiple
                value={selectedLightIds}
                onChange={handleLightSelectionChange}
                input={<OutlinedInput label="Add Lights" />}
                renderValue={(selected) => {
                  const selectedLightNames = selected.map(
                    id => lights.find(light => light.id === id)?.name || id
                  ).join(', ');
                  return selectedLightNames || 'Select lights';
                }}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 250
                    }
                  }
                }}
                disabled={availableLights.length === 0}
              >
                {availableLights.map((light) => (
                  <MenuItem key={light.id} value={light.id}>
                    <Checkbox checked={selectedLightIds.includes(light.id)} />
                    <ListItemText primary={light.name} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button 
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddSelectedLights}
              disabled={selectedLightIds.length === 0}
            >
              Add
            </Button>
          </Box>

          {/* Lights in this group */}
          <Paper
            sx={{
              minHeight: 100,
              p: 1,
              bgcolor: 'rgba(0, 0, 0, 0.02)',
              border: '1px dashed',
              borderColor: 'rgba(0, 0, 0, 0.12)',
              borderRadius: 1
            }}
          >
            {groupLights.length === 0 ? (
              <Typography sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
                No lights in this group. Use the dropdown above to add lights.
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {groupLights.map((light) => (
                  <Box 
                    key={light.id} 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      bgcolor: 'background.paper', 
                      p: 1, 
                      borderRadius: 1,
                      boxShadow: 1
                    }}
                  >
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle2">{light.name}</Typography>
                      <Typography variant="body2" color="text.secondary">{light.ipAddress}</Typography>
                    </Box>
                    <IconButton 
                      color="error" 
                      size="small" 
                      onClick={() => handleRemoveLight(light.id)}
                      aria-label={`remove ${light.name} from group`}
                    >
                      <RemoveIcon />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Box>
      </CardContent>
      
      <CardActions sx={{ justifyContent: 'flex-end' }}>
        <IconButton 
          size="small" 
          color="error" 
          onClick={handleDelete}
          aria-label="delete group"
        >
          <DeleteIcon />
        </IconButton>
      </CardActions>
    </Card>
  );
};

export default GroupCard;