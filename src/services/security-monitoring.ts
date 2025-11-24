/**
 * Security Monitoring Service
 * Event tracking, failed logins, alerts, compliance checks
 * Version: 9.5.0 Phase 2
 */

export interface SecurityEvent {
  event_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  user_id?: number;
  ip_address?: string;
  user_agent?: string;
  metadata?: string;
}

export interface FailedLogin {
  email: string;
  ip_address: string;
  user_agent: string;
  failure_reason: string;
}

export interface RateLimitHit {
  ip_address: string;
  endpoint: string;
  hit_count: number;
  user_id?: number;
}

export interface SecurityAlert {
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affected_users?: number;
  auto_resolved: boolean;
  alert_status: 'active' | 'investigating' | 'resolved' | 'false_positive';
}

export class SecurityMonitoringService {
  /**
   * Log security event
   */
  static async logEvent(db: any, event: SecurityEvent): Promise<void> {
    await db.prepare(`
      INSERT INTO security_events (
        event_type, severity, details, user_id, 
        ip_address, user_agent
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      event.event_type,
      event.severity,
      event.description,
      event.user_id || null,
      event.ip_address || null,
      event.user_agent || null
    ).run();
    
    // Check if event should trigger an alert
    await this.checkForAlerts(db, event);
  }

  /**
   * Log failed login attempt
   */
  static async logFailedLogin(db: any, failedLogin: FailedLogin): Promise<void> {
    await db.prepare(`
      INSERT INTO failed_logins (email, ip_address, user_agent, failure_reason)
      VALUES (?, ?, ?, ?)
    `).bind(
      failedLogin.email,
      failedLogin.ip_address,
      failedLogin.user_agent,
      failedLogin.failure_reason
    ).run();
    
    // Check for brute force attempts
    await this.detectBruteForce(db, failedLogin.ip_address, failedLogin.email);
  }

  /**
   * Log rate limit hit
   */
  static async logRateLimitHit(db: any, rateLimit: RateLimitHit): Promise<void> {
    // Check if entry exists for this IP + endpoint
    const existing = await db.prepare(`
      SELECT id, hit_count FROM rate_limit_hits 
      WHERE identifier = ? AND endpoint = ? 
      AND timestamp >= datetime('now', '-1 hour')
    `).bind(rateLimit.ip_address, rateLimit.endpoint).first();
    
    if (existing) {
      // Update existing entry
      await db.prepare(`
        UPDATE rate_limit_hits 
        SET hit_count = hit_count + ?
        WHERE id = ?
      `).bind(rateLimit.hit_count, existing.id).run();
    } else {
      // Create new entry
      await db.prepare(`
        INSERT INTO rate_limit_hits (identifier, endpoint, hit_count)
        VALUES (?, ?, ?)
      `).bind(
        rateLimit.ip_address,
        rateLimit.endpoint,
        rateLimit.hit_count
      ).run();
    }
    
    // Log as security event
    await this.logEvent(db, {
      event_type: 'RATE_LIMIT_EXCEEDED',
      severity: 'medium',
      description: `Rate limit exceeded for ${rateLimit.endpoint}`,
      user_id: rateLimit.user_id,
      ip_address: rateLimit.ip_address
    });
  }

  /**
   * Create security alert
   */
  static async createAlert(db: any, alert: SecurityAlert): Promise<number> {
    const result = await db.prepare(`
      INSERT INTO security_alerts (
        alert_type, severity, title, description, 
        affected_users, auto_resolved, alert_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      alert.alert_type,
      alert.severity,
      alert.title,
      alert.description,
      alert.affected_users || 0,
      alert.auto_resolved ? 1 : 0,
      alert.alert_status
    ).run();
    
    return result.meta.last_row_id as number;
  }

  /**
   * Detect brute force attempts
   */
  static async detectBruteForce(db: any, ipAddress: string, email: string): Promise<void> {
    // Check failed logins in last hour
    const recentFailures = await db.prepare(`
      SELECT COUNT(*) as count FROM failed_logins 
      WHERE ip_address = ? AND timestamp >= datetime('now', '-1 hour')
    `).bind(ipAddress).first();
    
    if (recentFailures && recentFailures.count >= 5) {
      // Create alert for brute force attempt
      await this.createAlert(db, {
        alert_type: 'BRUTE_FORCE_ATTEMPT',
        severity: 'high',
        title: 'Brute Force Attack Detected',
        description: `${recentFailures.count} failed login attempts from IP ${ipAddress} for ${email}`,
        affected_users: 1,
        auto_resolved: false,
        alert_status: 'active'
      });
      
      // Log security event
      await this.logEvent(db, {
        event_type: 'BRUTE_FORCE_DETECTED',
        severity: 'high',
        description: `Brute force attack detected: ${recentFailures.count} failed attempts`,
        ip_address: ipAddress,
        metadata: JSON.stringify({ email, attempts: recentFailures.count })
      });
    }
  }

  /**
   * Check if event should trigger alerts
   */
  static async checkForAlerts(db: any, event: SecurityEvent): Promise<void> {
    // High/Critical events always trigger alerts
    if (event.severity === 'high' || event.severity === 'critical') {
      await this.createAlert(db, {
        alert_type: event.event_type,
        severity: event.severity,
        title: `Security Event: ${event.event_type}`,
        description: event.description,
        affected_users: event.user_id ? 1 : 0,
        auto_resolved: false,
        alert_status: 'active'
      });
    }
  }

  /**
   * Get security dashboard stats
   */
  static async getDashboardStats(db: any): Promise<any> {
    // Events in last 24h
    const recentEvents = await db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical,
        SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) as high,
        SUM(CASE WHEN severity = 'medium' THEN 1 ELSE 0 END) as medium,
        SUM(CASE WHEN severity = 'low' THEN 1 ELSE 0 END) as low
      FROM security_events 
      WHERE timestamp >= datetime('now', '-24 hours')
    `).first();
    
    // Failed logins in last 24h
    const failedLogins = await db.prepare(`
      SELECT COUNT(*) as count FROM failed_logins 
      WHERE timestamp >= datetime('now', '-24 hours')
    `).first();
    
    // Rate limit hits in last hour
    const rateLimitHits = await db.prepare(`
      SELECT COUNT(*) as count, SUM(hit_count) as total_hits FROM rate_limit_hits 
      WHERE timestamp >= datetime('now', '-1 hour')
    `).first();
    
    // Active alerts
    const activeAlerts = await db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical,
        SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) as high
      FROM security_alerts 
      WHERE alert_status = 'active'
    `).first();
    
    // Recent incidents (from HIPAA table)
    let openIncidents = { count: 0 };
    try {
      openIncidents = await db.prepare(`
        SELECT COUNT(*) as count FROM security_incidents 
        WHERE incident_status = 'open'
      `).first();
    } catch (e) {
      // Table might not exist or column name mismatch, default to 0
      console.log('[Security] No security_incidents data available');
    }
    
    // Top event types
    const topEvents = await db.prepare(`
      SELECT event_type, COUNT(*) as count 
      FROM security_events 
      WHERE timestamp >= datetime('now', '-7 days')
      GROUP BY event_type 
      ORDER BY count DESC 
      LIMIT 5
    `).all();
    
    // Failed login attempts by IP
    const topFailedIPs = await db.prepare(`
      SELECT ip_address, COUNT(*) as attempts 
      FROM failed_logins 
      WHERE timestamp >= datetime('now', '-24 hours')
      GROUP BY ip_address 
      ORDER BY attempts DESC 
      LIMIT 5
    `).all();
    
    return {
      events_24h: {
        total: recentEvents?.total || 0,
        critical: recentEvents?.critical || 0,
        high: recentEvents?.high || 0,
        medium: recentEvents?.medium || 0,
        low: recentEvents?.low || 0
      },
      failed_logins_24h: failedLogins?.count || 0,
      rate_limit_hits_1h: {
        unique_ips: rateLimitHits?.count || 0,
        total_hits: rateLimitHits?.total_hits || 0
      },
      active_alerts: {
        total: activeAlerts?.total || 0,
        critical: activeAlerts?.critical || 0,
        high: activeAlerts?.high || 0
      },
      open_incidents: openIncidents?.count || 0,
      top_event_types: topEvents.results,
      top_failed_ips: topFailedIPs.results,
      last_updated: new Date().toISOString()
    };
  }

  /**
   * Get compliance checklist
   */
  static async getComplianceChecklist(db: any): Promise<any[]> {
    const checklist = await db.prepare(`
      SELECT * FROM compliance_checklist 
      ORDER BY check_category, id
    `).all();
    
    return checklist.results;
  }

  /**
   * Update compliance check
   */
  static async updateComplianceCheck(
    db: any, 
    checkId: number, 
    is_compliant: boolean, 
    notes?: string
  ): Promise<void> {
    await db.prepare(`
      UPDATE compliance_checklist 
      SET is_compliant = ?, last_checked = CURRENT_TIMESTAMP, notes = ?
      WHERE id = ?
    `).bind(is_compliant ? 1 : 0, notes || null, checkId).run();
  }

  /**
   * Initialize compliance checklist (run once)
   */
  static async initializeComplianceChecklist(db: any): Promise<void> {
    const checks = [
      // HIPAA Technical Safeguards
      { category: 'HIPAA_TECHNICAL', name: 'Access Control', description: 'Implement user authentication and authorization', required: true },
      { category: 'HIPAA_TECHNICAL', name: 'Audit Controls', description: 'Log and monitor access to PHI', required: true },
      { category: 'HIPAA_TECHNICAL', name: 'Integrity Controls', description: 'Ensure PHI is not altered or destroyed', required: true },
      { category: 'HIPAA_TECHNICAL', name: 'Transmission Security', description: 'Encrypt PHI in transit (TLS 1.3)', required: true },
      
      // HIPAA Administrative Safeguards
      { category: 'HIPAA_ADMIN', name: 'Security Management', description: 'Risk analysis and management policies', required: true },
      { category: 'HIPAA_ADMIN', name: 'Workforce Training', description: 'Security awareness training for all staff', required: true },
      { category: 'HIPAA_ADMIN', name: 'Contingency Planning', description: 'Data backup and disaster recovery plan', required: true },
      
      // HIPAA Physical Safeguards
      { category: 'HIPAA_PHYSICAL', name: 'Facility Access', description: 'Control physical access to facilities', required: true },
      { category: 'HIPAA_PHYSICAL', name: 'Workstation Security', description: 'Secure workstations accessing PHI', required: true },
      { category: 'HIPAA_PHYSICAL', name: 'Device Controls', description: 'Control removal of hardware/software', required: true },
      
      // GDPR Requirements
      { category: 'GDPR', name: 'Data Minimization', description: 'Collect only necessary personal data', required: true },
      { category: 'GDPR', name: 'Right to Access', description: 'Users can access their data', required: true },
      { category: 'GDPR', name: 'Right to Erasure', description: 'Users can delete their data', required: true },
      { category: 'GDPR', name: 'Data Portability', description: 'Users can export their data', required: true },
      { category: 'GDPR', name: 'Consent Management', description: 'Explicit consent for data processing', required: true },
      
      // Security Best Practices
      { category: 'SECURITY', name: 'Encryption at Rest', description: 'All sensitive data encrypted (AES-256)', required: true },
      { category: 'SECURITY', name: 'Rate Limiting', description: 'Prevent brute force and DDoS attacks', required: true },
      { category: 'SECURITY', name: 'Input Validation', description: 'Sanitize all user inputs', required: true },
      { category: 'SECURITY', name: 'Session Management', description: 'Secure session handling', required: true },
      { category: 'SECURITY', name: 'Password Policy', description: 'Strong password requirements', required: true }
    ];
    
    for (const check of checks) {
      await db.prepare(`
        INSERT OR IGNORE INTO compliance_checklist (check_category, check_name, description, is_required)
        VALUES (?, ?, ?, ?)
      `).bind(check.category, check.name, check.description, check.required ? 1 : 0).run();
    }
  }
}
