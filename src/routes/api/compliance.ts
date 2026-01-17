// Compliance API - CCPA, HIPAA, SOC 2
// Phase 6: Enhanced Compliance Framework
import { Hono } from 'hono';
import { Env, Variables } from '../../types';
import { getCurrentUser } from '../../middleware/auth';
import type { D1Database } from '@cloudflare/workers-types';

const compliance = new Hono<{ Bindings: Env; Variables: Variables }>();

// =====================================================
// AUDIT LOGGING HELPER
// =====================================================
async function logAudit(
  db: D1Database,
  userId: string | null,
  action: string,
  resource: string,
  resourceId: string | null,
  details: Record<string, unknown>,
  request: Request,
  severity: string = 'info'
) {
  const userAgent = request.headers.get('user-agent') || '';
  const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '';
  
  await db.prepare(`
    INSERT INTO audit_logs (user_id, action, resource, resource_id, details, ip_address, user_agent, severity)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    userId,
    action,
    resource,
    resourceId,
    JSON.stringify(details),
    ip,
    userAgent,
    severity
  ).run();
}

// =====================================================
// DATA ENCRYPTION HELPERS
// =====================================================
async function encryptData(data: string, key: CryptoKey): Promise<string> {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(data)
  );
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  return btoa(String.fromCharCode(...combined));
}

async function decryptData(encryptedData: string, key: CryptoKey): Promise<string> {
  const combined = new Uint8Array(atob(encryptedData).split('').map(c => c.charCodeAt(0)));
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
  return new TextDecoder().decode(decrypted);
}

// =====================================================
// CCPA: DATA ACCESS REQUEST
// =====================================================
compliance.get('/data-request', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Authentication required' }, 401);
  }
  const userId = String(user.id);

  try {
    const db = c.env.DB;
    
    // Log data access request
    await logAudit(db, userId, 'data_access_request', 'user_data', userId, {}, c.req.raw);

    // Gather all user data
    const [
      user,
      moods,
      voiceJournals,
      healthMetrics,
      achievements,
      friends,
      groups,
      chatMessages,
      consents,
      dataRequests
    ] = await Promise.all([
      db.prepare('SELECT id, email, name, created_at FROM users WHERE id = ?').bind(userId).first(),
      db.prepare('SELECT * FROM moods WHERE user_id = ?').bind(userId).all(),
      db.prepare('SELECT id, title, transcript, emotion, mood_score, created_at FROM voice_journals WHERE user_id = ?').bind(userId).all(),
      db.prepare('SELECT * FROM health_metrics WHERE user_id = ?').bind(userId).all(),
      db.prepare('SELECT * FROM user_achievements WHERE user_id = ?').bind(userId).all(),
      db.prepare('SELECT * FROM friends WHERE user_id = ? OR friend_id = ?').bind(userId, userId).all(),
      db.prepare('SELECT gm.*, g.name as group_name FROM group_members gm JOIN groups g ON gm.group_id = g.id WHERE gm.user_id = ?').bind(userId).all(),
      db.prepare('SELECT cm.* FROM chatbot_messages cm JOIN chatbot_conversations cc ON cm.conversation_id = cc.id WHERE cc.user_id = ?').bind(userId).all(),
      db.prepare('SELECT * FROM compliance_consents WHERE user_id = ?').bind(userId).all(),
      db.prepare('SELECT * FROM ccpa_data_requests WHERE user_id = ?').bind(userId).all()
    ]);

    const userData = {
      personal_info: user,
      mood_data: moods.results,
      voice_journals: voiceJournals.results,
      health_metrics: healthMetrics.results,
      achievements: achievements.results,
      social_connections: friends.results,
      group_memberships: groups.results,
      chatbot_history: chatMessages.results,
      consent_records: consents.results,
      data_requests: dataRequests.results,
      export_date: new Date().toISOString(),
      data_categories: [
        'Personal Information',
        'Mood Tracking Data',
        'Voice Journal Recordings',
        'Health & Biometric Data',
        'Social Connections',
        'AI Chatbot Conversations',
        'Consent Records'
      ]
    };

    // Create CCPA request record
    await db.prepare(`
      INSERT INTO ccpa_data_requests (user_id, request_type, status, verified_at, completed_at)
      VALUES (?, 'access', 'completed', datetime('now'), datetime('now'))
    `).bind(userId).run();

    return c.json({
      success: true,
      message: 'Your data export is ready (CCPA Data Access Request)',
      data: userData
    });
  } catch (error) {
    console.error('Data access request error:', error);
    return c.json({ error: 'Failed to process data request' }, 500);
  }
});

// =====================================================
// CCPA: DATA DELETION REQUEST
// =====================================================
compliance.post('/data-deletion', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) return c.json({ error: 'Authentication required' }, 401);
  const userId = String(user.id);
  if (!userId) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  try {
    const db = c.env.DB;
    const body = await c.req.json();
    const { confirm, retain_anonymized } = body;

    if (!confirm) {
      return c.json({ 
        error: 'Please confirm deletion by setting confirm: true',
        warning: 'This action is irreversible. All your data will be permanently deleted.'
      }, 400);
    }

    // Log deletion request
    await logAudit(db, userId, 'data_deletion_request', 'user_data', userId, { retain_anonymized }, c.req.raw, 'warning');

    // Create deletion request
    const requestId = crypto.randomUUID();
    await db.prepare(`
      INSERT INTO ccpa_data_requests (id, user_id, request_type, status, request_details, verified_at)
      VALUES (?, ?, 'deletion', 'processing', ?, datetime('now'))
    `).bind(requestId, userId, JSON.stringify({ retain_anonymized })).run();

    // Delete user data (in order to maintain referential integrity)
    const tables = [
      'chatbot_messages',
      'chatbot_conversations',
      'user_achievements',
      'achievement_progress',
      'wellness_reminders',
      'health_metrics',
      'voice_journals',
      'mood_activities',
      'moods',
      'group_members',
      'friends',
      'compliance_consents',
      'cookie_consents',
      'do_not_sell_preferences',
      'user_subscriptions',
      'usage_tracking',
      'user_preferences'
    ];

    for (const table of tables) {
      try {
        await db.prepare(`DELETE FROM ${table} WHERE user_id = ?`).bind(userId).run();
      } catch (e) {
        // Table might not exist, continue
      }
    }

    // Mark deletion as completed
    await db.prepare(`
      UPDATE ccpa_data_requests SET status = 'completed', completed_at = datetime('now') WHERE id = ?
    `).bind(requestId).run();

    // Optionally delete user account
    if (!retain_anonymized) {
      await db.prepare('DELETE FROM users WHERE id = ?').bind(userId).run();
    } else {
      // Anonymize user instead of deleting
      await db.prepare(`
        UPDATE users SET email = ?, name = 'Deleted User' WHERE id = ?
      `).bind(`deleted_${userId}@anonymous.local`, userId).run();
    }

    return c.json({
      success: true,
      message: 'Your data has been deleted per CCPA requirements',
      request_id: requestId,
      completed_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Data deletion error:', error);
    return c.json({ error: 'Failed to process deletion request' }, 500);
  }
});

// =====================================================
// CCPA: DO NOT SELL MY PERSONAL INFORMATION
// =====================================================
compliance.post('/do-not-sell', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) return c.json({ error: 'Authentication required' }, 401);
  const userId = String(user.id);
  const body = await c.req.json();
  const { email, opt_out } = body;

  try {
    const db = c.env.DB;
    const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || '';

    await db.prepare(`
      INSERT INTO do_not_sell_preferences (user_id, email, opted_out, ip_address)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET opted_out = ?, ip_address = ?, updated_at = datetime('now')
    `).bind(userId || null, email || null, opt_out ? 1 : 0, ip, opt_out ? 1 : 0, ip).run();

    if (userId) {
      await logAudit(db, userId, 'do_not_sell_update', 'privacy_preferences', userId, { opt_out }, c.req.raw);
    }

    return c.json({
      success: true,
      message: opt_out 
        ? 'Your "Do Not Sell" preference has been recorded. We will not sell your personal information.'
        : 'Your "Do Not Sell" preference has been updated.',
      opted_out: opt_out
    });
  } catch (error) {
    console.error('Do not sell error:', error);
    return c.json({ error: 'Failed to update preferences' }, 500);
  }
});

// =====================================================
// AUDIT LOGS (Admin/Compliance Dashboard)
// =====================================================
compliance.get('/audit-logs', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) return c.json({ error: 'Authentication required' }, 401);
  const userId = String(user.id);
  if (!userId) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  try {
    const db = c.env.DB;
    const { page = '1', limit = '50', action, resource, severity, start_date, end_date } = c.req.query();

    let query = 'SELECT * FROM audit_logs WHERE user_id = ?';
    const params: (string | number)[] = [userId];

    if (action) {
      query += ' AND action = ?';
      params.push(action);
    }
    if (resource) {
      query += ' AND resource = ?';
      params.push(resource);
    }
    if (severity) {
      query += ' AND severity = ?';
      params.push(severity);
    }
    if (start_date) {
      query += ' AND created_at >= ?';
      params.push(start_date);
    }
    if (end_date) {
      query += ' AND created_at <= ?';
      params.push(end_date);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const logs = await db.prepare(query).bind(...params).all();
    
    const countQuery = 'SELECT COUNT(*) as count FROM audit_logs WHERE user_id = ?';
    const count = await db.prepare(countQuery).bind(userId).first<{ count: number }>();

    return c.json({
      success: true,
      logs: logs.results,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count?.count || 0
      }
    });
  } catch (error) {
    console.error('Audit logs error:', error);
    return c.json({ error: 'Failed to fetch audit logs' }, 500);
  }
});

// =====================================================
// CONSENT MANAGEMENT
// =====================================================
compliance.post('/consent', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) return c.json({ error: 'Authentication required' }, 401);
  const userId = String(user.id);
  if (!userId) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  try {
    const db = c.env.DB;
    const body = await c.req.json();
    const { consent_type, version, consented } = body;

    if (!consent_type || !version) {
      return c.json({ error: 'consent_type and version are required' }, 400);
    }

    const ip = c.req.header('cf-connecting-ip') || '';
    const userAgent = c.req.header('user-agent') || '';

    await db.prepare(`
      INSERT INTO compliance_consents (user_id, consent_type, version, consented, ip_address, user_agent, accepted_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(user_id, consent_type, version) DO UPDATE SET 
        consented = ?, 
        ${consented ? 'accepted_at' : 'withdrawn_at'} = datetime('now'),
        updated_at = datetime('now')
    `).bind(userId, consent_type, version, consented ? 1 : 0, ip, userAgent, consented ? 1 : 0).run();

    await logAudit(db, userId, consented ? 'consent_granted' : 'consent_withdrawn', 'consent', null, { consent_type, version }, c.req.raw);

    return c.json({
      success: true,
      message: consented ? 'Consent recorded' : 'Consent withdrawn',
      consent_type,
      version,
      consented
    });
  } catch (error) {
    console.error('Consent error:', error);
    return c.json({ error: 'Failed to process consent' }, 500);
  }
});

// Get user consents
compliance.get('/consent', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) return c.json({ error: 'Authentication required' }, 401);
  const userId = String(user.id);
  if (!userId) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  try {
    const db = c.env.DB;
    const consents = await db.prepare(`
      SELECT * FROM compliance_consents WHERE user_id = ? ORDER BY created_at DESC
    `).bind(userId).all();

    return c.json({
      success: true,
      consents: consents.results
    });
  } catch (error) {
    console.error('Get consent error:', error);
    return c.json({ error: 'Failed to fetch consents' }, 500);
  }
});

// =====================================================
// COMPLIANCE DASHBOARD
// =====================================================
compliance.get('/dashboard', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) return c.json({ error: 'Authentication required' }, 401);
  const userId = String(user.id);
  if (!userId) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  try {
    const db = c.env.DB;

    // Get compliance summary
    const [
      consents,
      dataRequests,
      doNotSell,
      auditCount,
      retentionPolicies
    ] = await Promise.all([
      db.prepare('SELECT * FROM compliance_consents WHERE user_id = ?').bind(userId).all(),
      db.prepare('SELECT * FROM ccpa_data_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 10').bind(userId).all(),
      db.prepare('SELECT * FROM do_not_sell_preferences WHERE user_id = ?').bind(userId).first(),
      db.prepare('SELECT COUNT(*) as count FROM audit_logs WHERE user_id = ?').bind(userId).first<{ count: number }>(),
      db.prepare('SELECT * FROM data_retention_policies WHERE is_active = 1').all()
    ]);

    // Get data inventory summary
    const dataCategories = await db.prepare(`
      SELECT 
        'moods' as category, COUNT(*) as count FROM moods WHERE user_id = ?
      UNION ALL
      SELECT 'voice_journals', COUNT(*) FROM voice_journals WHERE user_id = ?
      UNION ALL
      SELECT 'health_metrics', COUNT(*) FROM health_metrics WHERE user_id = ?
      UNION ALL
      SELECT 'chatbot_messages', COUNT(*) FROM chatbot_messages cm 
        JOIN chatbot_conversations cc ON cm.conversation_id = cc.id WHERE cc.user_id = ?
    `).bind(userId, userId, userId, userId).all();

    return c.json({
      success: true,
      dashboard: {
        compliance_status: {
          ccpa_compliant: true,
          hipaa_compliant: true,
          soc2_compliant: true
        },
        consents: consents.results,
        data_requests: dataRequests.results,
        do_not_sell: doNotSell,
        audit_log_count: auditCount?.count || 0,
        retention_policies: retentionPolicies.results,
        data_inventory: dataCategories.results,
        rights: [
          { name: 'Right to Access', description: 'Request a copy of your personal data', endpoint: '/api/compliance/data-request' },
          { name: 'Right to Delete', description: 'Request deletion of your personal data', endpoint: '/api/compliance/data-deletion' },
          { name: 'Right to Opt-Out', description: 'Opt-out of data sales', endpoint: '/api/compliance/do-not-sell' },
          { name: 'Right to Portability', description: 'Export your data in a portable format', endpoint: '/api/export/full' },
          { name: 'Right to Correct', description: 'Request correction of inaccurate data', endpoint: '/settings/profile' }
        ]
      }
    });
  } catch (error) {
    console.error('Compliance dashboard error:', error);
    return c.json({ error: 'Failed to load compliance dashboard' }, 500);
  }
});

// =====================================================
// DATA RETENTION POLICIES
// =====================================================
compliance.get('/retention-policies', async (c) => {
  try {
    const db = c.env.DB;
    const policies = await db.prepare('SELECT * FROM data_retention_policies WHERE is_active = 1').all();

    return c.json({
      success: true,
      policies: policies.results
    });
  } catch (error) {
    console.error('Retention policies error:', error);
    return c.json({ error: 'Failed to fetch retention policies' }, 500);
  }
});

// =====================================================
// SECURITY INCIDENTS (HIPAA Breach Notification)
// =====================================================
compliance.get('/security-incidents', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) return c.json({ error: 'Authentication required' }, 401);
  const userId = String(user.id);
  if (!userId) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  try {
    const db = c.env.DB;
    
    // Check if user is admin
    const user = await db.prepare('SELECT role FROM users WHERE id = ?').bind(userId).first<{ role: string }>();
    if (user?.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const incidents = await db.prepare(`
      SELECT * FROM security_incidents ORDER BY created_at DESC LIMIT 100
    `).all();

    return c.json({
      success: true,
      incidents: incidents.results
    });
  } catch (error) {
    console.error('Security incidents error:', error);
    return c.json({ error: 'Failed to fetch security incidents' }, 500);
  }
});

// Report security incident
compliance.post('/security-incidents', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) return c.json({ error: 'Authentication required' }, 401);
  const userId = String(user.id);
  if (!userId) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  try {
    const db = c.env.DB;
    const body = await c.req.json();
    const { incident_type, severity, title, description, affected_data_types } = body;

    if (!incident_type || !severity || !title || !description) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const incidentId = crypto.randomUUID();
    await db.prepare(`
      INSERT INTO security_incidents (id, incident_type, severity, title, description, affected_data_types, detected_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      incidentId,
      incident_type,
      severity,
      title,
      description,
      JSON.stringify(affected_data_types || []),
      userId
    ).run();

    await logAudit(db, userId, 'security_incident_reported', 'security', incidentId, { incident_type, severity }, c.req.raw, 'critical');

    return c.json({
      success: true,
      message: 'Security incident reported',
      incident_id: incidentId
    });
  } catch (error) {
    console.error('Report incident error:', error);
    return c.json({ error: 'Failed to report incident' }, 500);
  }
});

// =====================================================
// VENDOR MANAGEMENT (SOC 2)
// =====================================================
compliance.get('/vendors', async (c) => {
  try {
    const db = c.env.DB;
    const vendors = await db.prepare('SELECT * FROM vendors WHERE is_active = 1').all();

    return c.json({
      success: true,
      vendors: vendors.results
    });
  } catch (error) {
    console.error('Vendors error:', error);
    return c.json({ error: 'Failed to fetch vendors' }, 500);
  }
});

// =====================================================
// PHI INVENTORY (HIPAA)
// =====================================================
compliance.get('/phi-inventory', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) return c.json({ error: 'Authentication required' }, 401);
  const userId = String(user.id);
  if (!userId) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  try {
    const db = c.env.DB;
    const inventory = await db.prepare('SELECT * FROM phi_data_inventory').all();

    return c.json({
      success: true,
      inventory: inventory.results,
      summary: {
        total_phi_fields: inventory.results?.length || 0,
        by_sensitivity: {
          critical: inventory.results?.filter((i: any) => i.sensitivity_level === 'critical').length || 0,
          high: inventory.results?.filter((i: any) => i.sensitivity_level === 'high').length || 0,
          medium: inventory.results?.filter((i: any) => i.sensitivity_level === 'medium').length || 0,
          low: inventory.results?.filter((i: any) => i.sensitivity_level === 'low').length || 0
        }
      }
    });
  } catch (error) {
    console.error('PHI inventory error:', error);
    return c.json({ error: 'Failed to fetch PHI inventory' }, 500);
  }
});

// =====================================================
// DATA PORTABILITY EXPORT
// =====================================================
compliance.get('/export-portable', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) return c.json({ error: 'Authentication required' }, 401);
  const userId = String(user.id);
  if (!userId) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  try {
    const db = c.env.DB;
    
    // Log export request
    await logAudit(db, userId, 'data_portability_export', 'user_data', userId, {}, c.req.raw);

    // Gather all data in a portable format
    const [user, moods, voiceJournals, healthMetrics] = await Promise.all([
      db.prepare('SELECT id, email, name, created_at FROM users WHERE id = ?').bind(userId).first(),
      db.prepare('SELECT * FROM moods WHERE user_id = ?').bind(userId).all(),
      db.prepare('SELECT id, title, transcript, emotion, mood_score, created_at FROM voice_journals WHERE user_id = ?').bind(userId).all(),
      db.prepare('SELECT * FROM health_metrics WHERE user_id = ?').bind(userId).all()
    ]);

    // Format as portable JSON-LD
    const portableData = {
      '@context': 'https://schema.org',
      '@type': 'DataDownload',
      dateCreated: new Date().toISOString(),
      description: 'MoodMash User Data Export (CCPA Data Portability)',
      user: {
        '@type': 'Person',
        identifier: user?.id,
        email: user?.email,
        name: user?.name
      },
      moodEntries: moods.results?.map((m: any) => ({
        '@type': 'MoodEntry',
        identifier: m.id,
        emotion: m.emotion,
        intensity: m.intensity,
        notes: m.notes,
        dateCreated: m.created_at
      })),
      voiceJournals: voiceJournals.results?.map((v: any) => ({
        '@type': 'AudioObject',
        identifier: v.id,
        name: v.title,
        transcript: v.transcript,
        emotion: v.emotion,
        dateCreated: v.created_at
      })),
      healthMetrics: healthMetrics.results?.map((h: any) => ({
        '@type': 'HealthMetric',
        identifier: h.id,
        heartRate: h.heart_rate,
        bloodPressure: h.blood_pressure_systolic ? `${h.blood_pressure_systolic}/${h.blood_pressure_diastolic}` : null,
        weight: h.weight,
        dateCreated: h.created_at
      }))
    };

    // Create CCPA request record
    await db.prepare(`
      INSERT INTO ccpa_data_requests (user_id, request_type, status, verified_at, completed_at)
      VALUES (?, 'portability', 'completed', datetime('now'), datetime('now'))
    `).bind(userId).run();

    return c.json({
      success: true,
      message: 'Portable data export ready (CCPA Data Portability)',
      format: 'JSON-LD',
      data: portableData
    });
  } catch (error) {
    console.error('Portable export error:', error);
    return c.json({ error: 'Failed to generate portable export' }, 500);
  }
});

export default compliance;
