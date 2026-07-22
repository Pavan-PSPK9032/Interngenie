// PATCH /api/applications/[id] — update status (company/admin)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import type { ApplicationStatus } from "@/lib/types";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || (user.role !== "COMPANY" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const { id } = await params;
    const body = await req.json();
    const { status, interviewScheduledAt, feedback } = body as {
      status?: ApplicationStatus;
      interviewScheduledAt?: string;
      feedback?: string;
    };

    const app = await db.application.findUnique({
      where: { id },
      include: { internship: true, student: true },
    });
    if (!app) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await db.application.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(interviewScheduledAt ? { interviewScheduledAt: new Date(interviewScheduledAt) } : {}),
        ...(feedback !== undefined ? { feedback } : {}),
      },
    });

    // Create notification for student
    if (status && app.student) {
      const notifType =
        status === "INTERVIEW" ? "INTERVIEW" :
        status === "SELECTED" ? "SUCCESS" :
        status === "REJECTED" ? "WARNING" : "APPLICATION";
      const title =
        status === "INTERVIEW" ? "Interview scheduled" :
        status === "SELECTED" ? "You're selected!" :
        status === "REJECTED" ? "Application update" :
        "Application status updated";
      const msg =
        status === "INTERVIEW" ? `Your interview for ${app.internship.title} has been scheduled.` :
        status === "SELECTED" ? `Congratulations! You've been selected for ${app.internship.title}.` :
        status === "REJECTED" ? `Your application for ${app.internship.title} was not moved forward. Keep applying!` :
        `Your application for ${app.internship.title} is now ${status}.`;

      await db.notification.create({
        data: {
          userId: app.student.id,
          title,
          message: msg,
          type: notifType,
        },
      });

      // If selected, generate a certificate
      if (status === "SELECTED") {
        const certId = "CERT-" + Math.random().toString(36).slice(2, 10).toUpperCase();
        const company = await db.company.findUnique({ where: { id: app.internship.companyId } });
        await db.certificate.create({
          data: {
            userId: app.student.id,
            internshipId: app.internshipId,
            internshipTitle: app.internship.title,
            companyName: company?.name || "",
            studentName: app.student.name,
            certificateId: certId,
            skills: app.internship.skills,
          },
        });
      }
    }

    return NextResponse.json({ application: updated });
  } catch (e) {
    console.error("[applications PATCH]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
