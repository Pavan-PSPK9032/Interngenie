// /api/applications — GET (list for student or company) + POST (apply)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { computeMatch } from "@/lib/ai-engine";
import type { Internship, StudentProfile } from "@/lib/types";

function safeParseArr(s: string | null, fallback: any[] = []): any[] {
  if (!s) return fallback;
  try { return JSON.parse(s); } catch { return fallback; }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let apps;
    if (user.role === "STUDENT") {
      apps = await db.application.findMany({
        where: { studentId: user.id },
        include: { internship: { include: { company: true } } },
        orderBy: { createdAt: "desc" },
      });
    } else if (user.role === "COMPANY") {
      const internships = await db.internship.findMany({
        where: { companyId: user.companyId || "" },
        select: { id: true },
      });
      const ids = internships.map((i) => i.id);
      apps = await db.application.findMany({
        where: { internshipId: { in: ids } },
        include: {
          internship: { include: { company: true } },
          student: true,
        },
        orderBy: { matchScore: "desc" },
      });
    } else {
      apps = await db.application.findMany({
        include: { internship: { include: { company: true } }, student: true },
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json({
      applications: apps.map((a) => ({
        id: a.id,
        internshipId: a.internshipId,
        studentId: a.studentId,
        status: a.status,
        matchScore: a.matchScore,
        matchingSkills: safeParseArr(a.matchingSkills),
        missingSkills: safeParseArr(a.missingSkills),
        coverLetter: a.coverLetter || undefined,
        interviewScheduledAt: a.interviewScheduledAt
          ? new Date(a.interviewScheduledAt).toISOString()
          : undefined,
        feedback: a.feedback || undefined,
        createdAt: new Date(a.createdAt).toISOString(),
        internship: a.internship
          ? {
              id: a.internship.id,
              title: a.internship.title,
              companyId: a.internship.companyId,
              company: a.internship.company
                ? {
                    id: a.internship.company.id,
                    name: a.internship.company.name,
                    industry: a.internship.company.industry || undefined,
                    location: a.internship.company.location || undefined,
                    rating: a.internship.company.rating,
                    verified: a.internship.company.verified,
                    approved: a.internship.company.approved,
                    email: a.internship.company.email,
                  }
                : undefined,
              domain: a.internship.domain,
              location: a.internship.location,
              workMode: a.internship.workMode,
              duration: a.internship.duration,
              stipend: a.internship.stipend,
              skills: safeParseArr(a.internship.skills),
            }
          : undefined,
        student: a.student
          ? {
              id: a.student.id,
              name: a.student.name,
              email: a.student.email,
              college: a.student.college || undefined,
              degree: a.student.degree || undefined,
              branch: a.student.branch || undefined,
              cgpa: a.student.cgpa || undefined,
              graduationYear: a.student.graduationYear || undefined,
              skills: safeParseArr(a.student.skills),
              phone: a.student.phone || undefined,
              linkedin: a.student.linkedin || undefined,
              github: a.student.github || undefined,
            }
          : undefined,
      })),
    });
  } catch (e) {
    console.error("[applications GET]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { internshipId, coverLetter } = await req.json();
    if (!internshipId) {
      return NextResponse.json({ error: "Missing internshipId" }, { status: 400 });
    }

    // Check existing
    const existing = await db.application.findUnique({
      where: { internshipId_studentId: { internshipId, studentId: user.id } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Already applied" },
        { status: 409 }
      );
    }

    const internship = await db.internship.findUnique({ where: { id: internshipId } });
    if (!internship) {
      return NextResponse.json({ error: "Internship not found" }, { status: 404 });
    }

    // Compute match score
    const studentProfile: StudentProfile = {
      skills: user.skills,
      interests: user.interests,
      preferredLocations: user.preferredLocations,
      cgpa: user.cgpa,
    };
    const internshipTyped: Internship = {
      id: internship.id,
      title: internship.title,
      companyId: internship.companyId,
      description: internship.description,
      responsibilities: safeParseArr(internship.responsibilities),
      requirements: safeParseArr(internship.requirements),
      benefits: safeParseArr(internship.benefits),
      skills: safeParseArr(internship.skills),
      domain: internship.domain,
      location: internship.location,
      workMode: internship.workMode as any,
      duration: internship.duration,
      stipend: internship.stipend,
      openings: internship.openings,
      deadline: internship.deadline ? new Date(internship.deadline).toISOString() : undefined,
      isActive: internship.isActive,
      createdAt: new Date(internship.createdAt).toISOString(),
    };
    const match = computeMatch(studentProfile, internshipTyped);

    const app = await db.application.create({
      data: {
        internshipId,
        studentId: user.id,
        status: "APPLIED",
        matchScore: match.score,
        matchingSkills: JSON.stringify(match.matchingSkills),
        missingSkills: JSON.stringify(match.missingSkills),
        coverLetter: coverLetter || null,
      },
    });

    // Create notification
    await db.notification.create({
      data: {
        userId: user.id,
        title: "Application submitted",
        message: `You applied for ${internship.title}. Match score: ${match.score}%`,
        type: "APPLICATION",
      },
    });

    return NextResponse.json({ application: app, match });
  } catch (e) {
    console.error("[applications POST]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
