import React, { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Collapse,
  Avatar,
} from "@mui/material";
import {
  PlayCircleOutline,
  ExpandMore,
  ExpandLess,
  Videocam,
  Speed,
  AspectRatio,
} from "@mui/icons-material";
import { StreamMetrics } from "../types/websocket";

interface StreamListProps {
  streams: StreamMetrics[];
  isConnected: boolean;
}

interface StreamRowProps {
  stream: StreamMetrics;
}

const StreamRow: React.FC<StreamRowProps> = ({ stream }) => {
  const [expanded, setExpanded] = useState(false);

  const formatBitrate = (bps: number): string => {
    if (bps === 0) return "0 Mbps";
    const mbps = bps / (1000 * 1000);
    return mbps.toFixed(2) + " Mbps";
  };

  const getStreamHealth = (fps: number, targetFps: number): "good" | "warning" | "error" => {
    if (fps >= targetFps * 0.95) return "good";
    if (fps >= targetFps * 0.7) return "warning";
    return "error";
  };

  const getHealthColor = (health: "good" | "warning" | "error") => {
    switch (health) {
      case "good": return "success";
      case "warning": return "warning";
      case "error": return "error";
    }
  };

  const health = getStreamHealth(stream.average_fps, stream.target_fps);
  const isLive = new Date().getTime() - new Date(stream.last_segment_time).getTime() < 10000;

  return (
    <>
      <TableRow hover>
        <TableCell>
          <Box display="flex" alignItems="center">
            <Avatar sx={{ mr: 2, bgcolor: isLive ? "success.main" : "grey.400" }}>
              <PlayCircleOutline />
            </Avatar>
            <Box>
              <Typography variant="body1" fontWeight="medium">
                {stream.stream_id}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {stream.ingress_name}
              </Typography>
            </Box>
          </Box>
        </TableCell>
        <TableCell>
          <Box display="flex" alignItems="center">
            <Typography variant="body2" fontWeight="medium">
              {stream.average_fps.toFixed(1)} FPS
            </Typography>
            <Chip
              label={health}
              color={getHealthColor(health)}
              size="small"
              sx={{ ml: 1 }}
            />
          </Box>
        </TableCell>
        <TableCell>
          <Typography variant="body2">
            {stream.input_resolution}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2">
            {formatBitrate(stream.ingress_throughput_bps)}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2">
            {new Date(stream.started_at).toLocaleString()}
          </Typography>
        </TableCell>
        <TableCell>
          <IconButton
            size="small"
            onClick={() => setExpanded(!expanded)}
            aria-label="expand"
          >
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Stream Details
              </Typography>
              <Box display="flex" gap={3} flexWrap="wrap">
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Frame Count
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {stream.frame_count.toLocaleString()}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Last Segment
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {new Date(stream.last_segment_time).toLocaleTimeString()}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Ingress Type
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {stream.ingress_name}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    IP Address
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {stream.ip_address}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

export const StreamList: React.FC<StreamListProps> = ({ streams, isConnected }) => {
  if (!isConnected) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <Videocam color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">Active Streams</Typography>
          </Box>
          <Typography variant="body1" color="text.secondary">
            WebSocket connection required to view real-time stream data
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (streams.length === 0) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <Videocam color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">Active Streams</Typography>
          </Box>
          <Box textAlign="center" py={4}>
            <PlayCircleOutline sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No active streams
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Streams will appear here when users start broadcasting
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Box display="flex" alignItems="center">
            <Videocam color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">Active Streams</Typography>
          </Box>
          <Chip
            label={`${streams.length} active`}
            color="primary"
            size="small"
          />
        </Box>

        <TableContainer component={Paper} elevation={0}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Stream</TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <Speed sx={{ mr: 0.5, fontSize: 16 }} />
                    FPS
                  </Box>
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <AspectRatio sx={{ mr: 0.5, fontSize: 16 }} />
                    Resolution
                  </Box>
                </TableCell>
                <TableCell>Bitrate</TableCell>
                <TableCell>Started</TableCell>
                <TableCell width={48}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {streams.map((stream) => (
                <StreamRow key={stream.stream_id} stream={stream} />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};