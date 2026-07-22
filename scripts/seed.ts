// Database seed script — run with: bun run scripts/seed.ts
import { db } from "../src/lib/db";
import {
  SEED_COMPANIES,
  SEED_INTERNSHIPS,
  SEED_STUDENT,
  SEED_COMPANY_USER,
  SEED_ADMIN_USER,
  SEED_NOTIFICATIONS,
} from "../src/lib/seed-data";

async function main() {
  console.log("Seeding database...");

  // Clean
  await db.notification.deleteMany();
  await db.application.deleteMany();
  await db.internship.deleteMany();
  await db.company.deleteMany();
  await db.user.deleteMany();

  // Companies
  for (const c of SEED_COMPANIES) {
    await db.company.create({
      data: {
        id: c.id,
        name: c.name,
        email: c.email,
        logoUrl: c.logoUrl || null,
        industry: c.industry || null,
        description: c.description || null,
        website: c.website || null,
        location: c.location || null,
        size: c.size || null,
        verified: c.verified,
        approved: c.approved,
        rating: c.rating,
      },
    });
  }
  console.log(`✓ Inserted ${SEED_COMPANIES.length} companies`);

  // Internships
  for (const i of SEED_INTERNSHIPS) {
    await db.internship.create({
      data: {
        id: i.id,
        title: i.title,
        companyId: i.companyId,
        description: i.description,
        responsibilities: JSON.stringify(i.responsibilities),
        requirements: JSON.stringify(i.requirements),
        benefits: JSON.stringify(i.benefits),
        skills: JSON.stringify(i.skills),
        domain: i.domain,
        location: i.location,
        workMode: i.workMode,
        duration: i.duration,
        stipend: i.stipend,
        openings: i.openings,
        deadline: i.deadline ? new Date(i.deadline) : null,
        isActive: i.isActive,
      },
    });
  }
  console.log(`✓ Inserted ${SEED_INTERNSHIPS.length} internships`);

  // Demo users
  const hash = "$2a$10$placeholderhashforseedingonly"; // Demo only
  const users = [SEED_STUDENT, SEED_COMPANY_USER, SEED_ADMIN_USER];
  for (const u of users) {
    await db.user.create({
      data: {
        id: u.id,
        email: u.email,
        passwordHash: hash,
        name: u.name,
        role: u.role,
        phone: u.phone || null,
        college: u.college || null,
        degree: u.degree || null,
        branch: u.branch || null,
        cgpa: u.cgpa || null,
        graduationYear: u.graduationYear || null,
        skills: JSON.stringify(u.skills),
        interests: JSON.stringify(u.interests),
        preferredLocations: JSON.stringify(u.preferredLocations),
        languages: JSON.stringify(u.languages),
        linkedin: u.linkedin || null,
        github: u.github || null,
        portfolio: u.portfolio || null,
        extractedSkills: JSON.stringify(u.extractedSkills),
        profileCompleted: u.profileCompleted,
        companyId: u.companyId || null,
        isVerified: u.isVerified,
        isApproved: u.isApproved,
        emailVerified: u.emailVerified,
      },
    });
  }
  console.log(`✓ Inserted ${users.length} demo users`);

  // Notifications
  for (const n of SEED_NOTIFICATIONS) {
    await db.notification.create({
      data: {
        id: n.id,
        userId: n.userId,
        title: n.title,
        message: n.message,
        type: n.type,
        read: n.read,
      },
    });
  }
  console.log(`✓ Inserted ${SEED_NOTIFICATIONS.length} notifications`);

  console.log("✅ Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
