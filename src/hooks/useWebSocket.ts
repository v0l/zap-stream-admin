import { useState, useEffect, useRef } from "react";
import { EventSigner, EventBuilder } from "@snort/system";
import { OverallMetrics, StreamMetrics, NodeInfo } from "../types/websocket";
import { getSelectedAPIEndpoint } from "../services/api";

function getWebSocketURL(): string {
  const endpoint = getSelectedAPIEndpoint();
  return endpoint.url.replace(/^https:/, "wss:").replace(/^http:/, "ws:");
}

export function useWebSocket(signer: EventSigner | null) {
  const [metrics, setMetrics] = useState<OverallMetrics | null>(null);
  const [streams, setStreams] = useState<StreamMetrics[]>([]);
  const [nodeMetrics, setNodeMetrics] = useState<NodeInfo[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Clean up stale streams periodically
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      setStreams((prevStreams) =>
        prevStreams.filter((stream) => {
          const lastUpdate = new Date(stream.last_update).getTime();
          const age = now - lastUpdate;
          // Remove streams that haven't updated in 120 seconds (2 minutes)
          return age < 120000;
        }),
      );
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [isConnected]);

  useEffect(() => {
    if (!signer) return;

    const wsUrl = `${getWebSocketURL()}/api/v1/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = async () => {
      console.log("WebSocket connected");
      setIsConnected(true);
      setError(null);

      // Authenticate
      try {
        const authEvent = await new EventBuilder()
          .kind(27235)
          .content("")
          .tag(["u", wsUrl])
          .tag(["method", "GET"])
          .buildAndSign(signer);

        ws.send(
          JSON.stringify({
            type: "Auth",
            data: { token: btoa(JSON.stringify(authEvent)) },
          }),
        );
      } catch (error) {
        console.error("Auth failed:", error);
        setError("Authentication failed");
      }
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        switch (message.type) {
          case "AuthResponse":
            if (message.data.success) {
              setIsAdmin(message.data.is_admin);
              if (message.data.is_admin) {
                // Subscribe to overall metrics
                ws.send(
                  JSON.stringify({
                    type: "SubscribeOverall",
                    data: null,
                  }),
                );
              }
            } else {
              setError("Authentication failed");
            }
            break;

          case "OverallMetrics":
            setMetrics(message.data);
            break;

          case "StreamMetrics":
            // Update individual stream in the streams array
            setStreams((prevStreams) => {
              const streamId = message.data.stream_id;
              const existingIndex = prevStreams.findIndex(
                (s) => s.stream_id === streamId,
              );

              if (existingIndex >= 0) {
                // Update existing stream
                const newStreams = [...prevStreams];
                newStreams[existingIndex] = message.data;
                return newStreams;
              } else {
                // Add new stream
                return [...prevStreams, message.data];
              }
            });
            break;

          case "NodeMetrics":
            // Update node metrics
            setNodeMetrics((prevNodes) => {
              const nodeName = message.data.node_name;
              const existingIndex = prevNodes.findIndex(
                (n) => n.node_name === nodeName,
              );

              if (existingIndex >= 0) {
                // Update existing node
                const newNodes = [...prevNodes];
                newNodes[existingIndex] = message.data;
                return newNodes;
              } else {
                // Add new node
                return [...prevNodes, message.data];
              }
            });
            break;

          case "Error":
            setError(message.data.message);
            break;
        }
      } catch (error) {
        console.error("Message parse error:", error);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
      setIsAdmin(false);
      setMetrics(null);
      setStreams([]);
      setNodeMetrics([]);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setError("Connection error");
    };

    return () => {
      ws.close();
    };
  }, [signer]);

  return { metrics, streams, nodeMetrics, isConnected, isAdmin, error };
}
