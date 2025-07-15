import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Chip,
  IconButton,
  Stack,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { useLogin } from "../services/login";
import { IngestEndpoint, IngestEndpointCreateRequest, IngestEndpointUpdateRequest } from "../services/api";

interface IngestEndpointModalProps {
  open: boolean;
  endpoint?: IngestEndpoint | null;
  onClose: () => void;
  onSuccess: () => void;
}

const COMMON_CAPABILITIES = [
  "variant:source",
  "variant:1080:5000000",
  "variant:720:3000000",
  "variant:480:1500000",
  "variant:360:800000",
  "dvr:720",
  "dvr:1080",
];

export const IngestEndpointModal: React.FC<IngestEndpointModalProps> = ({
  open,
  endpoint,
  onClose,
  onSuccess,
}) => {
  const { api } = useLogin();
  const [name, setName] = useState("");
  const [cost, setCost] = useState("");
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [newCapability, setNewCapability] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!endpoint;

  useEffect(() => {
    if (open) {
      if (endpoint) {
        setName(endpoint.name);
        setCost(endpoint.cost.toString());
        setCapabilities([...endpoint.capabilities]);
      } else {
        setName("");
        setCost("");
        setCapabilities([]);
      }
      setNewCapability("");
      setError(null);
    }
  }, [open, endpoint]);

  const handleAddCapability = (capability: string) => {
    if (capability && !capabilities.includes(capability)) {
      setCapabilities([...capabilities, capability]);
      setNewCapability("");
    }
  };

  const handleRemoveCapability = (capabilityToRemove: string) => {
    setCapabilities(capabilities.filter(cap => cap !== capabilityToRemove));
  };

  const handleAddCustomCapability = () => {
    if (newCapability.trim()) {
      handleAddCapability(newCapability.trim());
    }
  };

  const handleSubmit = async () => {
    if (!api) return;

    const costNumber = parseFloat(cost);
    if (!name.trim() || isNaN(costNumber) || costNumber < 0) {
      setError("Please provide a valid name and cost");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const endpointData = {
        name: name.trim(),
        cost: Math.round(costNumber), // Ensure it's an integer (millisatoshis)
        capabilities: capabilities.length > 0 ? capabilities : undefined,
      };

      if (isEditing && endpoint) {
        await api.updateIngestEndpoint(endpoint.id, endpointData as IngestEndpointUpdateRequest);
      } else {
        await api.createIngestEndpoint(endpointData as IngestEndpointCreateRequest);
      }

      onSuccess();
    } catch (err) {
      console.error("Error saving ingest endpoint:", err);
      setError(err instanceof Error ? err.message : "Failed to save ingest endpoint");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && newCapability.trim()) {
      event.preventDefault();
      handleAddCustomCapability();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {isEditing ? "Edit Ingest Endpoint" : "Create Ingest Endpoint"}
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            autoFocus
            margin="normal"
            label="Name"
            fullWidth
            variant="outlined"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            required
          />

          <TextField
            margin="normal"
            label="Cost per Minute (millisatoshis)"
            fullWidth
            variant="outlined"
            type="number"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            disabled={loading}
            required
            inputProps={{ min: 0, step: 1000 }}
            helperText="Cost in millisatoshis charged per minute of streaming"
          />

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Capabilities
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Common capabilities:
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              {COMMON_CAPABILITIES.map((cap) => (
                <Button
                  key={cap}
                  size="small"
                  variant={capabilities.includes(cap) ? "contained" : "outlined"}
                  onClick={() => 
                    capabilities.includes(cap) 
                      ? handleRemoveCapability(cap)
                      : handleAddCapability(cap)
                  }
                  sx={{ mr: 1, mb: 1 }}
                  disabled={loading}
                >
                  {cap}
                </Button>
              ))}
            </Box>

            <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
              <TextField
                size="small"
                label="Custom capability"
                value={newCapability}
                onChange={(e) => setNewCapability(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                placeholder="e.g., variant:1440:8000000"
                sx={{ flexGrow: 1 }}
              />
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddCustomCapability}
                disabled={loading || !newCapability.trim()}
              >
                Add
              </Button>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Selected capabilities:
            </Typography>
            
            <Box>
              {capabilities.length === 0 ? (
                <Typography variant="body2" color="text.secondary" fontStyle="italic">
                  No capabilities selected
                </Typography>
              ) : (
                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
                  {capabilities.map((cap) => (
                    <Chip
                      key={cap}
                      label={cap}
                      onDelete={() => handleRemoveCapability(cap)}
                      deleteIcon={<DeleteIcon />}
                      variant="outlined"
                      disabled={loading}
                    />
                  ))}
                </Stack>
              )}
            </Box>
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Capability Format Examples:</strong><br />
              • <code>variant:source</code> - Include source quality<br />
              • <code>variant:720:3000000</code> - 720p at 3Mbps<br />
              • <code>variant:1080:5000000</code> - 1080p at 5Mbps<br />
              • <code>dvr:720</code> - Enable DVR recording at 720p
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading || !name.trim() || !cost}
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          {isEditing ? "Update" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};