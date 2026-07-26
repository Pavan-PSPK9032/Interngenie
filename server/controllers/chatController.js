const ChatMessage = require("../models/ChatMessage");

const SYSTEM_PROMPT = `You are InternGenie, the AI career assistant for the PM Internship Scheme platform.
You help Indian students with finding suitable internships, career guidance, resume tips, interview prep, and skill development.
Be warm, encouraging, and concise (under 200 words per response).`;

function generateFallbackReply(question) {
  const q = question.toLowerCase();
  if (q.includes("resume")) return "For a strong resume: (1) Keep it to one page, (2) Use action verbs, (3) Quantify achievements, (4) Tailor it to each role, (5) Proofread.";
  if (q.includes("interview")) return "Interview tips: (1) Research the company, (2) Practice common questions, (3) Use STAR method, (4) Prepare questions to ask, (5) Stay calm.";
  if (q.includes("data science")) return "For Data Science: Master Python, SQL, statistics, and Pandas. Build projects on Kaggle.";
  if (q.includes("web") || q.includes("full stack")) return "For Full Stack: Master JavaScript, React, Node.js, and databases. Build projects on GitHub.";
  return "I'm here to help with internships, careers, resumes, and interviews! Tell me about your background.";
}

exports.chat = async (req, res, next) => {
  try {
    const { messages, question } = req.body;
    const userMsg = question || (messages && messages[messages.length - 1]?.content);
    if (!userMsg) return res.status(400).json({ error: "No message" });

    let assistantReply;
    try {
      const ZAI = (await import("z-ai-web-dev-sdk")).default;
      const zai = await ZAI.create();
      const conversationMessages = [
        { role: "system", content: SYSTEM_PROMPT },
        ...(messages || []).slice(-6).map((m) => ({ role: m.role, content: m.content })),
      ];
      if (!messages) conversationMessages.push({ role: "user", content: userMsg });
      const completion = await zai.chat.completions.create({ messages: conversationMessages, temperature: 0.7, max_tokens: 600 });
      assistantReply = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";
    } catch (e) {
      assistantReply = generateFallbackReply(userMsg);
    }

    if (req.user) {
      await ChatMessage.create({ userId: req.user.id, role: "user", content: userMsg });
      await ChatMessage.create({ userId: req.user.id, role: "assistant", content: assistantReply });
    }

    return res.json({ reply: assistantReply });
  } catch (err) { next(err); }
};
