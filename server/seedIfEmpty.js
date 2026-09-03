const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Company = require("./models/Company");
const Internship = require("./models/Internship");
const Notification = require("./models/Notification");
const { COMPANIES, INTERNSHIPS, NOTIFICATIONS, DEMO_USERS } = require("./data/seedData");

async function seedDemoIfEmpty() {
  const seeded = [];

  // Map seed string keys (e.g. "co_flipkart") to generated ObjectIds so the
  // matching internships/company account can reference them. MongoDB's newer
  // Mongoose rejects hand-written string document `_id`s like "co_tcs", so we
  // let MongoDB generate ObjectIds and translate the cross-references.
  const companyKeyToId = {};

  const companyCount = await Company.countDocuments();
  if (companyCount === 0) {
    const docs = [];
    for (const c of COMPANIES) {
      const key = c._id; // e.g. "co_flipkart"
      const { _id, name, ...rest } = c;
      const company = await Company.create({
        name,
        ...rest,
        status: c.status || "APPROVED",
      });
      companyKeyToId[key] = company._id.toString();
      docs.push(company);
    }
    seeded.push(`companies (${docs.length})`);
  }

  // Even if companies already exist, map their string keys to ids if the seed
  // company key references are still needed by internships/users below.
  const existingCompanies = companyCount > 0 ? await Company.find().lean() : [];
  for (const c of COMPANIES) {
    if (!companyKeyToId[c._id]) {
      const match = existingCompanies.find((ec) => String(ec._id) === c._id || ec.name === c.name);
      if (match) companyKeyToId[c._id] = String(match._id);
    }
  }

  const internshipCount = await Internship.countDocuments();
  if (internshipCount === 0) {
    const docs = [];
    for (const i of INTERNSHIPS) {
      const { _id, companyId, ...rest } = i;
      docs.push(await Internship.create({
        ...rest,
        companyId: companyKeyToId[companyId] || companyId,
        status: i.status || "APPROVED",
        isActive: i.isActive !== undefined ? i.isActive : true,
      }));
    }
    seeded.push(`internships (${docs.length})`);
  }

  const demoIds = {};
  let createdDemos = 0;
  for (const demo of DEMO_USERS) {
    const existing = await User.findOne({ email: demo.email });
    if (!existing) {
      const patch = { ...demo };
      // Point the company demo account at the seeded company's real id.
      if (demo.role === "COMPANY" && demo.companyId && companyKeyToId[demo.companyId]) {
        patch.companyId = companyKeyToId[demo.companyId];
      }
      const u = await User.create({
        ...patch,
        passwordHash: bcrypt.hashSync(demo.password, 10),
      });
      demoIds[demo.role] = u._id.toString();
      createdDemos += 1;
    } else {
      demoIds[demo.role] = existing._id.toString();
    }
  }
  if (createdDemos) {
    seeded.push(`demo users (${createdDemos})`);
  }

  const notificationCount = await Notification.countDocuments();
  if (notificationCount === 0 && demoIds.STUDENT) {
    await Notification.insertMany(
      NOTIFICATIONS.map((n) => ({ ...n, userId: demoIds.STUDENT }))
    );
    seeded.push(`notifications (${NOTIFICATIONS.length})`);
  }

  // One-time idempotent backfill: migrate pre-existing data to the new
  // approval-workflow status fields without wiping live data.
  const internshipBackfill = await Internship.updateMany(
    // active internships that still lack a status default to PENDING; approve them
    { isActive: true, status: { $exists: false } },
    { $set: { status: "APPROVED" } }
  );
  if (internshipBackfill.modifiedCount > 0) {
    seeded.push(`internships status backfilled (${internshipBackfill.modifiedCount})`);
  }
  const companyBackfill = await Company.updateMany(
    { approved: true, status: { $exists: false } },
    { $set: { status: "APPROVED" } }
  );
  if (companyBackfill.modifiedCount > 0) {
    seeded.push(`companies status backfilled (${companyBackfill.modifiedCount})`);
  }
  const companyPendingBackfill = await Company.updateMany(
    { approved: false, status: { $exists: false } },
    { $set: { status: "PENDING" } }
  );
  if (companyPendingBackfill.modifiedCount > 0) {
    seeded.push(`companies status set pending (${companyPendingBackfill.modifiedCount})`);
  }

  if (seeded.length) {
    console.log(`[seedIfEmpty] seeded: ${seeded.join(", ")}`);
  } else {
    console.log("[seedIfEmpty] database already populated, nothing to seed");
  }
  return seeded;
}

module.exports = { seedDemoIfEmpty };