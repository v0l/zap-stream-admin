import React from "react";
import { Container, Typography, Box, Paper } from "@mui/material";
import { useLogin } from "../services/login";
import { useWebSocket } from "../hooks/useWebSocket";
import { SystemMetrics } from "../components/SystemMetrics";
import { StreamList } from "../components/StreamList";

export const DashboardPage: React.FC = () => {
  const { signer } = useLogin();
  const { metrics, streams, isConnected, isAdmin, error } = useWebSocket(
    signer || null,
  );

  return (
    <Container maxWidth="xl" sx={{ mt: 3 }}>
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          Admin Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Real-time system monitoring and stream management
        </Typography>
      </Box>

      {/* System Metrics Overview */}
      <Box mb={3}>
        <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
          System Overview
        </Typography>
        <SystemMetrics metrics={metrics} streams={streams} />
      </Box>

      {/* Active Streams */}
      <Box mb={3}>
        <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
          Live Streams
        </Typography>
        <StreamList streams={streams} isConnected={isConnected} />
      </Box>

      {/* Connection Status and Errors */}
      {error && (
        <Box mb={4}>
          <Paper
            sx={{ p: 3, bgcolor: "error.light", color: "error.contrastText" }}
          >
            <Typography variant="h6" gutterBottom>
              Connection Error
            </Typography>
            <Typography variant="body2">{error}</Typography>
          </Paper>
        </Box>
      )}
    </Container>
  );
};
