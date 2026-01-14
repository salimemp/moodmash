/**
 * API Routes Index
 * Central export for all API route modules
 */

// Auth routes
export { default as authRoutes } from './auth';
export { default as oauthRoutes } from '../auth/oauth';

// Core routes
export { default as moodRoutes } from './mood';
export { default as statsRoutes } from './stats';
export { default as activitiesRoutes } from './activities';
export { default as insightsRoutes } from './insights';

// Social routes
export { default as socialRoutes } from './social';
export { default as groupsRoutes } from './groups';

// AI routes
export { default as aiRoutes } from './ai';
export { default as chatRoutes } from './chat';

// Health & compliance routes
export { default as healthRoutes } from './health';
export { default as hipaaRoutes } from './hipaa';
export { default as securityRoutes } from './security';
export { default as ccpaRoutes } from './ccpa';
export { default as researchRoutes } from './research';

// User management routes
export { default as userRoutes } from './user';
export { default as subscriptionRoutes } from './subscription';
export { default as tokensRoutes } from './tokens';

// Media & files routes
export { default as filesRoutes } from './files';
export { default as mediaRoutes } from './media';

// Feature routes
export { default as gamificationRoutes } from './gamification';
export { default as voiceJournalRoutes } from './voice-journal';
export { default as arRoutes } from './ar';
export { default as biometricsRoutes } from './biometrics-routes';

// Support & contact routes
export { default as supportRoutes } from './support';
export { default as contactRoutes } from './contact';

// Admin & monitoring routes
export { default as adminRoutes } from './admin';
export { default as analyticsRoutes } from './analytics';
export { default as performanceRoutes } from './performance';
export { default as monitoringRoutes } from './monitoring';
export { default as featureFlagsRoutes } from './feature-flags';

// Utility routes
export { default as captchaRoutes } from './captcha';
export { default as secretsRoutes } from './secrets';
