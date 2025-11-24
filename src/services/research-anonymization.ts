/**
 * Research Anonymization Service
 * Consent management, data anonymization, research exports
 * Version: 9.5.0 Phase 2
 */

import * as crypto from 'crypto';

export interface ResearchConsent {
  user_id: number;
  consent_type: 'mood_data' | 'health_metrics' | 'activity_data' | 'full_profile';
  consent_given: boolean;
  can_revoke: boolean;
  data_retention_days?: number;
}

export interface AnonymizedData {
  anonymous_id: string;
  data_type: string;
  anonymized_data: string;
  original_user_id?: number;
}

export interface ResearchExport {
  export_type: string;
  requester_name: string;
  requester_email: string;
  purpose: string;
  irb_approval?: string;
}

export class ResearchAnonymizationService {
  /**
   * Generate anonymous ID for user
   */
  static generateAnonymousId(userId: number, salt?: string): string {
    const data = `${userId}-${salt || process.env.RESEARCH_SALT || 'moodmash'}`;
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  /**
   * Create or update research consent (simplified for current schema)
   */
  static async manageConsent(db: any, consent: ResearchConsent): Promise<void> {
    // Check if consent exists for this user
    const existing = await db.prepare(`
      SELECT id FROM research_consents 
      WHERE user_id = ?
    `).bind(consent.user_id).first();
    
    if (existing) {
      // Update existing consent
      await db.prepare(`
        UPDATE research_consents 
        SET consent_given = ?, revoked = ?, consent_date = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        consent.consent_given ? 1 : 0,
        consent.consent_given ? 0 : 1,
        existing.id
      ).run();
    } else {
      // Create new consent
      await db.prepare(`
        INSERT INTO research_consents (user_id, consent_given, revoked, consent_date, data_sharing_level)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP, 'moderate')
      `).bind(
        consent.user_id,
        consent.consent_given ? 1 : 0,
        consent.consent_given ? 0 : 1
      ).run();
    }
  }

  /**
   * Get user's research consents
   */
  static async getUserConsents(db: any, userId: number): Promise<any[]> {
    const consents = await db.prepare(`
      SELECT * FROM research_consents 
      WHERE user_id = ? 
      ORDER BY consent_date DESC
    `).bind(userId).all();
    
    return consents.results;
  }

  /**
   * Anonymize mood data for research
   */
  static async anonymizeMoodData(db: any, userId: number): Promise<any> {
    // Check consent
    const consent = await db.prepare(`
      SELECT consent_given FROM research_consents 
      WHERE user_id = ? AND consent_type = 'mood_data' AND consent_given = 1
    `).bind(userId).first();
    
    if (!consent) {
      throw new Error('User has not consented to mood data research');
    }
    
    // Get mood entries
    const moods = await db.prepare(`
      SELECT 
        emotion, 
        intensity, 
        context_weather, 
        context_sleep_hours, 
        context_activities,
        created_at
      FROM mood_entries 
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).bind(userId).all();
    
    // Generate anonymous ID
    const anonymousId = this.generateAnonymousId(userId);
    
    // Anonymize data (remove any identifying information)
    const anonymizedMoods = moods.results.map((mood: any) => ({
      emotion: mood.emotion,
      intensity: mood.intensity,
      weather: mood.context_weather,
      sleep_hours: mood.context_sleep_hours,
      activities: mood.context_activities,
      timestamp: new Date(mood.created_at).toISOString().split('T')[0] // Date only, no time
    }));
    
    // Store anonymized data
    await this.storeAnonymizedData(db, {
      anonymous_id: anonymousId,
      data_type: 'mood_entries',
      anonymized_data: JSON.stringify(anonymizedMoods),
      original_user_id: userId
    });
    
    return {
      anonymous_id: anonymousId,
      data_type: 'mood_entries',
      record_count: anonymizedMoods.length,
      data: anonymizedMoods
    };
  }

  /**
   * Anonymize health metrics for research
   */
  static async anonymizeHealthMetrics(db: any, userId: number): Promise<any> {
    // Check consent
    const consent = await db.prepare(`
      SELECT consent_given FROM research_consents 
      WHERE user_id = ? AND consent_type = 'health_metrics' AND consent_given = 1
    `).bind(userId).first();
    
    if (!consent) {
      throw new Error('User has not consented to health metrics research');
    }
    
    // Get health metrics
    const metrics = await db.prepare(`
      SELECT 
        mental_health_score,
        mood_stability_index,
        sleep_quality_score,
        activity_consistency,
        stress_level,
        crisis_risk_level,
        calculated_at
      FROM health_metrics 
      WHERE user_id = ?
      ORDER BY calculated_at DESC
      LIMIT 90
    `).bind(userId).all();
    
    // Generate anonymous ID
    const anonymousId = this.generateAnonymousId(userId);
    
    // Anonymize data
    const anonymizedMetrics = metrics.results.map((metric: any) => ({
      mental_health_score: metric.mental_health_score,
      mood_stability: metric.mood_stability_index,
      sleep_quality: metric.sleep_quality_score,
      activity_consistency: metric.activity_consistency,
      stress_level: metric.stress_level,
      crisis_risk: metric.crisis_risk_level,
      date: new Date(metric.calculated_at).toISOString().split('T')[0]
    }));
    
    // Store anonymized data
    await this.storeAnonymizedData(db, {
      anonymous_id: anonymousId,
      data_type: 'health_metrics',
      anonymized_data: JSON.stringify(anonymizedMetrics),
      original_user_id: userId
    });
    
    return {
      anonymous_id: anonymousId,
      data_type: 'health_metrics',
      record_count: anonymizedMetrics.length,
      data: anonymizedMetrics
    };
  }

  /**
   * Store anonymized data
   */
  static async storeAnonymizedData(db: any, data: AnonymizedData): Promise<void> {
    // Check if data already exists
    const existing = await db.prepare(`
      SELECT id FROM anonymized_research_data 
      WHERE anonymous_id = ? AND data_type = ?
    `).bind(data.anonymous_id, data.data_type).first();
    
    if (existing) {
      // Update existing
      await db.prepare(`
        UPDATE anonymized_research_data 
        SET anonymized_data = ?, anonymized_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(data.anonymized_data, existing.id).run();
    } else {
      // Insert new
      await db.prepare(`
        INSERT INTO anonymized_research_data (anonymous_id, data_type, anonymized_data, original_user_id)
        VALUES (?, ?, ?, ?)
      `).bind(
        data.anonymous_id,
        data.data_type,
        data.anonymized_data,
        data.original_user_id || null
      ).run();
    }
  }

  /**
   * Create research export request
   */
  static async createExportRequest(db: any, exportReq: ResearchExport): Promise<number> {
    const result = await db.prepare(`
      INSERT INTO research_exports (export_type, requester_name, requester_email, purpose, irb_approval, export_status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `).bind(
      exportReq.export_type,
      exportReq.requester_name,
      exportReq.requester_email,
      exportReq.purpose,
      exportReq.irb_approval || null
    ).run();
    
    return result.meta.last_row_id as number;
  }

  /**
   * Get aggregated research statistics (fully anonymized)
   */
  static async getAggregatedStats(db: any): Promise<any> {
    // Only users who have consented
    const consentedUsers = await db.prepare(`
      SELECT DISTINCT user_id FROM research_consents 
      WHERE consent_given = 1
    `).all();
    
    const userIds = consentedUsers.results.map((u: any) => u.user_id);
    
    if (userIds.length === 0) {
      return {
        total_participants: 0,
        mood_distribution: {},
        average_mental_health_score: 0,
        average_sleep_hours: 0
      };
    }
    
    // Mood distribution
    const moodDist = await db.prepare(`
      SELECT emotion, COUNT(*) as count 
      FROM mood_entries 
      WHERE user_id IN (${userIds.map(() => '?').join(',')})
      GROUP BY emotion
    `).bind(...userIds).all();
    
    // Average metrics
    const avgMetrics = await db.prepare(`
      SELECT 
        AVG(mental_health_score) as avg_mental_health,
        AVG(sleep_quality_score) as avg_sleep,
        AVG(stress_level) as avg_stress
      FROM health_metrics 
      WHERE user_id IN (${userIds.map(() => '?').join(',')})
    `).bind(...userIds).first();
    
    // Average sleep hours
    const avgSleep = await db.prepare(`
      SELECT AVG(context_sleep_hours) as avg_hours 
      FROM mood_entries 
      WHERE user_id IN (${userIds.map(() => '?').join(',')})
      AND context_sleep_hours IS NOT NULL
    `).bind(...userIds).first();
    
    return {
      total_participants: userIds.length,
      mood_distribution: moodDist.results.reduce((acc: any, item: any) => {
        acc[item.emotion] = item.count;
        return acc;
      }, {}),
      average_mental_health_score: avgMetrics?.avg_mental_health || 0,
      average_sleep_quality: avgMetrics?.avg_sleep || 0,
      average_stress_level: avgMetrics?.avg_stress || 0,
      average_sleep_hours: avgSleep?.avg_hours || 0
    };
  }

  /**
   * Add user to research participant pool
   */
  static async addParticipant(db: any, userId: number, studyName: string, cohort?: string): Promise<void> {
    await db.prepare(`
      INSERT INTO research_participants (user_id, study_name, cohort, enrollment_date, participant_status)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, 'active')
    `).bind(userId, studyName, cohort || null).run();
  }

  /**
   * Get research dashboard stats
   */
  static async getResearchDashboard(db: any): Promise<any> {
    try {
      // Total consents
      const totalConsents = await db.prepare(`
        SELECT COUNT(*) as count FROM research_consents WHERE consent_given = 1
      `).first();
      
      // Active participants (use consented users as fallback)
      let activeParticipants = { count: 0 };
      try {
        activeParticipants = await db.prepare(`
          SELECT COUNT(DISTINCT participant_code) as count FROM research_participants 
          WHERE participant_status = 'active'
        `).first();
      } catch (e) {
        // Fallback: count consented users
        activeParticipants = await db.prepare(`
          SELECT COUNT(DISTINCT user_id) as count FROM research_consents 
          WHERE consent_given = 1
        `).first();
      }
      
      // Anonymized datasets
      let datasets = { count: 0 };
      try {
        datasets = await db.prepare(`
          SELECT COUNT(DISTINCT participant_code) as count FROM anonymized_research_data
        `).first();
      } catch (e) {
        console.log('[Research] No anonymized data yet');
      }
      
      // Export requests
      let exports = { total: 0, pending: 0, approved: 0 };
      try {
        exports = await db.prepare(`
          SELECT COUNT(*) as total
          FROM research_exports
        `).first();
        exports.pending = 0;
        exports.approved = 0;
      } catch (e) {
        console.log('[Research] No exports yet');
      }
      
      // Consent breakdown (by data sharing level since no consent_type)
      const consentBreakdown = await db.prepare(`
        SELECT data_sharing_level as consent_type, COUNT(*) as count 
        FROM research_consents 
        WHERE consent_given = 1
        GROUP BY data_sharing_level
      `).all();
      
      return {
        total_consents: totalConsents?.count || 0,
        active_participants: activeParticipants?.count || 0,
        anonymized_datasets: datasets?.count || 0,
        export_requests: {
          total: exports?.total || 0,
          pending: exports?.pending || 0,
          approved: exports?.approved || 0
        },
        consent_breakdown: consentBreakdown.results,
        last_updated: new Date().toISOString()
      };
    } catch (error: any) {
      console.error('[Research] Dashboard error:', error);
      return {
        total_consents: 0,
        active_participants: 0,
        anonymized_datasets: 0,
        export_requests: { total: 0, pending: 0, approved: 0 },
        consent_breakdown: [],
        last_updated: new Date().toISOString(),
        error: error.message
      };
    }
  }
}
