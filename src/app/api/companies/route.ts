// GET /api/companies — list all companies
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest) {
  try {
    const companies = await db.company.findMany({
      include: { internships: { select: { id: true } } },
      orderBy: { rating: "desc" },
    });
    return NextResponse.json({
      companies: companies.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        logoUrl: c.logoUrl || undefined,
        industry: c.industry || undefined,
        description: c.description || undefined,
        website: c.website || undefined,
        location: c.location || undefined,
        size: c.size || undefined,
        verified: c.verified,
        approved: c.approved,
        rating: c.rating,
        internshipCount: c.internships.length,
      })),
    });
  } catch (e) {
    console.error("[companies GET]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PATCH /api/companies — approve / reject company (admin)
export async function PATCH(req: NextRequest) {
  try {
    const user = await getUserFromRequestLazy(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const { id, approved, verified } = await req.json();
    const updated = await db.company.update({
      where: { id },
      data: {
        ...(approved !== undefined ? { approved } : {}),
        ...(verified !== undefined ? { verified } : {}),
      },
    });
    return NextResponse.json({ company: updated });
  } catch (e) {
    console.error("[companies PATCH]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Avoid circular import — inline
async function getUserFromRequestLazy(req: Request) {
  const auth = req.headers.get("authorization");
  if (!auth) return null;
  const token = auth.replace("Bearer ", "");
  try {
    const json = Buffer.from(token, "base64").toString("utf8");
    const payload = JSON.parse(json);
    if (!payload.uid) return null;
    const u = await db.user.findUnique({ where: { id: payload.uid } });
    if (!u) return null;
    return {
      id: u.id, email: u.email, name: u.name, role: u.role,
      skills: [], interests: [], preferredLocations: [], languages: [],
      extractedSkills: [], profileCompleted: u.profileCompleted,
      isVerified: u.isVerified, isApproved: u.isApproved, emailVerified: u.emailVerified,
    } as any;
  } catch { return null; }
}
