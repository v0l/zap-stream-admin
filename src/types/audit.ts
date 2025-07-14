export interface AuditLogEntry {
  action: string;
  target_user_id: number;
  admin_pubkey: string;
  timestamp: number;
  details?: Record<string, any>;
}

export interface CreateAuditLogRequest {
  action: string;
  target_user_id: number;
  details?: Record<string, any>;
}