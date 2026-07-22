// GET /api/internships — list with optional filters
// POST /api/internships — create (company only)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest, deserializeUser } from "@/lib/auth";
import type { Internship } from "@/lib/types";

function safeParseArr(s: string | null, fallback: any[] = []): any[] {
  if (!s) return fallback;
  try { return JSON.parse(s); } catch { return fallback; }
}

function toInternship(i: any, company?: any): Internship {
  return {
    id: i.id,
    title: i.title,
    companyId: i.companyId,
    company: company ? {
      id: company.id,
      name: company.name,
      email: company.email,
      logoUrl: company.logoUrl || undefined,
      industry: company.industry || undefined,
      description: company.description || undefined,
      website: company.website || undefined,
      location: company.location || undefined,
      size: company.size || undefined,
      verified: company.verified,
      approved: company.approved,
      rating: company.rating,
    } : undefined,
    description: i.description,
    responsibilities: safeParseArr(i.responsibilities),
    requirements: safeParseArr(i.requirements),
    benefits: safeParseArr(i.benefits),
    skills: safeParseArr(i.skills),
    domain: i.domain,
    location: i.location,
    workMode: i.workMode,
    duration: i.duration,
    stipend: i.stipend,
    openings: i.openings,
    deadline: i.deadline ? new Date(i.deadline).toISOString() : undefined,
    isActive: i.isActive,
    createdAt: new Date(i.createdAt).toISOString(),
  };
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const domain = url.searchParams.get("domain") || "";
    const workMode = url.searchParams.get("workMode") || "";
    const location = url.searchParams.get("location") || "";
    const minStipend = Number(url.searchParams.get("minStipend") || 0);
    const maxDuration = Number(url.searchParams.get("maxDuration") || 0);
    const q = (url.searchParams.get("q") || "").toLowerCase();
    const skill = url.searchParams.get("skill") || "";
    const sort = url.searchParams.get("sort") || "newest";

    let internships = await db.internship.findMany({
      where: { isActive: true },
      include: { company: true },
    });

    let list = internships.map((i) => toInternship(i, i.company));

    if (domain) list = list.filter((i) => i.domain === domain);
    if (workMode) list = list.filter((i) => i.workMode === workMode);
    if (location) list = list.filter((i) => i.location.toLowerCase().includes(location.toLowerCase()));
    if (minStipend > 0) list = list.filter((i) => i.stipend >= minStipend);
    if (maxDuration > 0) list = list.filter((i) => i.duration <= maxDuration);
    if (skill) {
      const sl = skill.toLowerCase();
      list = list.filter((i) => i.skills.some((s) => s.toLowerCase().includes(sl)));
    }
    if (q) {
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.domain.toLowerCase().includes(q) ||
          (i.company?.name.toLowerCase().includes(q) ?? false)
      );
    }

    switch (sort) {
      case "stipend":
        list.sort((a, b) => b.stipend - a.stipend);
        break;
      case "duration":
        list.sort((a, b) => a.duration - b.duration);
        break;
      default:
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return NextResponse.json({ internships: list });
  } catch (e) {
    console.error("[internships GET]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== "COMPANY") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const body = await req.json();
    const { title, description, responsibilities, requirements, benefits, skills,
      domain, location, workMode, duration, stipend, openings, deadline } = body;

    if (!title || !description || !domain || !location || !workMode) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const created = await db.internship.create({
      data: {
        title,
        companyId: user.companyId || "co_flipkart",
        description,
        responsibilities: JSON.stringify(responsibilities || []),
        requirements: JSON.stringify(requirements || []),
        benefits: JSON.stringify(benefits || []),
        skills: JSON.stringify(skills || []),
        domain,
        location,
        workMode,
        duration: Number(duration) || 12,
        stipend: Number(stipend) || 0,
        openings: Number(openings) || 1,
        deadline: deadline ? new Date(deadline) : null,
      },
    });
    return NextResponse.json({ internship: toInternship(created) });
  } catch (e) {
    console.error("[internships POST]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
