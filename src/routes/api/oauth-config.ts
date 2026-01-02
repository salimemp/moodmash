/**
 * OAuth Configuration Endpoint
 * Returns which OAuth providers are configured
 */

import { Hono } from 'hono';
import type { Bindings } from '../../types';
import { isOAuthConfigured } from '../../auth';

const oauthConfig = new Hono<{ Bindings: Bindings }>();

// Get available OAuth providers
oauthConfig.get('/config', async (c) => {
  const { env } = c;
  
  const providers = {
    google: isOAuthConfigured('google', env),
    github: isOAuthConfigured('github', env),
  };
  
  return c.json({
    providers,
    available: Object.entries(providers)
      .filter(([_, enabled]) => enabled)
      .map(([name, _]) => name),
  });
});

export default oauthConfig;
