import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Box,
  Typography,
  Radio,
  Chip,
  Alert,
  Divider,
  LinearProgress,
  Tooltip,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Storage as ServerIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  NetworkCheck as TestIcon,
} from "@mui/icons-material";
import {
  APIEndpoint,
  getAPIEndpoints,
  getSelectedAPIEndpoint,
  setSelectedAPIEndpoint,
  addAPIEndpoint,
  removeAPIEndpoint,
  testAPIEndpointConnectivity,
} from "../services/api";
import { useLogin } from "../services/login";

interface ServerSelectorDialogProps {
  open: boolean;
  onClose: () => void;
  onEndpointChange: (endpointId: string) => void;
}

interface NewEndpointForm {
  id: string;
  name: string;
  url: string;
}

export const ServerSelectorDialog: React.FC<ServerSelectorDialogProps> = ({
  open,
  onClose,
  onEndpointChange,
}) => {
  const { signer } = useLogin();
  const [endpoints, setEndpoints] = React.useState<APIEndpoint[]>([]);
  const [selectedEndpoint, setSelectedEndpointState] = React.useState<APIEndpoint | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editForm, setEditForm] = React.useState<NewEndpointForm>({ id: "", name: "", url: "" });
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [newEndpoint, setNewEndpoint] = React.useState<NewEndpointForm>({ id: "", name: "", url: "" });
  const [error, setError] = React.useState<string>("");
  const [testingConnectivity, setTestingConnectivity] = React.useState<string | null>(null);
  const [connectivityResults, setConnectivityResults] = React.useState<Record<string, { success: boolean; message: string; responseTime?: number }>>({});

  React.useEffect(() => {
    if (open) {
      const currentEndpoints = getAPIEndpoints();
      const current = getSelectedAPIEndpoint();
      setEndpoints(currentEndpoints);
      setSelectedEndpointState(current);
    }
  }, [open]);

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return url.startsWith("http://") || url.startsWith("https://");
    } catch {
      return false;
    }
  };

  const generateId = (name: string): string => {
    return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  };

  const testEndpointConnectivity = async (url: string, endpointId?: string) => {
    const testId = endpointId || "new";
    setTestingConnectivity(testId);
    setError("");

    try {
      const result = await testAPIEndpointConnectivity(url, signer!);
      setConnectivityResults(prev => ({
        ...prev,
        [testId]: result
      }));

      if (!result.success) {
        setError(`Connection test failed: ${result.message}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Connection test failed";
      setConnectivityResults(prev => ({
        ...prev,
        [testId]: { success: false, message: errorMessage }
      }));
      setError(`Connection test failed: ${errorMessage}`);
    } finally {
      setTestingConnectivity(null);
    }
  };

  const handleSelectEndpoint = (endpointId: string) => {
    const endpoint = endpoints.find((ep) => ep.id === endpointId);
    if (endpoint) {
      setSelectedEndpointState(endpoint);
    }
  };

  const handleSaveAndClose = () => {
    if (!selectedEndpoint) {
      setError("Please select an endpoint");
      return;
    }

    setSelectedAPIEndpoint(selectedEndpoint.id);
    onEndpointChange(selectedEndpoint.id);
    onClose();
  };

  const handleAddEndpoint = async () => {
    setError("");

    if (!newEndpoint.name.trim()) {
      setError("Endpoint name is required");
      return;
    }

    if (!newEndpoint.url.trim()) {
      setError("Endpoint URL is required");
      return;
    }

    if (!validateUrl(newEndpoint.url)) {
      setError("Please enter a valid HTTP/HTTPS URL");
      return;
    }

    const id = newEndpoint.id.trim() || generateId(newEndpoint.name);

    if (endpoints.find((ep) => ep.id === id)) {
      setError("An endpoint with this ID already exists");
      return;
    }

    // Test connectivity before adding
    await testEndpointConnectivity(newEndpoint.url, "new");
    const testResult = connectivityResults["new"];

    if (testResult && !testResult.success) {
      setError(`Cannot add endpoint: ${testResult.message}`);
      return;
    }

    const endpoint: APIEndpoint = {
      id,
      name: newEndpoint.name.trim(),
      url: newEndpoint.url.trim(),
    };

    addAPIEndpoint(endpoint);
    const updatedEndpoints = getAPIEndpoints();
    setEndpoints(updatedEndpoints);
    setNewEndpoint({ id: "", name: "", url: "" });
    setShowAddForm(false);
    // Clear the test result for the new endpoint
    setConnectivityResults(prev => {
      const { "new": _, ...rest } = prev;
      return rest;
    });
  };

  const handleEditEndpoint = (endpoint: APIEndpoint) => {
    setEditingId(endpoint.id);
    setEditForm({ ...endpoint });
    setError("");
  };

  const handleSaveEdit = () => {
    setError("");

    if (!editForm.name.trim()) {
      setError("Endpoint name is required");
      return;
    }

    if (!editForm.url.trim()) {
      setError("Endpoint URL is required");
      return;
    }

    if (!validateUrl(editForm.url)) {
      setError("Please enter a valid HTTP/HTTPS URL");
      return;
    }

    const updatedEndpoint: APIEndpoint = {
      id: editForm.id,
      name: editForm.name.trim(),
      url: editForm.url.trim(),
    };

    addAPIEndpoint(updatedEndpoint);
    const updatedEndpoints = getAPIEndpoints();
    setEndpoints(updatedEndpoints);

    if (selectedEndpoint?.id === editForm.id) {
      setSelectedEndpointState(updatedEndpoint);
    }

    setEditingId(null);
    setEditForm({ id: "", name: "", url: "" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ id: "", name: "", url: "" });
    setError("");
  };

  const handleDeleteEndpoint = (endpointId: string) => {
    const isDefault = ["production", "backup", "local"].includes(endpointId);

    if (isDefault) {
      setError("Cannot delete default endpoints");
      return;
    }

    removeAPIEndpoint(endpointId);
    const updatedEndpoints = getAPIEndpoints();
    setEndpoints(updatedEndpoints);

    if (selectedEndpoint?.id === endpointId) {
      setSelectedEndpointState(updatedEndpoints[0] || null);
    }
  };

  const isDefaultEndpoint = (id: string) => {
    return ["production", "backup", "local"].includes(id);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <ServerIcon />
          API Server Configuration
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Select an API server and manage your endpoints. Changes will take effect after clicking "Save & Apply".
        </Typography>

        <List sx={{ maxHeight: 400, overflow: "auto" }}>
          {endpoints.map((endpoint) => (
            <ListItem
              key={endpoint.id}
              sx={{
                border: 1,
                borderColor: selectedEndpoint?.id === endpoint.id ? "primary.main" : "divider",
                borderRadius: 1,
                mb: 1,
                bgcolor: selectedEndpoint?.id === endpoint.id ? "action.selected" : "background.paper",
                display: "flex",
                alignItems: "center",
              }}
            >
              <Radio
                checked={selectedEndpoint?.id === endpoint.id}
                onChange={() => handleSelectEndpoint(endpoint.id)}
                sx={{ mr: 1 }}
              />

              {editingId === endpoint.id ? (
                <Box sx={{ flexGrow: 1 }}>
                  <TextField
                    fullWidth
                    label="Name"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    size="small"
                    sx={{ mb: 1 }}
                  />
                  <TextField
                    fullWidth
                    label="URL"
                    value={editForm.url}
                    onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                    size="small"
                    placeholder="https://api.example.com"
                  />
                </Box>
              ) : (
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {endpoint.name}
                      {isDefaultEndpoint(endpoint.id) && (
                        <Chip label="Default" size="small" variant="outlined" />
                      )}
                      {connectivityResults[endpoint.id] && (
                        <Tooltip title={`${connectivityResults[endpoint.id].message}${connectivityResults[endpoint.id].responseTime ? ` (${connectivityResults[endpoint.id].responseTime}ms)` : ""}`}>
                          {connectivityResults[endpoint.id].success ? (
                            <CheckIcon color="success" fontSize="small" />
                          ) : (
                            <ErrorIcon color="error" fontSize="small" />
                          )}
                        </Tooltip>
                      )}
                    </Box>
                  }
                  secondary={endpoint.url}
                  sx={{ flexGrow: 1 }}
                />
              )}

              <Box sx={{ ml: 1 }}>
                {editingId === endpoint.id ? (
                  <Box>
                    <IconButton onClick={handleSaveEdit} color="primary" size="small">
                      <SaveIcon />
                    </IconButton>
                    <IconButton onClick={handleCancelEdit} size="small">
                      <CancelIcon />
                    </IconButton>
                  </Box>
                ) : (
                  <Box>
                    <IconButton
                      onClick={() => testEndpointConnectivity(endpoint.url, endpoint.id)}
                      size="small"
                      disabled={testingConnectivity === endpoint.id}
                      title="Test connection"
                    >
                      {testingConnectivity === endpoint.id ? (
                        <LinearProgress sx={{ width: 16, height: 16, borderRadius: 1 }} />
                      ) : (
                        <TestIcon />
                      )}
                    </IconButton>
                    <IconButton onClick={() => handleEditEndpoint(endpoint)} size="small">
                      <EditIcon />
                    </IconButton>
                    {!isDefaultEndpoint(endpoint.id) && (
                      <IconButton
                        onClick={() => handleDeleteEndpoint(endpoint.id)}
                        size="small"
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Box>
                )}
              </Box>
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 2 }} />

        {showAddForm ? (
          <Box sx={{ p: 2, border: 1, borderColor: "divider", borderRadius: 1 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Add New Endpoint
            </Typography>
            <TextField
              fullWidth
              label="Name"
              value={newEndpoint.name}
              onChange={(e) => setNewEndpoint({ ...newEndpoint, name: e.target.value })}
              size="small"
              sx={{ mb: 2 }}
              placeholder="My API Server"
            />
            <TextField
              fullWidth
              label="URL"
              value={newEndpoint.url}
              onChange={(e) => setNewEndpoint({ ...newEndpoint, url: e.target.value })}
              size="small"
              sx={{ mb: 2 }}
              placeholder="https://api.example.com"
            />
            <TextField
              fullWidth
              label="ID (optional)"
              value={newEndpoint.id}
              onChange={(e) => setNewEndpoint({ ...newEndpoint, id: e.target.value })}
              size="small"
              sx={{ mb: 2 }}
              placeholder="Auto-generated from name"
              helperText="Leave empty to auto-generate from name"
            />
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <Button
                onClick={() => testEndpointConnectivity(newEndpoint.url, "new")}
                variant="outlined"
                size="small"
                disabled={!validateUrl(newEndpoint.url) || testingConnectivity === "new"}
                startIcon={testingConnectivity === "new" ? <LinearProgress sx={{ width: 16, height: 16, borderRadius: 1 }} /> : <TestIcon />}
              >
                {testingConnectivity === "new" ? "Testing..." : "Test"}
              </Button>
              <Button
                onClick={handleAddEndpoint}
                variant="contained"
                size="small"
                disabled={testingConnectivity === "new"}
              >
                Add Endpoint
              </Button>
              <Button onClick={() => {
                setShowAddForm(false);
                setNewEndpoint({ id: "", name: "", url: "" });
                setError("");
                setConnectivityResults(prev => {
                  const { "new": _, ...rest } = prev;
                  return rest;
                });
              }} size="small">
                Cancel
              </Button>
            </Box>

            {connectivityResults["new"] && (
              <Alert
                severity={connectivityResults["new"].success ? "success" : "error"}
                sx={{ mt: 1 }}
              >
                {connectivityResults["new"].message}
                {connectivityResults["new"].responseTime && (
                  <Typography variant="caption" sx={{ ml: 1 }}>
                    ({connectivityResults["new"].responseTime}ms)
                  </Typography>
                )}
              </Alert>
            )}
          </Box>
        ) : (
          <Button
            startIcon={<AddIcon />}
            onClick={() => setShowAddForm(true)}
            variant="outlined"
            fullWidth
          >
            Add New Endpoint
          </Button>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSaveAndClose} variant="contained">
          Save & Apply
        </Button>
      </DialogActions>
    </Dialog>
  );
};