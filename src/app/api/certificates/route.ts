// GET /api/certificates — list certificates for user
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

function safeParseArr(s: string | null, fallback: any[] = []): any[] {
  if (!s) return fallback;
  try { return JSON.parse(s); } catch { return fallback; }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const certificates = await db.certificate.findMany({
      where: { userId: user.id },
      orderBy: { issueDate: "desc" },
    });

    return NextResponse.json({
      certificates: certificates.map((c) => ({
        id: c.id,
        userId: c.userId,
        internshipId: c.internshipId,
        internshipTitle: c.internshipTitle,
        companyName: c.companyName,
        studentName: c.studentName,
        issueDate: new Date(c.issueDate).toISOString(),
        certificateId: c.certificateId,
        skills: safeParseArr(c.skills),
      })),
    });
  } catch (e) {
    console.error("[certificates]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
