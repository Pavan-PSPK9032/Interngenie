// PATCH /api/profile — update user profile
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest, deserializeUser } from "@/lib/auth";

export async function PATCH(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
      name, phone, college, degree, branch, cgpa, graduationYear,
      skills, interests, preferredLocations, languages,
      linkedin, github, portfolio,
    } = body;

    // Compute profile completion
    let completion = 20;
    if (phone) completion += 5;
    if (college && degree) completion += 15;
    if (cgpa) completion += 10;
    if (graduationYear) completion += 5;
    if (skills && skills.length > 0) completion += 15;
    if (interests && interests.length > 0) completion += 10;
    if (preferredLocations && preferredLocations.length > 0) completion += 5;
    if (languages && languages.length > 0) completion += 5;
    if (linkedin || github || portfolio) completion += 10;
    completion = Math.min(100, completion);

    const updated = await db.user.update({
      where: { id: user.id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(college !== undefined ? { college } : {}),
        ...(degree !== undefined ? { degree } : {}),
        ...(branch !== undefined ? { branch } : {}),
        ...(cgpa !== undefined ? { cgpa: Number(cgpa) } : {}),
        ...(graduationYear !== undefined ? { graduationYear: Number(graduationYear) } : {}),
        ...(skills !== undefined ? { skills: JSON.stringify(skills) } : {}),
        ...(interests !== undefined ? { interests: JSON.stringify(interests) } : {}),
        ...(preferredLocations !== undefined ? { preferredLocations: JSON.stringify(preferredLocations) } : {}),
        ...(languages !== undefined ? { languages: JSON.stringify(languages) } : {}),
        ...(linkedin !== undefined ? { linkedin } : {}),
        ...(github !== undefined ? { github } : {}),
        ...(portfolio !== undefined ? { portfolio } : {}),
        profileCompleted: completion,
      },
    });

    return NextResponse.json({ user: deserializeUser(updated) });
  } catch (e) {
    console.error("[profile PATCH]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
