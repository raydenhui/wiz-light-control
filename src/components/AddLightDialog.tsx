import React, { useState } from 'react';
import { 
  Button, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogTitle, 
  TextField,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import { addLight } from '../services/api';

interface AddLightDialogProps {
  open: boolean;
  onClose: () => void;
  onLightAdded: () => void;
}

const AddLightDialog: React.FC<AddLightDialogProps> = ({ open, onClose, onLightAdded }) => {
  const [ipAddress, setIpAddress] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!ipAddress) {
      setError('IP address is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await addLight(ipAddress, name);
      setIpAddress('');
      setName('');
      onLightAdded();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add light');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIpAddress('');
    setName('');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Add New Wiz Light</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, my: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="IP Address"
            variant="outlined"
            fullWidth
            value={ipAddress}
            onChange={(e) => setIpAddress(e.target.value)}
            placeholder="e.g. 192.168.1.100"
            required
          />
          <TextField
            label="Light Name (Optional)"
            variant="outlined"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Living Room Light"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="inherit" disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          color="primary" 
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          Add Light
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddLightDialog;