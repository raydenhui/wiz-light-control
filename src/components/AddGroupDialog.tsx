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
import { addGroup } from '../services/api';

interface AddGroupDialogProps {
  open: boolean;
  onClose: () => void;
  onGroupAdded: () => void;
}

const AddGroupDialog: React.FC<AddGroupDialogProps> = ({ open, onClose, onGroupAdded }) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!name) {
      setError('Group name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await addGroup(name);
      setName('');
      onGroupAdded();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add group');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Create New Light Group</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, my: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Group Name"
            variant="outlined"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Living Room Lights"
            required
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
          Create Group
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddGroupDialog;