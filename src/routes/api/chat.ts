/**
 * Chat API Routes
 * Handles AI chat conversations and messages
 */

import { Hono } from 'hono';
import type { Bindings } from '../../types';
import { getCurrentUser, requireAuth } from '../../auth';

interface ConversationRow {
  id: number;
  user_id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

interface MessageRow {
  id: number;
  conversation_id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface CreateConversationBody {
  title?: string;
}

interface CreateMessageBody {
  content: string;
}

const chat = new Hono<{ Bindings: Bindings }>();

// Apply auth to all routes
chat.use('*', requireAuth);

// Create new conversation
chat.post('/conversations', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    const body = await c.req.json<CreateConversationBody>().catch(() => ({ title: undefined }));
    const title = body.title || `Conversation ${new Date().toLocaleDateString()}`;

    const result = await DB.prepare(`
      INSERT INTO chat_conversations (user_id, title)
      VALUES (?, ?)
    `).bind(user!.id, title).run();

    const conversation = await DB.prepare(
      'SELECT * FROM chat_conversations WHERE id = ?'
    ).bind(result.meta.last_row_id).first() as ConversationRow;

    return c.json({ conversation }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Get user's conversations
chat.get('/conversations', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);

  try {
    const conversations = await DB.prepare(`
      SELECT * FROM chat_conversations
      WHERE user_id = ?
      ORDER BY updated_at DESC
      LIMIT 50
    `).bind(user!.id).all();

    return c.json({ conversations: conversations.results });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Get messages for a conversation
chat.get('/conversations/:id/messages', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);
  const conversationId = c.req.param('id');

  try {
    // Verify ownership
    const conversation = await DB.prepare(`
      SELECT id FROM chat_conversations
      WHERE id = ? AND user_id = ?
    `).bind(conversationId, user!.id).first();

    if (!conversation) {
      return c.json({ error: 'Conversation not found' }, 404);
    }

    const messages = await DB.prepare(`
      SELECT * FROM chat_messages
      WHERE conversation_id = ?
      ORDER BY created_at ASC
    `).bind(conversationId).all();

    return c.json({ messages: messages.results });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Add message to conversation
chat.post('/conversations/:id/messages', async (c) => {
  const { DB, GEMINI_API_KEY } = c.env;
  const user = await getCurrentUser(c);
  const conversationId = c.req.param('id');

  try {
    // Verify ownership
    const conversation = await DB.prepare(`
      SELECT id FROM chat_conversations
      WHERE id = ? AND user_id = ?
    `).bind(conversationId, user!.id).first();

    if (!conversation) {
      return c.json({ error: 'Conversation not found' }, 404);
    }

    const body = await c.req.json<CreateMessageBody>();

    if (!body.content || !body.content.trim()) {
      return c.json({ error: 'Message content is required' }, 400);
    }

    // Save user message
    await DB.prepare(`
      INSERT INTO chat_messages (conversation_id, role, content)
      VALUES (?, 'user', ?)
    `).bind(conversationId, body.content).run();

    // Generate AI response (simplified - can integrate with actual AI)
    const aiResponse = generateAIResponse(body.content);

    // Save AI response
    const result = await DB.prepare(`
      INSERT INTO chat_messages (conversation_id, role, content)
      VALUES (?, 'assistant', ?)
    `).bind(conversationId, aiResponse).run();

    // Update conversation timestamp
    await DB.prepare(`
      UPDATE chat_conversations
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(conversationId).run();

    return c.json({
      userMessage: { content: body.content, role: 'user' },
      assistantMessage: { id: result.meta.last_row_id, content: aiResponse, role: 'assistant' }
    }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Delete conversation
chat.delete('/conversations/:id', async (c) => {
  const { DB } = c.env;
  const user = await getCurrentUser(c);
  const conversationId = c.req.param('id');

  try {
    // Verify ownership and delete
    const result = await DB.prepare(`
      DELETE FROM chat_conversations
      WHERE id = ? AND user_id = ?
    `).bind(conversationId, user!.id).run();

    if (result.meta.changes === 0) {
      return c.json({ error: 'Conversation not found' }, 404);
    }

    // Delete associated messages
    await DB.prepare(`
      DELETE FROM chat_messages
      WHERE conversation_id = ?
    `).bind(conversationId).run();

    return c.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Helper function to generate AI response
function generateAIResponse(userMessage: string): string {
  const lowerMessage = userMessage.toLowerCase();

  if (lowerMessage.includes('anxious') || lowerMessage.includes('anxiety')) {
    return "I understand anxiety can be challenging. Here are some techniques that might help: deep breathing exercises, grounding techniques (5-4-3-2-1), or a short mindfulness meditation. Would you like me to guide you through any of these?";
  }

  if (lowerMessage.includes('sad') || lowerMessage.includes('depressed')) {
    return "I'm sorry you're feeling this way. It's important to acknowledge your feelings. Some things that might help: reaching out to someone you trust, engaging in a small activity you enjoy, or simply giving yourself permission to rest. If these feelings persist, please consider speaking with a mental health professional.";
  }

  if (lowerMessage.includes('happy') || lowerMessage.includes('good')) {
    return "That's wonderful to hear! 🎉 Positive moments are worth celebrating. Consider journaling about what contributed to this feeling so you can recreate these conditions in the future. Keep up the great work on your wellness journey!";
  }

  if (lowerMessage.includes('sleep') || lowerMessage.includes('tired')) {
    return "Sleep is crucial for mental wellness. Here are some tips: maintain a consistent sleep schedule, limit screen time before bed, create a calming bedtime routine, and ensure your sleep environment is comfortable. Would you like more specific advice?";
  }

  if (lowerMessage.includes('stress')) {
    return "Stress is a common challenge. Some strategies to manage it: prioritize tasks, take regular breaks, practice relaxation techniques, and maintain boundaries. Remember, it's okay to ask for help when needed.";
  }

  return "Thank you for sharing. I'm here to support your mental wellness journey. Feel free to tell me more about how you're feeling, or ask about specific wellness techniques like meditation, journaling, or stress management.";
}

export default chat;
