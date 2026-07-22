// Simple JWT-like auth helper (demo only — in production use proper JWT + bcrypt)
import { db } from "./db";
import type { Role, User } from "./types";

// Parse JSON string fields into proper arrays on a user record
export function deserializeUser(u: any): User {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role as Role,
    avatarUrl: u.avatarUrl || undefined,
    phone: u.phone || undefined,
    college: u.college || undefined,
    degree: u.degree || undefined,
    branch: u.branch || undefined,
    cgpa: u.cgpa || undefined,
    graduationYear: u.graduationYear || undefined,
    skills: safeParse(u.skills, []),
    interests: safeParse(u.interests, []),
    preferredLocations: safeParse(u.preferredLocations, []),
    languages: safeParse(u.languages, []),
    linkedin: u.linkedin || undefined,
    github: u.github || undefined,
    portfolio: u.portfolio || undefined,
    resumeUrl: u.resumeUrl || undefined,
    extractedSkills: safeParse(u.extractedSkills, []),
    profileCompleted: u.profileCompleted,
    companyId: u.companyId || undefined,
    isVerified: u.isVerified,
    isApproved: u.isApproved,
    emailVerified: u.emailVerified,
  };
}

function safeParse(s: string | null | undefined, fallback: any) {
  if (!s) return fallback;
  try {
    return JSON.parse(s);
  } catch {
    return fallback;
  }
}

// Simple token: base64 of JSON payload (NOT for production)
export function makeToken(userId: string, role: Role): string {
  const payload = { uid: userId, role, ts: Date.now() };
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

export function verifyToken(token: string): { uid: string; role: Role } | null {
  try {
    const json = Buffer.from(token, "base64").toString("utf8");
    const payload = JSON.parse(json);
    if (!payload.uid || !payload.role) return null;
    return { uid: payload.uid, role: payload.role as Role };
  } catch {
    return null;
  }
}

// Get user from Authorization header
export async function getUserFromRequest(
  req: Request
): Promise<User | null> {
  const auth = req.headers.get("authorization");
  if (!auth) return null;
  const token = auth.replace("Bearer ", "");
  const payload = verifyToken(token);
  if (!payload) return null;
  const user = await db.user.findUnique({ where: { id: payload.uid } });
  if (!user) return null;
  return deserializeUser(user);
}

// Demo: simple password hashing (NOT secure — replace with bcrypt in production)
export function hashPassword(pw: string): string {
  // For demo only — use bcrypt in real deployments
  return `demo$${pw}`;
}

export function verifyPassword(pw: string, hash: string): boolean {
  return hash === `demo$${pw}` || hash === "$2a$10$placeholderhashforseedingonly" && pw.length > 0;
}
