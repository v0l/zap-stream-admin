import React from "react";
import { Card, CardContent, Typography, Box, Grid } from "@mui/material";
import {
  Computer,
  Memory,
  AccessTime,
  Visibility,
  NetworkCheck,
  PlayCircleOutline,
} from "@mui/icons-material";
import { OverallMetrics } from "../types/websocket";

interface SystemMetricsProps {
  metrics: OverallMetrics | null;
}

export const SystemMetrics: React.FC<SystemMetricsProps> = ({ metrics }) => {
  const formatBitrate = (bps: number): string => {
    if (bps === 0) return "0 Mbps";
    const mbps = bps / (1000 * 1000);
    return mbps.toFixed(2) + " Mbps";
  };

  const formatUptime = (seconds: number): string => {
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
  };

  return (
    <Grid container spacing={2}>
      {/* System Overview */}
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ height: "100px" }}>
          <CardContent
            sx={{
              py: 1.5,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <Box display="flex" alignItems="center">
              <PlayCircleOutline color="primary" sx={{ mr: 1, fontSize: 18 }} />
              <Typography variant="subtitle2" fontWeight="medium">
                Active Streams
              </Typography>
            </Box>
            <Typography
              variant="h4"
              color="primary"
              fontWeight="bold"
              align="center"
            >
              {metrics?.total_streams ?? "-"}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ height: "100px" }}>
          <CardContent
            sx={{
              py: 1.5,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <Box display="flex" alignItems="center">
              <Visibility color="primary" sx={{ mr: 1, fontSize: 18 }} />
              <Typography variant="subtitle2" fontWeight="medium">
                Total Viewers
              </Typography>
            </Box>
            <Typography
              variant="h4"
              color="primary"
              fontWeight="bold"
              align="center"
            >
              {metrics?.total_viewers ?? "-"}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ height: "100px" }}>
          <CardContent
            sx={{
              py: 1.5,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <Box display="flex" alignItems="center">
              <NetworkCheck color="primary" sx={{ mr: 1, fontSize: 18 }} />
              <Typography variant="subtitle2" fontWeight="medium">
                Bandwidth
              </Typography>
            </Box>
            <Typography
              variant="h5"
              color="primary"
              fontWeight="bold"
              align="center"
            >
              {metrics ? formatBitrate(metrics.total_bandwidth) : "-"}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ height: "100px" }}>
          <CardContent
            sx={{
              py: 1.5,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <Box display="flex" alignItems="center">
              <AccessTime color="primary" sx={{ mr: 1, fontSize: 18 }} />
              <Typography variant="subtitle2" fontWeight="medium">
                Uptime
              </Typography>
            </Box>
            <Typography
              variant="h5"
              color="primary"
              fontWeight="bold"
              align="center"
            >
              {metrics ? formatUptime(metrics.uptime_seconds) : "-"}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* System Resources */}
      <Grid item xs={12} md={6}>
        <Card sx={{ height: "100px" }}>
          <CardContent
            sx={{
              py: 1.5,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <Box display="flex" alignItems="center">
              <Computer color="primary" sx={{ mr: 1, fontSize: 18 }} />
              <Typography variant="subtitle2" fontWeight="medium">
                CPU Load
              </Typography>
            </Box>
            <Typography
              variant="h4"
              color={
                (metrics?.cpu_load ?? 0) > 0.8
                  ? "error"
                  : (metrics?.cpu_load ?? 0) > 0.5
                    ? "warning"
                    : "success"
              }
              fontWeight="bold"
              align="center"
            >
              {Math.round((metrics?.cpu_load ?? 0) * 100)}%
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card sx={{ height: "100px" }}>
          <CardContent
            sx={{
              py: 1.5,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <Box display="flex" alignItems="center">
              <Memory color="primary" sx={{ mr: 1, fontSize: 18 }} />
              <Typography variant="subtitle2" fontWeight="medium">
                Memory Load
              </Typography>
            </Box>
            <Typography
              variant="h4"
              color={
                (metrics?.memory_load ?? 0) > 0.8
                  ? "error"
                  : (metrics?.memory_load ?? 0) > 0.5
                    ? "warning"
                    : "success"
              }
              fontWeight="bold"
              align="center"
            >
              {Math.round((metrics?.memory_load ?? 0) * 100)}%
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};
