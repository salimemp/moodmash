import { Hono } from 'hono';
import type { Bindings, Variables } from '../../types';

const chatbot = new Hono<{ Bindings: Bindings; Variables: Variables }>();

const SYSTEM_PROMPT = `You are Mood, a warm and empathetic AI companion in the MoodMash app. Your role is to:
- Help users understand and process their emotions
- Provide supportive, non-judgmental responses
- Offer mood check-ins and emotional support
- Suggest coping strategies and mindfulness exercises
- Help identify mood patterns and triggers
- Provide journal prompts when appropriate

Guidelines:
- Be warm, friendly, and conversational
- Use emojis sparingly to convey warmth 🌟
- Never give medical advice - encourage professional help when needed
- Keep responses concise but meaningful
- Remember context from the conversation
- Be culturally sensitive and inclusive

You have access to the user's mood history to provide personalized insights.`;

// GET /api/chatbot/conversations - List user's conversations
chatbot.get('/conversations', async (c) => {
  const userId = c.get('userId') as string;
  if (!userId) return c.json({ success: false, error: 'Unauthorized' }, 401);
  
  try {
    const conversations = await c.env.DB.prepare(`
      SELECT c.*, 
        (SELECT content FROM chatbot_messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message
      FROM chatbot_conversations c
      WHERE c.user_id = ? AND c.is_active = 1
      ORDER BY c.updated_at DESC
      LIMIT 20
    `).bind(userId).all();
    
    return c.json({ success: true, conversations: conversations.results || [] });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch conversations' }, 500);
  }
});

// POST /api/chatbot/conversations - Create new conversation
chatbot.post('/conversations', async (c) => {
  const userId = c.get('userId') as string;
  if (!userId) return c.json({ success: false, error: 'Unauthorized' }, 401);
  
  try {
    const id = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO chatbot_conversations (id, user_id, title) VALUES (?, ?, 'New Conversation')
    `).bind(id, userId).run();
    
    return c.json({ success: true, conversation: { id, title: 'New Conversation' } });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to create conversation' }, 500);
  }
});

// GET /api/chatbot/messages/:conversationId - Get messages in conversation
chatbot.get('/messages/:conversationId', async (c) => {
  const userId = c.get('userId') as string;
  if (!userId) return c.json({ success: false, error: 'Unauthorized' }, 401);
  
  const conversationId = c.req.param('conversationId');
  
  try {
    // Verify ownership
    const conv = await c.env.DB.prepare(`
      SELECT id FROM chatbot_conversations WHERE id = ? AND user_id = ?
    `).bind(conversationId, userId).first();
    
    if (!conv) return c.json({ success: false, error: 'Conversation not found' }, 404);
    
    const messages = await c.env.DB.prepare(`
      SELECT * FROM chatbot_messages WHERE conversation_id = ? ORDER BY created_at ASC
    `).bind(conversationId).all();
    
    return c.json({ success: true, messages: messages.results || [] });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch messages' }, 500);
  }
});

// POST /api/chatbot/messages - Send message and get AI response
chatbot.post('/messages', async (c) => {
  const userId = c.get('userId') as string;
  if (!userId) return c.json({ success: false, error: 'Unauthorized' }, 401);
  
  const { conversationId, content, isVoice = false, language = 'en' } = await c.req.json();
  
  if (!content?.trim()) {
    return c.json({ success: false, error: 'Message content required' }, 400);
  }
  
  try {
    // Check AI message limit
    const currentMonth = new Date().toISOString().slice(0, 7);
    const usage = await c.env.DB.prepare(`
      SELECT ai_messages_count FROM usage_tracking WHERE user_id = ? AND month = ?
    `).bind(userId, currentMonth).first();
    
    const sub = await c.env.DB.prepare(`
      SELECT st.limits FROM user_subscriptions us
      JOIN subscription_tiers st ON us.tier_id = st.id WHERE us.user_id = ?
    `).bind(userId).first();
    
    const limits = sub ? JSON.parse((sub as any).limits || '{}') : { ai_messages: 0 };
    const currentUsage = (usage as any)?.ai_messages_count || 0;
    
    if (limits.ai_messages !== -1 && currentUsage >= limits.ai_messages) {
      return c.json({
        success: false,
        error: 'AI message limit reached',
        upgrade: true,
        message: "You've reached your AI chatbot limit for this month. Upgrade to Pro or Premium for more conversations! 🌟"
      }, 429);
    }
    
    // Get or create conversation
    let convId = conversationId;
    if (!convId) {
      convId = crypto.randomUUID();
      await c.env.DB.prepare(`
        INSERT INTO chatbot_conversations (id, user_id, title) VALUES (?, ?, ?)
      `).bind(convId, userId, content.slice(0, 50) + '...').run();
    }
    
    // Save user message
    const userMsgId = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO chatbot_messages (id, conversation_id, role, content, is_voice, language)
      VALUES (?, ?, 'user', ?, ?, ?)
    `).bind(userMsgId, convId, content, isVoice ? 1 : 0, language).run();
    
    // Get conversation history
    const history = await c.env.DB.prepare(`
      SELECT role, content FROM chatbot_messages 
      WHERE conversation_id = ? ORDER BY created_at ASC LIMIT 10
    `).bind(convId).all();
    
    // Get user's recent moods for context
    const recentMoods = await c.env.DB.prepare(`
      SELECT emotion, intensity, notes, created_at FROM moods 
      WHERE user_id = ? ORDER BY created_at DESC LIMIT 5
    `).bind(userId).all();
    
    const moodContext = recentMoods.results?.length 
      ? `\n\nUser's recent moods: ${JSON.stringify(recentMoods.results)}`
      : '';
    
    // Prepare messages for Gemini
    const messages = [
      { role: 'user', parts: [{ text: SYSTEM_PROMPT + moodContext }] },
      ...(history.results || []).map((msg: any) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }))
    ];
    
    // Call Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${c.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: messages,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 500
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
          ]
        })
      }
    );
    
    let aiResponse = "I'm here to support you. How are you feeling today? 🌟";
    
    if (geminiResponse.ok) {
      const data = await geminiResponse.json() as any;
      aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || aiResponse;
    }
    
    // Save AI response
    const aiMsgId = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO chatbot_messages (id, conversation_id, role, content, language)
      VALUES (?, ?, 'assistant', ?, ?)
    `).bind(aiMsgId, convId, aiResponse, language).run();
    
    // Update conversation
    await c.env.DB.prepare(`
      UPDATE chatbot_conversations SET updated_at = datetime('now') WHERE id = ?
    `).bind(convId).run();
    
    // Increment usage
    await c.env.DB.prepare(`
      INSERT OR IGNORE INTO usage_tracking (user_id, month) VALUES (?, ?)
    `).bind(userId, currentMonth).run();
    await c.env.DB.prepare(`
      UPDATE usage_tracking SET ai_messages_count = ai_messages_count + 1 WHERE user_id = ? AND month = ?
    `).bind(userId, currentMonth).run();
    
    return c.json({
      success: true,
      conversationId: convId,
      message: {
        id: aiMsgId,
        role: 'assistant',
        content: aiResponse,
        language
      }
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    return c.json({ success: false, error: 'Failed to process message' }, 500);
  }
});

// DELETE /api/chatbot/conversations/:id - Delete conversation
chatbot.delete('/conversations/:id', async (c) => {
  const userId = c.get('userId') as string;
  if (!userId) return c.json({ success: false, error: 'Unauthorized' }, 401);
  
  const convId = c.req.param('id');
  
  try {
    await c.env.DB.prepare(`
      UPDATE chatbot_conversations SET is_active = 0 WHERE id = ? AND user_id = ?
    `).bind(convId, userId).run();
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to delete conversation' }, 500);
  }
});

export default chatbot;
