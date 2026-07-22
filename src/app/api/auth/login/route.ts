// POST /api/auth/login
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, makeToken, deserializeUser } from "@/lib/auth";
import type { Role } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    const token = makeToken(user.id, user.role as Role);
    return NextResponse.json({
      user: deserializeUser(user),
      token,
    });
  } catch (e) {
    console.error("[auth/login] error", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
