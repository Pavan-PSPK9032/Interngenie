const { WebSocketServer } = require("ws");
const jwt = require("jsonwebtoken");
const url = require("url");
const ChatMessage = require("./models/ChatMessage");
const User = require("./models/User");

const HEARTBEAT_INTERVAL = 30000;
const MAX_MSG_SIZE = 1024 * 1024;
const RATE_LIMIT_WINDOW = 60000;
const RATE_LIMIT_MAX = 30;
const ONLINE_BROADCAST_INTERVAL = 30000;

const connectedUsers = new Map();
const rateLimits = new Map();
let onlineInterval = null;

function authenticateToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.uid;
  } catch {
    return null;
  }
}

function sendJSON(ws, type, data) {
  if (ws.readyState === 1) {
    ws.send(JSON.stringify({ type, ...data }));
  }
}

function broadcastToUser(userId, type, data, excludeWs) {
  const sockets = connectedUsers.get(userId);
  if (!sockets) return;
  for (const ws of sockets) {
    if (ws !== excludeWs && ws.readyState === 1) {
      ws.send(JSON.stringify({ type, ...data }));
    }
  }
}

function broadcastOnlineUsers() {
  const online = Array.from(connectedUsers.keys());
  const payload = JSON.stringify({ type: "online_users", users: online });
  for (const [, sockets] of connectedUsers) {
    for (const ws of sockets) {
      if (ws.readyState === 1) {
        ws.send(payload);
      }
    }
  }
}

function checkRateLimit(userId) {
  const now = Date.now();
  const record = rateLimits.get(userId);
  if (!record || now - record.windowStart > RATE_LIMIT_WINDOW) {
    rateLimits.set(userId, { windowStart: now, count: 1 });
    return true;
  }
  record.count++;
  return record.count <= RATE_LIMIT_MAX;
}

async function generateAIReply(message) {
  try {
    const ZAI = (await import("z-ai-web-dev-sdk")).default;
    const zai = await ZAI.create();
    const SYSTEM_PROMPT = `You are InternGenie, the AI career assistant for an AI-powered internship discovery platform. Be warm, encouraging, and concise.`;
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: message },
      ],
      temperature: 0.7,
      max_tokens: 600,
    });
    return completion.choices[0]?.message?.content || "I could not generate a response.";
  } catch {
    return "I'm here to help with internships, careers, resumes, and interviews! Tell me more.";
  }
}

async function handleChatMessage(ws, userId, payload) {
  const { content, conversationId } = payload;
  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return sendJSON(ws, "error", { message: "Message content is required" });
  }

  const trimmed = content.trim();
  if (trimmed.length > MAX_MSG_SIZE) {
    return sendJSON(ws, "error", { message: "Message too large" });
  }

  const isAIRequest = trimmed.startsWith("/") || trimmed.toLowerCase().startsWith("@ai");

  let role = "user";
  let msgType = "user";
  let finalContent = trimmed;
  let senderId = userId;

  if (isAIRequest) {
    const aiText = trimmed.startsWith("/") ? trimmed.slice(1).trim() : trimmed.replace(/^@ai\s*/i, "").trim();
    const assistantReply = await generateAIReply(aiText || trimmed);
    finalContent = trimmed;
    const convId = conversationId || `dm-${userId}-ai`;

    const userMsg = await ChatMessage.create({
      conversationId: convId,
      senderId: userId,
      userId,
      role: "user",
      content: trimmed,
      type: "user",
      readBy: [userId],
    });

    const aiMsg = await ChatMessage.create({
      conversationId: convId,
      senderId: "ai",
      userId,
      role: "assistant",
      content: assistantReply,
      type: "ai",
      readBy: [userId],
    });

    sendJSON(ws, "chat_message", { message: userMsg.toObject() });
    sendJSON(ws, "chat_message", { message: aiMsg.toObject() });
    return;
  }

  const convId = conversationId || `dm-${userId}`;
  const msg = await ChatMessage.create({
    conversationId: convId,
    senderId: userId,
    userId,
    role,
    content: finalContent,
    type: msgType,
    readBy: [userId],
  });

  sendJSON(ws, "chat_message", { message: msg.toObject() });

  for (const [uid, sockets] of connectedUsers) {
    if (uid === userId) continue;
    if (sockets && sockets.size > 0) {
      for (const s of sockets) {
        if (s.readyState === 1) {
          s.send(JSON.stringify({ type: "chat_message", message: msg.toObject() }));
        }
      }
    }
  }
}

function handleTypingStart(ws, userId, payload) {
  const { conversationId } = payload;
  if (!conversationId) return;

  for (const [uid, sockets] of connectedUsers) {
    if (uid === userId) continue;
    for (const s of sockets) {
      if (s.readyState === 1) {
        s.send(JSON.stringify({ type: "typing_start", userId, conversationId }));
      }
    }
  }
}

function handleTypingStop(ws, userId, payload) {
  const { conversationId } = payload;
  if (!conversationId) return;

  for (const [uid, sockets] of connectedUsers) {
    if (uid === userId) continue;
    for (const s of sockets) {
      if (s.readyState === 1) {
        s.send(JSON.stringify({ type: "typing_stop", userId, conversationId }));
      }
    }
  }
}

async function handleMarkRead(ws, userId, payload) {
  const { messageId } = payload;
  if (!messageId) return;

  try {
    const msg = await ChatMessage.findById(messageId);
    if (!msg) return sendJSON(ws, "error", { message: "Message not found" });
    if (!msg.readBy.includes(userId)) {
      msg.readBy.push(userId);
      await msg.save();
    }
    sendJSON(ws, "mark_read", { messageId, readBy: msg.readBy });
  } catch {
    sendJSON(ws, "error", { message: "Failed to mark message as read" });
  }
}

function setupWebSocket(server) {
  const wss = new WebSocketServer({
    server,
    maxPayload: MAX_MSG_SIZE,
  });

  onlineInterval = setInterval(broadcastOnlineUsers, ONLINE_BROADCAST_INTERVAL);

  wss.on("connection", (ws, req) => {
    const parsedUrl = url.parse(req.url, true);
    const token = parsedUrl.query.token;

    const userId = authenticateToken(token);
    if (!userId) {
      sendJSON(ws, "error", { message: "Authentication failed" });
      ws.close(4001, "Unauthorized");
      return;
    }

    ws.isAlive = true;
    ws.userId = userId;

    if (!connectedUsers.has(userId)) {
      connectedUsers.set(userId, new Set());
    }
    connectedUsers.get(userId).add(ws);

    sendJSON(ws, "connected", { userId });

    broadcastOnlineUsers();

    ws.on("pong", () => { ws.isAlive = true; });

    ws.on("message", async (raw) => {
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        return sendJSON(ws, "error", { message: "Invalid JSON" });
      }

      const { type, ...rest } = parsed;

      if (!checkRateLimit(userId)) {
        return sendJSON(ws, "error", { message: "Rate limit exceeded. Max 30 messages per minute." });
      }

      switch (type) {
        case "chat_message":
          await handleChatMessage(ws, userId, rest);
          break;
        case "typing_start":
          handleTypingStart(ws, userId, rest);
          break;
        case "typing_stop":
          handleTypingStop(ws, userId, rest);
          break;
        case "mark_read":
          await handleMarkRead(ws, userId, rest);
          break;
        case "ping":
          sendJSON(ws, "pong", {});
          break;
        default:
          sendJSON(ws, "error", { message: "Unknown message type" });
      }
    });

    ws.on("close", () => {
      const sockets = connectedUsers.get(userId);
      if (sockets) {
        sockets.delete(ws);
        if (sockets.size === 0) {
          connectedUsers.delete(userId);
        }
      }
      rateLimits.delete(userId);
      broadcastOnlineUsers();
    });

    ws.on("error", () => {
      const sockets = connectedUsers.get(userId);
      if (sockets) {
        sockets.delete(ws);
        if (sockets.size === 0) {
          connectedUsers.delete(userId);
        }
      }
    });
  });

  const heartbeat = setInterval(() => {
    for (const ws of wss.clients) {
      if (ws.isAlive === false) {
        const uid = ws.userId;
        const sockets = connectedUsers.get(uid);
        if (sockets) {
          sockets.delete(ws);
          if (sockets.size === 0) connectedUsers.delete(uid);
        }
        ws.terminate();
        continue;
      }
      ws.isAlive = false;
      ws.ping();
    }
  }, HEARTBEAT_INTERVAL);

  wss.on("close", () => {
    clearInterval(heartbeat);
    clearInterval(onlineInterval);
  });

  return wss;
}

module.exports = { setupWebSocket };
