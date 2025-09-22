import { EventSigner, EventBuilder } from "@snort/system";

export interface APIEndpoint {
  id: string;
  name: string;
  url: string;
}

const DEFAULT_API_ENDPOINTS: APIEndpoint[] = [
  { id: "production", name: "Production", url: "https://api-core.zap.stream" },
];

const STORAGE_KEY = "zap-stream-api-endpoints";
const SELECTED_ENDPOINT_KEY = "zap-stream-selected-endpoint";

function getStoredEndpoints(): APIEndpoint[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_API_ENDPOINTS;
  } catch {
    return DEFAULT_API_ENDPOINTS;
  }
}

function getSelectedEndpointId(): string {
  return localStorage.getItem(SELECTED_ENDPOINT_KEY) || "production";
}

export function getAPIEndpoints(): APIEndpoint[] {
  return getStoredEndpoints();
}

export function setAPIEndpoints(endpoints: APIEndpoint[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(endpoints));
}

export function getSelectedAPIEndpoint(): APIEndpoint {
  const endpoints = getStoredEndpoints();
  const selectedId = getSelectedEndpointId();
  return endpoints.find((ep) => ep.id === selectedId) || endpoints[0];
}

export function setSelectedAPIEndpoint(endpointId: string): void {
  localStorage.setItem(SELECTED_ENDPOINT_KEY, endpointId);
}

export function addAPIEndpoint(endpoint: APIEndpoint): void {
  const endpoints = getStoredEndpoints();
  const existingIndex = endpoints.findIndex((ep) => ep.id === endpoint.id);
  if (existingIndex >= 0) {
    endpoints[existingIndex] = endpoint;
  } else {
    endpoints.push(endpoint);
  }
  setAPIEndpoints(endpoints);
}

export function removeAPIEndpoint(endpointId: string): void {
  const endpoints = getStoredEndpoints();
  const filtered = endpoints.filter((ep) => ep.id !== endpointId);
  setAPIEndpoints(filtered);

  if (getSelectedEndpointId() === endpointId) {
    setSelectedAPIEndpoint(filtered[0]?.id || "production");
  }
}

export async function testAPIEndpointConnectivity(url: string, signer: EventSigner): Promise<{
  success: boolean;
  message: string;
  responseTime?: number;
}> {
  const startTime = Date.now();
  try {
    const api = new AdminAPI(url, signer);
    const result = await api.getUsers(0, 1);
    const responseTime = Date.now() - startTime;
    return {
      success: true,
      message: `API server working (${result.total} users)`,
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;

    if (error instanceof Error) {
      if (error.message.includes("HTTP error! status: 401")) {
        return {
          success: false,
          message: "Authentication failed - invalid credentials",
          responseTime,
        };
      } else if (error.message.includes("HTTP error! status: 403")) {
        return {
          success: false,
          message: "Access denied - admin privileges required",
          responseTime,
        };
      } else if (error.message.includes("HTTP error! status: 404")) {
        return {
          success: false,
          message: "API endpoint not found - check server version",
          responseTime,
        };
      } else if (error.message.includes("HTTP error! status: 5")) {
        return {
          success: false,
          message: `Server error: ${error.message}`,
          responseTime,
        };
      } else if (error.message.includes("NIP-07 extension not ready")) {
        return {
          success: false,
          message: "NIP-07 extension not ready",
          responseTime,
        };
      } else if (error.message.includes("NetworkError") || error.message.includes("Failed to fetch")) {
        return {
          success: false,
          message: "Network error - server unreachable",
          responseTime,
        };
      } else {
        return {
          success: false,
          message: `Connection error: ${error.message}`,
          responseTime,
        };
      }
    }

    return {
      success: false,
      message: "Unknown error occurred",
      responseTime,
    };
  }
}

function getAPIBaseURL(): string {
  return getSelectedAPIEndpoint().url;
}

export interface User {
  id: number;
  pubkey: string;
  created: number;
  balance: number;
  is_admin: boolean;
  is_blocked: boolean;
  tos_accepted: number | null;
  title: string;
  summary: string;
  stream_key?: string;
}

export interface UsersResponse {
  users: User[];
  page: number;
  limit: number;
  total: number;
}

export interface UserUpdateRequest {
  set_admin?: boolean;
  set_blocked?: boolean;
  add_credit?: number;
  memo?: string;
  title?: string;
  summary?: string;
  image?: string;
  tags?: string[];
  content_warning?: string;
  goal?: string;
}

export interface Stream {
  id: string;
  starts: number;
  ends?: number;
  state: "unknown" | "planned" | "live" | "ended";
  title: string;
  summary?: string;
  image?: string;
  thumb?: string;
  tags: string[];
  content_warning?: string;
  goal?: string;
  cost: number;
  duration: number;
  fee: number;
  endpoint_id: number;
}

export interface StreamsResponse {
  streams: Stream[];
  page: number;
  limit: number;
  total: number;
}

export interface HistoryItem {
  created: number;
  type: number; // 0 = Credit, 1 = Debit
  amount: number; // in satoshis
  desc: string;
}

export interface HistoryResponse {
  items: HistoryItem[];
  page: number;
  page_size: number;
}

export interface AuditLogEntry {
  id: number;
  admin_id: number;
  admin_pubkey: string;
  action: string;
  target_type: string;
  target_id: string;
  target_pubkey?: string;
  message: string;
  metadata: string;
  created: number;
}

export interface AuditLogResponse {
  logs: AuditLogEntry[];
  page: number;
  limit: number;
  total: number;
}

export interface IngestEndpoint {
  id: number;
  name: string;
  cost: number; // Cost per minute in millisatoshis
  capabilities: string[];
  urls?: string[];
}

export interface IngestEndpointsResponse {
  endpoints: IngestEndpoint[];
  page: number;
  limit: number;
  total: number;
}

export interface IngestEndpointCreateRequest {
  name: string;
  cost: number;
  capabilities?: string[];
}

export interface IngestEndpointUpdateRequest {
  name: string;
  cost: number;
  capabilities?: string[];
}

export class AdminAPI {
  private eventSigner: EventSigner;
  private baseUrl: string;

  constructor(baseUrl: string, signer: EventSigner) {
    this.baseUrl = baseUrl;
    this.eventSigner = signer;
  }

  static current(signer: EventSigner) {
    const url = getSelectedAPIEndpoint();
    return new AdminAPI(url.url, signer);
  }

  private getBaseURL(): string {
    return `${this.baseUrl}/api/v1/admin`;
  }

  private async getHeaders(url: string, method: string) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.eventSigner) {
      try {
        // Create NIP-98 HTTP Auth event using EventBuilder
        const authEvent = await new EventBuilder()
          .kind(27235) // NIP-98 HTTP Auth
          .content("")
          .tag(["u", url])
          .tag(["method", method])
          .buildAndSign(this.eventSigner);

        const authToken = btoa(JSON.stringify(authEvent));
        headers["Authorization"] = `Nostr ${authToken}`;
      } catch (error) {
        console.error("Failed to sign request:", error);
        if (
          error instanceof Error &&
          error.message.includes("NIP-07 signer, not found")
        ) {
          throw new Error(
            "NIP-07 extension not ready. Please refresh the page or check your browser extension.",
          );
        }
        throw new Error("Authentication failed");
      }
    }

    return headers;
  }

  async getUsers(
    page = 0,
    limit = 50,
    search?: string,
  ): Promise<UsersResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search) {
      params.append("search", search);
    }

    const url = `${this.getBaseURL()}/users?${params}`;
    const headers = await this.getHeaders(url, "GET");

    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  async updateUser(userId: number, updates: UserUpdateRequest): Promise<void> {
    const url = `${this.getBaseURL()}/users/${userId}`;
    const headers = await this.getHeaders(url, "POST");

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  async grantAdmin(userId: number): Promise<void> {
    await this.updateUser(userId, { set_admin: true });
  }

  async revokeAdmin(userId: number): Promise<void> {
    await this.updateUser(userId, { set_admin: false });
  }

  async blockUser(userId: number): Promise<void> {
    await this.updateUser(userId, { set_blocked: true });
  }

  async unblockUser(userId: number): Promise<void> {
    await this.updateUser(userId, { set_blocked: false });
  }

  async addCredits(
    userId: number,
    amount: number,
    memo?: string,
  ): Promise<void> {
    await this.updateUser(userId, { add_credit: amount, memo });
  }

  // Future API methods for user inspection
  async getUser(userId: number): Promise<User> {
    const url = `${this.getBaseURL()}/users/${userId}`;
    const headers = await this.getHeaders(url, "GET");

    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  async getUserStreams(
    userId: number,
    page = 0,
    limit = 25,
  ): Promise<StreamsResponse> {
    const url = `${this.getBaseURL()}/users/${userId}/streams?page=${page}&limit=${limit}`;
    const headers = await this.getHeaders(url, "GET");

    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  async getUserHistory(
    userId: number,
    page = 0,
    limit = 25,
  ): Promise<HistoryResponse> {
    const url = `${this.getBaseURL()}/users/${userId}/history?page=${page}&limit=${limit}`;
    const headers = await this.getHeaders(url, "GET");

    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  async regenerateStreamKey(userId: number): Promise<{ stream_key: string }> {
    const url = `${this.getBaseURL()}/users/${userId}/stream-key/regenerate`;
    const headers = await this.getHeaders(url, "POST");

    const response = await fetch(url, {
      method: "POST",
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  async getStreamKey(userId: number): Promise<{ stream_key: string }> {
    const url = `${this.getBaseURL()}/users/${userId}/stream-key`;
    const headers = await this.getHeaders(url, "GET");

    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  async getAuditLogs(page = 0, limit = 50): Promise<AuditLogResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    const url = `${this.getBaseURL()}/audit-log?${params}`;
    const headers = await this.getHeaders(url, "GET");

    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  // Ingest Endpoint Management
  async getIngestEndpoints(
    page = 0,
    limit = 50,
  ): Promise<IngestEndpointsResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    const url = `${this.getBaseURL()}/ingest-endpoints?${params}`;
    const headers = await this.getHeaders(url, "GET");

    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  async getIngestEndpoint(id: number): Promise<IngestEndpoint> {
    const url = `${this.getBaseURL()}/ingest-endpoints/${id}`;
    const headers = await this.getHeaders(url, "GET");

    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  async createIngestEndpoint(
    endpoint: IngestEndpointCreateRequest,
  ): Promise<IngestEndpoint> {
    const url = `${this.getBaseURL()}/ingest-endpoints`;
    const headers = await this.getHeaders(url, "POST");

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(endpoint),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  async updateIngestEndpoint(
    id: number,
    endpoint: IngestEndpointUpdateRequest,
  ): Promise<IngestEndpoint> {
    const url = `${this.getBaseURL()}/ingest-endpoints/${id}`;
    const headers = await this.getHeaders(url, "PATCH");

    const response = await fetch(url, {
      method: "PATCH",
      headers,
      body: JSON.stringify(endpoint),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  async deleteIngestEndpoint(id: number): Promise<void> {
    const url = `${this.getBaseURL()}/ingest-endpoints/${id}`;
    const headers = await this.getHeaders(url, "DELETE");

    const response = await fetch(url, {
      method: "DELETE",
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }
}
