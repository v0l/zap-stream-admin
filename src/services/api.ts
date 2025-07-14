import { EventSigner, EventBuilder } from "@snort/system";
import { CreateAuditLogRequest } from "../types/audit";

const API_BASE_URL =
  (import.meta as any).env.VITE_API_BASE_URL || "https://api.core.zap.stream";

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

export class AdminAPI {
  private baseURL: string;
  private eventSigner: EventSigner;

  constructor(signer: EventSigner) {
    this.eventSigner = signer;
    this.baseURL = `${API_BASE_URL}/api/v1/admin`;
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

    const url = `${this.baseURL}/users?${params}`;
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
    const url = `${this.baseURL}/users/${userId}`;
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
    const url = `${this.baseURL}/users/${userId}`;
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
    const url = `${this.baseURL}/users/${userId}/streams?page=${page}&limit=${limit}`;
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
    const url = `${this.baseURL}/users/${userId}/history?page=${page}&limit=${limit}`;
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
    const url = `${this.baseURL}/users/${userId}/stream-key/regenerate`;
    const headers = await this.getHeaders(url, "POST");

    const response = await fetch(url, {
      method: "POST",
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    // Add audit log for stream key regeneration
    try {
      await this.createAuditLog({
        action: "STREAM_KEY_REGENERATED",
        target_user_id: userId,
        details: {
          method: "regenerate_stream_key"
        }
      });
    } catch (auditError) {
      // Don't fail the main operation if audit logging fails
      console.error("Failed to create audit log:", auditError);
    }

    return result;
  }

  async getStreamKey(userId: number): Promise<{ stream_key: string }> {
    const url = `${this.baseURL}/users/${userId}/stream-key`;
    const headers = await this.getHeaders(url, "GET");

    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    // Add audit log for stream key access
    try {
      await this.createAuditLog({
        action: "STREAM_KEY_VIEWED",
        target_user_id: userId,
        details: {
          method: "get_stream_key"
        }
      });
    } catch (auditError) {
      // Don't fail the main operation if audit logging fails
      console.error("Failed to create audit log:", auditError);
    }

    return result;
  }

  async createAuditLog(auditData: CreateAuditLogRequest): Promise<void> {
    const url = `${this.baseURL}/audit-log`;
    const headers = await this.getHeaders(url, "POST");

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(auditData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }
}
