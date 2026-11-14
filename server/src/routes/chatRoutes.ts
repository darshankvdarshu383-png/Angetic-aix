import { Router, Request, Response } from 'express';
import { db } from '../db/database.js';
import { DEFAULT_USER_ID } from '../db/seedData.js';
import { geminiService } from '../ai/geminiClient.js';
import { ChatMessage } from '../db/schema.js';
import { z } from 'zod';

const router = Router();

// Get all sessions
router.get('/sessions', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || DEFAULT_USER_ID;
  const sessions = db.getChatSessions(userId);
  res.json({ sessions });
});

// Create session
router.post('/sessions', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || DEFAULT_USER_ID;
  const { title } = req.body;
  const session = db.createChatSession(userId, title || 'Operational Inquiry');
  res.status(201).json({ session });
});

// Get session messages
router.get('/sessions/:id', (req: Request, res: Response) => {
  const id = String(req.params.id);
  const session = db.getChatSessionById(id);
  if (!session) {
    return res.status(404).json({ error: 'Chat session not found' });
  }

  const messages = db.getChatMessages(id);
  res.json({ session, messages });
});

const SendMessageSchema = z.object({
  sessionId: z.string().min(1),
  content: z.string().min(1),
});

// Send message & get live grounded response
router.post('/message', async (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || DEFAULT_USER_ID;
  const parseResult = SendMessageSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({ error: 'Invalid message payload', details: parseResult.error.errors });
  }

  const { sessionId, content } = parseResult.data;

  // Verify session exists
  let session = db.getChatSessionById(sessionId);
  if (!session) {
    session = db.createChatSession(userId, content.slice(0, 30));
  }

  // 1. Record User Message
  const userMsg: ChatMessage = {
    id: `msg-usr-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    session_id: session.id,
    sender: 'user',
    content,
    citations: [],
    suggested_prompts: [],
    created_at: new Date().toISOString(),
  };
  db.insertChatMessage(userMsg);

  // 2. Fetch groundings snapshot from live database
  const incidents = db.getIncidents(userId).filter((i) => i.status !== 'RESOLVED');
  const workflows = db.getMitigationWorkflows(userId);
  const pendingMitigations = workflows.filter((w) => w.status === 'PENDING_APPROVAL');
  const records = db.getRecords(userId);
  const anomalousRecords = records.filter((r) => r.is_anomaly);
  const policy = db.getGuardrailPolicy(userId);

  // 3. Conversation history
  const previousMessages = db.getChatMessages(session.id);
  const history = previousMessages.map((m) => ({
    sender: m.sender,
    content: m.content,
  }));

  try {
    const aiAnswer = await geminiService.generateChatbotAnswer(content, history, {
      incidents,
      pendingMitigations,
      anomalousRecords,
      policy: {
        hitl_risk_threshold: policy.hitl_risk_threshold,
        hitl_usd_threshold: policy.hitl_usd_threshold,
        mandatory_hitl_domains: policy.mandatory_hitl_domains,
      },
    });

    const botMsg: ChatMessage = {
      id: `msg-bot-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      session_id: session.id,
      sender: 'assistant',
      content: aiAnswer.content,
      citations: aiAnswer.citations,
      suggested_prompts: aiAnswer.suggested_prompts,
      created_at: new Date().toISOString(),
    };
    db.insertChatMessage(botMsg);

    res.json({
      userMessage: userMsg,
      assistantMessage: botMsg,
    });
  } catch (err: any) {
    console.error('[ChatRoutes] Error in chatbot agent response:', err);
    res.status(500).json({ error: 'Failed to process copilot query', details: err.message });
  }
});

export default router;
