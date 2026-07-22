// POST /api/chat — AI assistant powered by z-ai-web-dev-sdk
import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

const SYSTEM_PROMPT = `You are InternGenie, the AI career assistant for the PM Internship Scheme platform.
You help Indian students with:
- Finding suitable internships based on their skills and interests
- Career guidance and role recommendations
- Resume building tips
- Interview preparation (technical + HR)
- Skill development roadmaps
- Cover letter writing tips

Be warm, encouraging, and concise (under 200 words per response).
Use simple English that's easy to understand.
If asked about specific internships, suggest domains like Data Science, Web Development, AI/ML, DevOps, UI/UX, Marketing, Product Management, Cybersecurity.
If asked about specific companies, mention popular Indian tech companies like TCS, Infosys, Flipkart, Razorpay, Zoho, Swiggy, etc.
Always encourage students to apply early and keep learning.`;

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    const body = await req.json();
    const { messages, question } = body as {
      messages?: { role: "user" | "assistant"; content: string }[];
      question?: string;
    };

    const userMsg = question || (messages && messages[messages.length - 1]?.content);
    if (!userMsg) {
      return NextResponse.json({ error: "No message" }, { status: 400 });
    }

    // Build conversation history
    const conversationMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...(messages || []).slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      })),
    ];
    if (!messages) {
      conversationMessages.push({ role: "user", content: userMsg });
    }

    let assistantReply: string;
    try {
      const zai = await ZAI.create();
      const completion = await zai.chat.completions.create({
        messages: conversationMessages,
        temperature: 0.7,
        max_tokens: 600,
      });
      assistantReply =
        completion.choices[0]?.message?.content ||
        "I'm sorry, I couldn't generate a response. Please try again.";
    } catch (e) {
      console.error("[chat] ZAI SDK error:", e);
      // Fallback — provide canned guidance based on keywords
      assistantReply = generateFallbackReply(userMsg);
    }

    // Persist chat to history (if user is logged in)
    if (user) {
      await db.chatMessage.create({
        data: {
          userId: user.id,
          role: "user",
          content: userMsg,
        },
      });
      await db.chatMessage.create({
        data: {
          userId: user.id,
          role: "assistant",
          content: assistantReply,
        },
      });
    }

    return NextResponse.json({ reply: assistantReply });
  } catch (e) {
    console.error("[chat]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

function generateFallbackReply(question: string): string {
  const q = question.toLowerCase();
  if (q.includes("resume")) {
    return "For a strong resume: (1) Keep it to one page, (2) Use action verbs like 'Built', 'Developed', 'Optimized', (3) Quantify achievements (e.g., 'Improved performance by 30%'), (4) Tailor it to each role, (5) Proofread for typos. Want me to suggest a template?";
  }
  if (q.includes("interview")) {
    return "Interview tips: (1) Research the company and role, (2) Practice common questions on Pramp/Pramp.com, (3) Prepare 2-3 questions to ask the interviewer, (4) Use STAR method for behavioral questions, (5) Stay calm — it's okay to think aloud. Need practice questions for a specific role?";
  }
  if (q.includes("data science") || q.includes("data analyst")) {
    return "For Data Science: Master Python, SQL, statistics, and Pandas. Build projects on Kaggle. Target internships at Flipkart, Swiggy, Paytm. Start with the 'Data Science Intern' or 'Data Analyst Intern' listings on our platform — your skills will match well!";
  }
  if (q.includes("web") || q.includes("developer") || q.includes("full stack")) {
    return "For Full Stack: Master JavaScript, React, Node.js, and a database (MongoDB/PostgreSQL). Build 3-4 projects on GitHub. Look at Razorpay, Zoho, and Swiggy internships. Focus on writing clean, tested code!";
  }
  if (q.includes("apply") || q.includes("how")) {
    return "To apply: (1) Complete your profile 100%, (2) Upload your resume so AI can extract skills, (3) Browse internships on the Search page, (4) Check the match percentage — apply to 80%+ matches first, (5) Use One-Click Apply with your auto-filled resume. Good luck!";
  }
  return "I'm here to help with internships, careers, resumes, and interviews! Could you tell me more about your background — your skills, interests, or the role you're targeting? I can suggest internships, prep tips, and learning paths.";
}
