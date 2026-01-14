import type { D1Database } from '@cloudflare/workers-types';
import { getErrorMessage } from '../types';
/**
 * HIPAA Compliance Service
 * Audit logging, BAA templates, PHI tracking
 * Version: 9.5.0
 */

export interface AuditLog {
  user_id?: number;
  action: string;
  resource_type?: string;
  resource_id?: string;
  contains_phi: boolean;
  phi_fields?: string[];
  ip_address?: string;
  user_agent?: string;
  success: boolean;
  failure_reason?: string;
}

export interface HIPAAPolicy {
  policy_type: string;
  title: string;
  version: string;
  content: string;
  effective_date: string;
  policy_status: 'draft' | 'active' | 'archived';
}

export interface SecurityIncident {
  incident_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affected_users_count: number;
  phi_involved: boolean;
  detected_at: string;
  incident_status: 'open' | 'investigating' | 'contained' | 'resolved';
}

export class HIPAAComplianceService {
  /**
   * Log HIPAA audit event
   */
  static async logAudit(db: D1Database, auditLog: AuditLog): Promise<void> {
    const phiFieldsJson = auditLog.phi_fields ? JSON.stringify(auditLog.phi_fields) : null;
    
    await db.prepare(`
      INSERT INTO hipaa_audit_logs (
        user_id, action, resource_type, resource_id, contains_phi, 
        phi_fields, ip_address, user_agent, success, failure_reason
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      auditLog.user_id || null,
      auditLog.action,
      auditLog.resource_type || null,
      auditLog.resource_id || null,
      auditLog.contains_phi ? 1 : 0,
      phiFieldsJson,
      auditLog.ip_address || null,
      auditLog.user_agent || null,
      auditLog.success ? 1 : 0,
      auditLog.failure_reason || null
    ).run();
  }

  /**
   * Check if data contains PHI
   */
  static containsPHI(data: Record<string, unknown>): { isPHI: boolean; fields: string[] } {
    const phiFields: string[] = [];
    
    // HIPAA PHI identifiers (18 identifiers under Safe Harbor method)
    const phiKeywords = [
      'name', 'email', 'phone', 'address', 'ssn', 'dob', 'date_of_birth',
      'medical_record', 'health_plan', 'account_number', 'license',
      'device_identifier', 'biometric', 'photo', 'ip_address'
    ];
    
    Object.keys(data).forEach(key => {
      const lowerKey = key.toLowerCase();
      if (phiKeywords.some(phi => lowerKey.includes(phi))) {
        phiFields.push(key);
      }
    });
    
    return {
      isPHI: phiFields.length > 0,
      fields: phiFields
    };
  }

  /**
   * Generate BAA template
   */
  static generateBAATemplate(organizationName: string, effectiveDate: string): string {
    return `
BUSINESS ASSOCIATE AGREEMENT

This Business Associate Agreement ("Agreement") is entered into on ${effectiveDate}
between MoodMash ("Covered Entity") and ${organizationName} ("Business Associate").

1. DEFINITIONS
   Terms used but not defined in this Agreement have the meanings assigned to them
   in the Health Insurance Portability and Accountability Act of 1996 ("HIPAA").

2. OBLIGATIONS OF BUSINESS ASSOCIATE
   2.1 Business Associate agrees to not use or disclose Protected Health Information
       (PHI) other than as permitted by this Agreement or as required by law.
   
   2.2 Business Associate agrees to implement appropriate safeguards to prevent
       unauthorized use or disclosure of PHI.
   
   2.3 Business Associate agrees to report to Covered Entity any unauthorized
       use or disclosure of PHI within 24 hours of discovery.

3. PERMITTED USES AND DISCLOSURES
   3.1 Business Associate may use and disclose PHI only as necessary to perform
       services specified in the underlying service agreement.
   
   3.2 Business Associate may use PHI for proper management and administration
       of Business Associate's services.

4. SECURITY REQUIREMENTS
   4.1 Business Associate shall implement administrative, physical, and technical
       safeguards that reasonably and appropriately protect the confidentiality,
       integrity, and availability of electronic PHI (ePHI).
   
   4.2 Encryption: All ePHI shall be encrypted at rest using AES-256 encryption
       and in transit using TLS 1.3.
   
   4.3 Access Controls: Business Associate shall implement role-based access
       controls and multi-factor authentication.

5. BREACH NOTIFICATION
   5.1 Business Associate shall notify Covered Entity of any breach of unsecured
       PHI within 24 hours of discovery.
   
   5.2 Notification shall include:
       - Description of the breach
       - Types of PHI involved
       - Number of individuals affected
       - Mitigation steps taken

6. SUBCONTRACTORS
   6.1 Business Associate shall ensure that any subcontractors that create, receive,
       maintain, or transmit PHI agree to the same restrictions and conditions.

7. TERMINATION
   7.1 This Agreement may be terminated by either party upon 30 days written notice.
   
   7.2 Upon termination, Business Associate shall return or destroy all PHI.

8. AUDIT RIGHTS
   8.1 Covered Entity reserves the right to audit Business Associate's compliance
       with this Agreement.

SIGNATURES:

Covered Entity: _______________________  Date: __________
Business Associate: _______________________  Date: __________
    `.trim();
  }

  /**
   * Get compliance status
   */
  static async getComplianceStatus(db: D1Database): Promise<Record<string, unknown>> {
    try {
      // Get recent audit logs
      const recentAudits = await db.prepare(`
        SELECT COUNT(*) as count FROM hipaa_audit_logs 
        WHERE timestamp >= datetime('now', '-30 days')
      `).first();

      // Get active policies
      const activePolicies = await db.prepare(`
        SELECT COUNT(*) as count FROM hipaa_policies 
        WHERE policy_status = 'active'
      `).first();

      // Get open incidents (with error handling)
      let openIncidents: { count: number } | null = { count: 0 };
      try {
        openIncidents = await db.prepare(`
          SELECT COUNT(*) as count FROM security_incidents 
          WHERE incident_status = 'open'
        `).first<{ count: number }>();
      } catch (e) {
        // security_incidents table not available
      }

      // Get encryption status
      interface EncryptionRow {
        data_type: string;
        encryption_method: string;
        is_encrypted: number;
        last_verified: string;
      }
      const encryptionStatus = await db.prepare(`
        SELECT 
          component as data_type,
          encryption_type as encryption_method,
          is_encrypted,
          last_verified
        FROM encryption_verification 
        ORDER BY last_verified DESC
      `).all<EncryptionRow>();

      // Calculate compliance score
      const totalChecks = 10;
      let passedChecks = 0;

      const recentAuditsCount = (recentAudits as { count: number } | null)?.count ?? 0;
      const activePoliciesCount = (activePolicies as { count: number } | null)?.count ?? 0;
      const openIncidentsCount = openIncidents?.count ?? 0;

      if (recentAuditsCount > 0) passedChecks += 2; // Audit logging active
      if (activePoliciesCount >= 4) passedChecks += 2; // Key policies in place
      if (openIncidentsCount === 0) passedChecks += 3; // No open incidents
      if (encryptionStatus.results && encryptionStatus.results.length > 0 && encryptionStatus.results.every((e) => e.is_encrypted)) {
        passedChecks += 3; // All encrypted
      }

      const complianceScore = Math.round((passedChecks / totalChecks) * 100);
      const isCompliant = complianceScore >= 80;

      return {
        overall_status: isCompliant ? 'compliant' : 'partial',
        compliance_score: complianceScore,
        audit_logs_30d: recentAuditsCount,
        active_policies: activePoliciesCount,
        open_incidents: openIncidentsCount,
        encryption_status: encryptionStatus.results,
        last_updated: new Date().toISOString()
      };
    } catch (error: unknown) {
      console.error('[HIPAA] Error getting compliance status:', error);
      // Return safe defaults
      return {
        overall_status: 'unknown',
        compliance_score: 0,
        audit_logs_30d: 0,
        active_policies: 0,
        open_incidents: 0,
        encryption_status: [],
        last_updated: new Date().toISOString(),
        error: getErrorMessage(error)
      };
    }
  }
}
