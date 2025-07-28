export interface WebSocketMessage {
  type: string;
  data: any;
}

export interface AuthMessage extends WebSocketMessage {
  type: "Auth";
  data: {
    token: string;
  };
}

export interface AuthResponse extends WebSocketMessage {
  type: "AuthResponse";
  data: {
    success: boolean;
    is_admin: boolean;
    pubkey: string;
  };
}

export interface SubscribeStreamMessage extends WebSocketMessage {
  type: "SubscribeStream";
  data: {
    stream_id: string;
  };
}

export interface SubscribeOverallMessage extends WebSocketMessage {
  type: "SubscribeOverall";
  data: null;
}

export interface EndpointStats {
  name: string;
  bitrate: number;
}

export interface StreamMetrics {
  stream_id: string;
  started_at: string;
  last_segment_time: string;
  average_fps: number;
  target_fps: number;
  frame_count: number;
  ingress_throughput_bps: number;
  ingress_name: string;
  input_resolution: string;
  ip_address: string;
  viewers?: number;
  endpoint_name?: string;
  endpoint_stats?: Record<string, EndpointStats>;
  timestamp?: number;
}

export interface StreamMetricsMessage extends WebSocketMessage {
  type: "StreamMetrics";
  data: StreamMetrics;
}

export interface OverallMetrics {
  total_streams: number;
  total_viewers: number;
  total_bandwidth: number;
  total_bandwidth_mbps?: number; // New field from API docs
  system_load?: number; // Renamed from cpu_load  
  cpu_load: number; // Keep for backward compatibility
  memory_load: number;
  memory_usage_percent?: number; // New field from API docs
  uptime_seconds: number;
  timestamp: number;
}

export interface OverallMetricsMessage extends WebSocketMessage {
  type: "OverallMetrics";
  data: OverallMetrics;
}

export interface ErrorMessage extends WebSocketMessage {
  type: "Error";
  data: {
    message: string;
  };
}

export type WebSocketIncomingMessage =
  | AuthResponse
  | StreamMetricsMessage
  | OverallMetricsMessage
  | ErrorMessage;

export type WebSocketOutgoingMessage =
  | AuthMessage
  | SubscribeStreamMessage
  | SubscribeOverallMessage;

export interface WebSocketConnectionState {
  connected: boolean;
  authenticated: boolean;
  isAdmin: boolean;
  error: string | null;
  reconnectAttempts: number;
}
