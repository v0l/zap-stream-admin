import React from "react";
import {
  Box,
  Paper,
  Button,
  Typography,
  Alert,
  Container,
  CircularProgress,
  Divider,
  FormControl,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Storage as ServerIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  NetworkCheck as TestIcon,
} from "@mui/icons-material";
import { useLogin } from "../services/login";
import { ServerSelectorDialog } from "./ServerSelectorDialog";
import {
  getAPIEndpoints,
  getSelectedAPIEndpoint,
  setSelectedAPIEndpoint,
  testAPIEndpointConnectivity,
} from "../services/api";
import { Nip7Signer } from "@snort/system";

export const LoginForm: React.FC = () => {
  const { loginWithNip07, isLoading, error, isNip07Supported } = useLogin();
  const [apiEndpoints, setApiEndpoints] = React.useState(() => getAPIEndpoints());
  const [selectedEndpoint, setSelectedEndpointState] = React.useState(() =>
    getSelectedAPIEndpoint(),
  );
  const [showServerDialog, setShowServerDialog] = React.useState(false);
  const [testingConnection, setTestingConnection] = React.useState(false);
  const [connectionStatus, setConnectionStatus] = React.useState<{ success: boolean; message: string; responseTime?: number } | null>(null);

  const handleNip07Login = async () => {
    // Test connectivity before attempting login
    if (!connectionStatus || !connectionStatus.success) {
      setTestingConnection(true);
      try {
        const signer = new Nip7Signer();
        await signer.getPubKey();

        const result = await testAPIEndpointConnectivity(selectedEndpoint.url, signer);
        setConnectionStatus(result);

        if (!result.success) {
          setTestingConnection(false);
          return; // Don't proceed with login if connection fails
        }
      } catch (err) {
        setConnectionStatus({
          success: false,
          message: err instanceof Error ? err.message : "Connection test failed"
        });
        setTestingConnection(false);
        return;
      }
      setTestingConnection(false);
    }

    try {
      await loginWithNip07();
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const handleEndpointChange = (endpointId: string) => {
    setSelectedAPIEndpoint(endpointId);
    const updatedEndpoints = getAPIEndpoints();
    const newSelectedEndpoint = updatedEndpoints.find((ep) => ep.id === endpointId) || updatedEndpoints[0];

    setApiEndpoints(updatedEndpoints);
    setSelectedEndpointState(newSelectedEndpoint);

    // Clear connection status when endpoint changes
    setConnectionStatus(null);
  };

  const handleServerDialogClose = () => {
    setShowServerDialog(false);
    // Refresh endpoints in case they were modified
    const updatedEndpoints = getAPIEndpoints();
    const currentSelected = getSelectedAPIEndpoint();
    setApiEndpoints(updatedEndpoints);
    setSelectedEndpointState(currentSelected);

    // Clear connection status when endpoints might have changed
    setConnectionStatus(null);
  };

  return (
    <Container maxWidth="sm">
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <Paper sx={{ p: 4, width: "100%", maxWidth: 400 }}>
          <Box textAlign="center" mb={3}>
            <Typography variant="h4" gutterBottom color="primary">
              zap.stream Admin
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sign in with your Nostr extension to access the admin panel
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {!isNip07Supported && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              No Nostr extension detected. Please install a NIP-07 compatible
              browser extension like Alby, nos2x, or similar.
            </Alert>
          )}

          <Button
            onClick={handleNip07Login}
            fullWidth
            variant="contained"
            size="large"
            disabled={!isNip07Supported || isLoading || testingConnection}
            sx={{ mb: 2 }}
            startIcon={(isLoading || testingConnection) ? <CircularProgress size={20} /> : null}
          >
            {testingConnection ? "Testing Connection..." : isLoading ? "Connecting..." : "Login with Nostr Extension"}
          </Button>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              API Server
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <FormControl size="small" sx={{ flexGrow: 1 }}>
                <Select
                  value={selectedEndpoint.id}
                  onChange={(e) => handleEndpointChange(e.target.value)}
                  variant="outlined"
                  size="small"
                  renderValue={(value) => {
                    const endpoint = apiEndpoints.find((ep) => ep.id === value);
                    return (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <ServerIcon fontSize="small" />
                        <Typography variant="body2">
                          {endpoint?.name || "Unknown"}
                        </Typography>
                        {connectionStatus && (
                          <Tooltip title={`${connectionStatus.message}${connectionStatus.responseTime ? ` (${connectionStatus.responseTime}ms)` : ""}`}>
                            {connectionStatus.success ? (
                              <CheckIcon color="success" fontSize="small" />
                            ) : (
                              <ErrorIcon color="error" fontSize="small" />
                            )}
                          </Tooltip>
                        )}
                      </Box>
                    );
                  }}
                >
                  {apiEndpoints.map((endpoint) => (
                    <MenuItem key={endpoint.id} value={endpoint.id}>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-start",
                        }}
                      >
                        <Typography variant="body2" fontWeight="medium">
                          {endpoint.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {endpoint.url}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <IconButton
                size="small"
                onClick={() => setShowServerDialog(true)}
                title="Manage API Endpoints"
              >
                <SettingsIcon fontSize="small" />
              </IconButton>
            </Box>

            {connectionStatus && !connectionStatus.success && (
              <Alert severity="error" sx={{ mt: 1, fontSize: '0.875rem' }}>
                {connectionStatus.message}
              </Alert>
            )}
          </Box>

          <Box mt={2}>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
            >
              Note: You must have admin privileges to access this panel.
              Authentication uses NIP-07 browser extensions with dynamic NIP-98
              request signing.
            </Typography>
          </Box>
        </Paper>

        <ServerSelectorDialog
          open={showServerDialog}
          onClose={handleServerDialogClose}
          onEndpointChange={handleEndpointChange}
        />
      </Box>
    </Container>
  );
};
