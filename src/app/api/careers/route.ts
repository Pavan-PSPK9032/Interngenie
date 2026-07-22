// GET /api/careers — career suggestions for student
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { suggestCareers } from "@/lib/ai-engine";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const suggestions = suggestCareers({
      skills: user.skills,
      interests: user.interests,
      preferredLocations: user.preferredLocations,
      cgpa: user.cgpa,
    });
    return NextResponse.json({ careers: suggestions });
  } catch (e) {
    console.error("[careers]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
