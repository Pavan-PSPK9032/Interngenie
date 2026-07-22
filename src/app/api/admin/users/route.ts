// GET /api/admin/users — list all users (admin only)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const users = await db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json({
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        college: u.college || undefined,
        companyId: u.companyId || undefined,
        isApproved: u.isApproved,
        isVerified: u.isVerified,
        profileCompleted: u.profileCompleted,
        createdAt: new Date(u.createdAt).toISOString(),
      })),
    });
  } catch (e) {
    console.error("[admin/users]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE /api/admin/users — delete a user (admin only)
export async function DELETE(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const { id } = await req.json();
    await db.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[admin/users DELETE]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
