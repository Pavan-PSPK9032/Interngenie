require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { COMPANIES, INTERNSHIPS, NOTIFICATIONS, DEMO_USERS } = require("./data/seedData");

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("MONGODB_URI is required. Add it to server/.env");
  process.exit(1);
}

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  role: { type: String, enum: ["STUDENT", "COMPANY", "ADMIN"], default: "STUDENT" },
  phone: String, college: String, degree: String, branch: String,
  cgpa: Number, graduationYear: Number,
  skills: { type: [String], default: [] },
  interests: { type: [String], default: [] },
  preferredLocations: { type: [String], default: [] },
  languages: { type: [String], default: [] },
  linkedin: String, github: String, portfolio: String,
  extractedSkills: { type: [String], default: [] },
  profileCompleted: { type: Number, default: 0 },
  companyId: String,
  isVerified: { type: Boolean, default: false },
  isApproved: { type: Boolean, default: true },
  emailVerified: { type: Boolean, default: true },
}, { timestamps: true });

const companySchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  industry: String, description: String, website: String, location: String, size: String,
  verified: { type: Boolean, default: false },
  approved: { type: Boolean, default: true },
  rating: { type: Number, default: 4.0 },
}, { timestamps: true });

const internshipSchema = new mongoose.Schema({
  title: { type: String, required: true },
  companyId: { type: String, required: true },
  description: { type: String, required: true },
  responsibilities: { type: [String], default: [] },
  requirements: { type: [String], default: [] },
  benefits: { type: [String], default: [] },
  skills: { type: [String], default: [] },
  domain: { type: String, required: true },
  location: { type: String, required: true },
  workMode: { type: String, enum: ["remote", "hybrid", "onsite"], default: "onsite" },
  duration: { type: Number, required: true },
  stipend: { type: Number, default: 0 },
  openings: { type: Number, default: 1 },
  deadline: Date,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const notificationSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, default: "INFO" },
  read: { type: Boolean, default: false },
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
const Company = mongoose.model("Company", companySchema);
const Internship = mongoose.model("Internship", internshipSchema);
const Notification = mongoose.model("Notification", notificationSchema);

async function runSeeder() {
  await User.deleteMany({});
  await Company.deleteMany({});
  await Internship.deleteMany({});
  await Notification.deleteMany({});

  await Company.insertMany(COMPANIES);
  console.log(`Seeded ${COMPANIES.length} companies`);

  await Internship.insertMany(INTERNSHIPS);
  console.log(`Seeded ${INTERNSHIPS.length} internships`);

  let studentId = null;
  for (const demo of DEMO_USERS) {
    const u = await User.create({
      ...demo,
      passwordHash: bcrypt.hashSync(demo.password, 10),
    });
    if (demo.role === "STUDENT") studentId = u._id.toString();
    delete u.passwordHash;
  }
  console.log(`Seeded ${DEMO_USERS.length} demo users`);

  await Notification.insertMany(
    NOTIFICATIONS.map((n) => ({ ...n, userId: studentId }))
  );
  console.log(`Seeded ${NOTIFICATIONS.length} notifications`);

  console.log("Seeding complete!");
}

async function seed() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected. Seeding...");
  await runSeeder();
  await mongoose.disconnect();
}

seed().catch((e) => { console.error("Seed failed:", e); process.exit(1); });