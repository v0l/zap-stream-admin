import React from "react";
import {
  Grid,
  Paper,
  Typography,
  Box,
  LinearProgress,
  Chip,
} from "@mui/material";
import { NodeInfo } from "../types/websocket";

interface NodeResourceUsageProps {
  nodeMetrics: NodeInfo[];
  isConnected: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

export const NodeResourceUsage: React.FC<NodeResourceUsageProps> = ({
  nodeMetrics,
  isConnected,
}) => {
  if (!isConnected) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Node Resource Usage
        </Typography>
        <Typography color="text.secondary">
          Connect to view node metrics
        </Typography>
      </Paper>
    );
  }

  if (nodeMetrics.length === 0) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Node Resource Usage
        </Typography>
        <Typography color="text.secondary">
          No node metrics available
        </Typography>
      </Paper>
    );
  }

  return (
    <Grid container spacing={2}>
      {nodeMetrics.map((node) => {
        const memoryUsagePercent = (node.memory_used / node.memory_total) * 100;
        const cpuPercent = node.cpu * 100;
        
        return (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4, xl: 3 }} key={node.node_name}>
            <Paper
              sx={{
                p: 1.5,
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 1.5,
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                    {node.node_name}
                  </Typography>
                  <Chip
                    label="Online"
                    color="success"
                    size="small"
                    variant="outlined"
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                </Box>

                {/* CPU Usage */}
                <Box sx={{ mb: 1 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 0.5,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      CPU
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 500 }}>
                      {cpuPercent.toFixed(1)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={cpuPercent}
                    color={cpuPercent > 80 ? "error" : cpuPercent > 60 ? "warning" : "primary"}
                    sx={{ height: 4, borderRadius: 2 }}
                  />
                </Box>

                {/* Memory Usage */}
                <Box sx={{ mb: 1 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 0.5,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Memory
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 500 }}>
                      {memoryUsagePercent.toFixed(1)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={memoryUsagePercent}
                    color={
                      memoryUsagePercent > 80
                        ? "error"
                        : memoryUsagePercent > 60
                        ? "warning"
                        : "primary"
                    }
                    sx={{ height: 4, borderRadius: 2 }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, display: "block", fontSize: '0.7rem' }}>
                    {formatBytes(node.memory_used)} / {formatBytes(node.memory_total)}
                  </Typography>
                </Box>

                {/* Uptime */}
                <Box sx={{ mt: "auto" }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    Uptime: <strong>{formatUptime(node.uptime)}</strong>
                  </Typography>
                </Box>
              </Paper>
          </Grid>
        );
      })}
    </Grid>
  );
};