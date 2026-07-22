// GET /api/skill-gap — skill gap analysis for student
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { analyzeSkillGap } from "@/lib/ai-engine";
import type { Internship } from "@/lib/types";

function safeParseArr(s: string | null, fallback: any[] = []): any[] {
  if (!s) return fallback;
  try { return JSON.parse(s); } catch { return fallback; }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const all = await db.internship.findMany({ where: { isActive: true } });
    const internships: Internship[] = all.map((i) => ({
      id: i.id, title: i.title, companyId: i.companyId, description: i.description,
      responsibilities: safeParseArr(i.responsibilities),
      requirements: safeParseArr(i.requirements),
      benefits: safeParseArr(i.benefits),
      skills: safeParseArr(i.skills),
      domain: i.domain, location: i.location, workMode: i.workMode as any,
      duration: i.duration, stipend: i.stipend, openings: i.openings,
      isActive: i.isActive, createdAt: new Date(i.createdAt).toISOString(),
    }));

    const gaps = analyzeSkillGap({
      skills: user.skills,
      interests: user.interests,
      preferredLocations: user.preferredLocations,
    }, internships);

    return NextResponse.json({ gaps });
  } catch (e) {
    console.error("[skill-gap]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
