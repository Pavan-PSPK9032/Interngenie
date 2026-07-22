// POST /api/resume/parse — accepts resume text, returns parsed skills/education/projects
import { NextRequest, NextResponse } from "next/server";
import { parseResume } from "@/lib/ai-engine";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const { text } = body as { text?: string };
    if (!text || text.length < 20) {
      return NextResponse.json(
        { error: "Resume text too short" },
        { status: 400 }
      );
    }

    const parsed = parseResume(text);

    // Persist extracted skills to the user's profile
    const existingSkills = new Set(user.skills.map((s) => s.toLowerCase()));
    const newSkills = parsed.skills.filter(
      (s) => !existingSkills.has(s.toLowerCase())
    );
    const merged = Array.from(new Set([...user.skills, ...newSkills]));

    await db.user.update({
      where: { id: user.id },
      data: {
        resumeText: text,
        extractedSkills: JSON.stringify(parsed.skills),
        skills: JSON.stringify(merged),
        profileCompleted: Math.min(100, user.profileCompleted + 15),
      },
    });

    return NextResponse.json({ parsed, mergedSkills: merged });
  } catch (e) {
    console.error("[resume/parse]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
