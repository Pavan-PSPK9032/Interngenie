const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Company = require("./models/Company");
const Internship = require("./models/Internship");
const Notification = require("./models/Notification");
const { COMPANIES, INTERNSHIPS, NOTIFICATIONS, DEMO_USERS } = require("./data/seedData");

async function seedDemoIfEmpty() {
  const seeded = [];

  const companyCount = await Company.countDocuments();
  if (companyCount === 0) {
    await Company.insertMany(COMPANIES);
    seeded.push(`companies (${COMPANIES.length})`);
  }

  const internshipCount = await Internship.countDocuments();
  if (internshipCount === 0) {
    await Internship.insertMany(INTERNSHIPS);
    seeded.push(`internships (${INTERNSHIPS.length})`);
  }

  const demoIds = {};
  let createdDemos = 0;
  for (const demo of DEMO_USERS) {
    const existing = await User.findOne({ email: demo.email });
    if (!existing) {
      const u = await User.create({
        ...demo,
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

  if (seeded.length) {
    console.log(`[seedIfEmpty] seeded: ${seeded.join(", ")}`);
  } else {
    console.log("[seedIfEmpty] database already populated, nothing to seed");
  }
  return seeded;
}

module.exports = { seedDemoIfEmpty };