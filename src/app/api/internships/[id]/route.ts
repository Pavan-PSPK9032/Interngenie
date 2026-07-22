// GET /api/internships/[id]
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { Internship } from "@/lib/types";

function safeParseArr(s: string | null, fallback: any[] = []): any[] {
  if (!s) return fallback;
  try { return JSON.parse(s); } catch { return fallback; }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const i = await db.internship.findUnique({
      where: { id },
      include: { company: true },
    });
    if (!i) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const internship: Internship = {
      id: i.id,
      title: i.title,
      companyId: i.companyId,
      company: i.company ? {
        id: i.company.id, name: i.company.name, email: i.company.email,
        logoUrl: i.company.logoUrl || undefined,
        industry: i.company.industry || undefined,
        description: i.company.description || undefined,
        website: i.company.website || undefined,
        location: i.company.location || undefined,
        size: i.company.size || undefined,
        verified: i.company.verified, approved: i.company.approved,
        rating: i.company.rating,
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
    };
    return NextResponse.json({ internship });
  } catch (e) {
    console.error("[internship/[id]]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
