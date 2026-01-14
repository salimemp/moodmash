/**
 * Contact API Routes
 * Handles contact form submissions and retrieval
 */

import { Hono } from 'hono';
import type { Bindings } from '../../types';
import { getCurrentUser, requireAuth } from '../../auth';
import { sanitizeInput, isValidEmail } from '../../middleware/security';

interface ContactSubmission {
  id: number;
  user_id: number | null;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
}

interface ContactBody {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const contact = new Hono<{ Bindings: Bindings }>();

// Submit contact form (public but can be authenticated)
contact.post('/', async (c) => {
  const { DB } = c.env;
  
  // Try to get user if authenticated
  let userId: number | null = null;
  try {
    const user = await getCurrentUser(c);
    userId = user?.id || null;
  } catch {
    // Not authenticated - that's okay for contact form
  }

  try {
    const body = await c.req.json<ContactBody>();

    // Validate required fields
    if (!body.name || !body.email || !body.subject || !body.message) {
      return c.json({ error: 'All fields are required' }, 400);
    }

    if (!isValidEmail(body.email)) {
      return c.json({ error: 'Invalid email address' }, 400);
    }

    // Sanitize inputs
    const sanitizedName = sanitizeInput(body.name);
    const sanitizedSubject = sanitizeInput(body.subject);
    const sanitizedMessage = sanitizeInput(body.message);

    const result = await DB.prepare(`
      INSERT INTO contact_submissions (user_id, name, email, subject, message, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `).bind(userId, sanitizedName, body.email, sanitizedSubject, sanitizedMessage).run();

    return c.json({
      id: result.meta.last_row_id,
      message: 'Thank you for your message. We will respond soon.'
    }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Get user's contact submissions
contact.get('/my-submissions', requireAuth, async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    const submissions = await DB.prepare(`
      SELECT id, subject, status, created_at
      FROM contact_submissions
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 20
    `).bind(user!.id).all();

    return c.json({ submissions: submissions.results || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Get specific submission
contact.get('/submission/:id', requireAuth, async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);
  const submissionId = c.req.param('id');

  try {
    const submission = await DB.prepare(`
      SELECT * FROM contact_submissions
      WHERE id = ? AND user_id = ?
    `).bind(submissionId, user!.id).first() as ContactSubmission | null;

    if (!submission) {
      return c.json({ error: 'Submission not found' }, 404);
    }

    return c.json({ submission });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

export default contact;
