// GET /api/recommendations — AI-powered recommendations for the logged-in student
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { recommendInternships } from "@/lib/ai-engine";
import type { Internship, StudentProfile } from "@/lib/types";

function safeParseArr(s: string | null, fallback: any[] = []): any[] {
  if (!s) return fallback;
  try { return JSON.parse(s); } catch { return fallback; }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allInternships = await db.internship.findMany({
      where: { isActive: true },
      include: { company: true },
    });

    const internships: Internship[] = allInternships.map((i) => ({
      id: i.id,
      title: i.title,
      companyId: i.companyId,
      company: i.company ? {
        id: i.company.id, name: i.company.name, email: i.company.email,
        industry: i.company.industry || undefined, location: i.company.location || undefined,
        verified: i.company.verified, approved: i.company.approved, rating: i.company.rating,
      } : undefined,
      description: i.description,
      responsibilities: safeParseArr(i.responsibilities),
      requirements: safeParseArr(i.requirements),
      benefits: safeParseArr(i.benefits),
      skills: safeParseArr(i.skills),
      domain: i.domain,
      location: i.location,
      workMode: i.workMode as any,
      duration: i.duration,
      stipend: i.stipend,
      openings: i.openings,
      deadline: i.deadline ? new Date(i.deadline).toISOString() : undefined,
      isActive: i.isActive,
      createdAt: new Date(i.createdAt).toISOString(),
    }));

    const student: StudentProfile = {
      skills: user.skills,
      interests: user.interests,
      preferredLocations: user.preferredLocations,
      cgpa: user.cgpa,
    };

    const results = recommendInternships(student, internships);
    return NextResponse.json({ recommendations: results });
  } catch (e) {
    console.error("[recommendations]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
