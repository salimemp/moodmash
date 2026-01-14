/**
 * Support API Routes
 * Handles support resources, hotlines, access logging
 */

import { Hono } from 'hono';
import type { Bindings } from '../../types';
import { getCurrentUser, requireAuth } from '../../auth';

const support = new Hono<{ Bindings: Bindings }>();

// Get support resources (public)
support.get('/resources', async (c) => {
  const resources = [
    {
      category: 'Crisis Support',
      items: [
        { name: 'National Suicide Prevention Lifeline', contact: '988', type: 'phone' },
        { name: 'Crisis Text Line', contact: 'Text HOME to 741741', type: 'text' },
        { name: 'International Association for Suicide Prevention', url: 'https://www.iasp.info/resources/Crisis_Centres/', type: 'website' }
      ]
    },
    {
      category: 'Mental Health Resources',
      items: [
        { name: 'SAMHSA National Helpline', contact: '1-800-662-4357', type: 'phone' },
        { name: 'NAMI Helpline', contact: '1-800-950-6264', type: 'phone' },
        { name: 'Mental Health America', url: 'https://www.mhanational.org/', type: 'website' }
      ]
    },
    {
      category: 'Self-Help Tools',
      items: [
        { name: 'Guided Meditation', url: '/activities?category=meditation', type: 'internal' },
        { name: 'Breathing Exercises', url: '/activities?category=breathing', type: 'internal' },
        { name: 'Mood Tracking', url: '/log', type: 'internal' }
      ]
    }
  ];

  return c.json({ resources });
});

// Get crisis hotlines (public)
support.get('/hotlines', async (c) => {
  const region = c.req.query('region') || 'US';

  const hotlines: Record<string, Array<{ name: string; phone: string; available: string }>> = {
    US: [
      { name: 'National Suicide Prevention Lifeline', phone: '988', available: '24/7' },
      { name: 'Crisis Text Line', phone: 'Text HOME to 741741', available: '24/7' },
      { name: 'Veterans Crisis Line', phone: '988, Press 1', available: '24/7' }
    ],
    UK: [
      { name: 'Samaritans', phone: '116 123', available: '24/7' },
      { name: 'SHOUT', phone: 'Text SHOUT to 85258', available: '24/7' }
    ],
    CA: [
      { name: 'Canada Suicide Prevention', phone: '1-833-456-4566', available: '24/7' },
      { name: 'Kids Help Phone', phone: '1-800-668-6868', available: '24/7' }
    ]
  };

  return c.json({ hotlines: hotlines[region] || hotlines['US'], region });
});

// Log access to support resources (authenticated)
support.post('/log-access', requireAuth, async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    const body = await c.req.json<{ resource: string; action: string }>();

    await DB.prepare(`
      INSERT INTO support_access_logs (user_id, resource, action)
      VALUES (?, ?, ?)
    `).bind(user!.id, body.resource, body.action).run();

    return c.json({ logged: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

export default support;
