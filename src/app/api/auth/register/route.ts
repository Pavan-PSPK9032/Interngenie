// POST /api/auth/register
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, makeToken, deserializeUser } from "@/lib/auth";
import type { Role } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name, role, companyId } = body as {
      email: string;
      password: string;
      name: string;
      role: Role;
      companyId?: string;
    };

    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const user = await db.user.create({
      data: {
        email,
        passwordHash: hashPassword(password),
        name,
        role,
        companyId: role === "COMPANY" ? companyId : null,
        isVerified: role === "STUDENT",
        isApproved: true,
        emailVerified: true,
        profileCompleted: role === "STUDENT" ? 20 : role === "COMPANY" ? 30 : 100,
      },
    });

    const token = makeToken(user.id, user.role as Role);
    return NextResponse.json({
      user: deserializeUser(user),
      token,
    });
  } catch (e) {
    console.error("[auth/register] error", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
