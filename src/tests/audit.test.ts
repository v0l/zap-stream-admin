/**
 * Test for audit logging functionality
 * This test validates that the audit log types and API structure are correct
 */

import { CreateAuditLogRequest, AuditLogEntry } from '../types/audit';

describe('Audit Logging', () => {
  it('should have correct audit log types', () => {
    // Test CreateAuditLogRequest interface
    const auditRequest: CreateAuditLogRequest = {
      action: "STREAM_KEY_VIEWED",
      target_user_id: 123,
      details: {
        method: "get_stream_key"
      }
    };

    expect(auditRequest.action).toBe("STREAM_KEY_VIEWED");
    expect(auditRequest.target_user_id).toBe(123);
    expect(auditRequest.details?.method).toBe("get_stream_key");
  });

  it('should have correct audit log entry structure', () => {
    // Test AuditLogEntry interface
    const auditEntry: AuditLogEntry = {
      action: "STREAM_KEY_REGENERATED",
      target_user_id: 456,
      admin_pubkey: "npub123abc",
      timestamp: Date.now(),
      details: {
        method: "regenerate_stream_key"
      }
    };

    expect(auditEntry.action).toBe("STREAM_KEY_REGENERATED");
    expect(auditEntry.target_user_id).toBe(456);
    expect(auditEntry.admin_pubkey).toBe("npub123abc");
    expect(typeof auditEntry.timestamp).toBe("number");
    expect(auditEntry.details?.method).toBe("regenerate_stream_key");
  });
});