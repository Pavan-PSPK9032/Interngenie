// GET /api/notifications — list notifications for user
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const notifications = await db.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    return NextResponse.json({
      notifications: notifications.map((n) => ({
        id: n.id,
        userId: n.userId,
        title: n.title,
        message: n.message,
        type: n.type,
        read: n.read,
        createdAt: new Date(n.createdAt).toISOString(),
      })),
    });
  } catch (e) {
    console.error("[notifications]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PATCH /api/notifications — mark as read
export async function PATCH(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await req.json();
    const updated = await db.notification.update({
      where: { id },
      data: { read: true },
    });
    return NextResponse.json({ notification: updated });
  } catch (e) {
    console.error("[notifications PATCH]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
