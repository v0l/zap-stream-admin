import React from "react";
import {
  Box,
  Paper,
  Button,
  Typography,
  Alert,
  Container,
  CircularProgress,
} from "@mui/material";
import { useLogin } from "../services/login";

export const LoginForm: React.FC = () => {
  const { loginWithNip07, isLoading, error, isNip07Supported } = useLogin();

  const handleNip07Login = async () => {
    try {
      await loginWithNip07();
    } catch (err) {
      // Error is handled by the hook
    }
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
            disabled={!isNip07Supported || isLoading}
            sx={{ mb: 2 }}
            startIcon={isLoading ? <CircularProgress size={20} /> : null}
          >
            {isLoading ? "Connecting..." : "Login with Nostr Extension"}
          </Button>

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
      </Box>
    </Container>
  );
};
