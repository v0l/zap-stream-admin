import React from "react";
import { Card, CardContent, Typography, Box, Divider } from "@mui/material";
import {
  Visibility,
  NetworkCheck,
  PlayCircleOutline,
} from "@mui/icons-material";
import { OverallMetrics, StreamMetrics } from "../types/websocket";

interface SystemMetricsProps {
  metrics: OverallMetrics | null;
  streams?: StreamMetrics[];
}

export const SystemMetrics: React.FC<SystemMetricsProps> = ({
  metrics,
  streams = [],
}) => {
  const formatBitrate = (bps: number): string => {
    if (bps === 0) return "0 Mbps";
    const mbps = bps / (1000 * 1000);
    return mbps.toFixed(2) + " Mbps";
  };

  // Calculate RTMP and SRT bandwidth separately
  const getRtmpBandwidth = () => {
    return streams.reduce((total, stream) => {
      if (stream.endpoint_stats?.RTMP) {
        return total + stream.endpoint_stats.RTMP.bitrate;
      }
      return total;
    }, 0);
  };

  const getSrtBandwidth = () => {
    return streams.reduce((total, stream) => {
      if (stream.endpoint_stats?.SRT) {
        return total + stream.endpoint_stats.SRT.bitrate;
      }
      return total;
    }, 0);
  };

  const rtmpBandwidth = getRtmpBandwidth();
  const srtBandwidth = getSrtBandwidth();

  // Calculate values from stream data instead of global metrics
  const activeStreams = streams.length;
  const totalViewers = streams.reduce(
    (total, stream) => total + (stream.viewers || 0),
    0,
  );

  return (
    <Box display="flex" flexWrap="wrap" gap={2}>
      {/* System Overview */}
      <Box flex="1 1 300px" minWidth="200px">
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
              {activeStreams}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Box flex="1 1 300px" minWidth="200px">
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
              {totalViewers}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* RTMP and SRT Bandwidth */}
      <Box flex="1 1 300px" minWidth="200px">
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
                RTMP Bandwidth
              </Typography>
            </Box>
            <Typography
              variant="h5"
              color="primary"
              fontWeight="bold"
              align="center"
            >
              {formatBitrate(rtmpBandwidth)}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Box flex="1 1 300px" minWidth="200px">
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
                SRT Bandwidth
              </Typography>
            </Box>
            <Typography
              variant="h5"
              color="primary"
              fontWeight="bold"
              align="center"
            >
              {formatBitrate(srtBandwidth)}
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};
