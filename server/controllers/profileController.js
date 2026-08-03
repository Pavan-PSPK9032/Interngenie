const User = require("../models/User");
const Certificate = require("../models/Certificate");
const ATSReport = require("../models/ATSReport");
const Application = require("../models/Application");
const Internship = require("../models/Internship");

exports.getPublicProfile = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.role !== "STUDENT" || !user.privacySettings?.profilePublic) {
      return res.status(404).json({ error: "Profile not available" });
    }

    const p = user.privacySettings || {};
    const profile = {
      id: user._id.toString(),
      name: user.name,
      avatarUrl: user.avatarUrl || "",
      college: user.college || "",
      branch: user.branch || "",
      degree: user.degree || "",
      graduationYear: user.graduationYear || 0,
      cgpa: user.cgpa || 0,
      skills: user.skills || [],
      summary: user.careerObjective || "",
      interests: user.interests || [],
      achievements: user.achievements || [],
      languages: user.languages || [],
      profileCompleted: user.profileCompleted || 0,
    };

    if (p.showEmail) profile.email = user.email;
    if (p.showPhone) profile.phone = user.phone || "";
    if (p.showLinkedIn) profile.linkedin = user.linkedin || "";
    if (p.showGitHub) profile.github = user.github || "";
    if (p.showPortfolio) profile.portfolio = user.portfolio || "";
    if (p.showProjects) profile.projects = user.projects || [];
    if (p.showExperience) profile.experience = user.experience || [];

    const certs = await Certificate.find({ userId, isPublic: true }).sort({ issueDate: -1 }).lean();
    profile.certificates = certs.map((c) => ({
      id: c._id.toString(),
      name: c.name,
      organization: c.organization,
      category: c.category,
      issueDate: c.issueDate,
      credentialId: c.credentialId,
      verificationLink: c.verificationLink,
      fileUrl: c.fileUrl,
      fileType: c.fileType,
      description: c.description,
    }));

    const reports = await ATSReport.find({ userId }).sort({ createdAt: -1 }).limit(1).lean();
    profile.atsScore = reports[0] ? reports[0].score : null;
    profile.atsGrade = reports[0] ? reports[0].grade : null;

    const applications = await Application.find({ studentId: userId, status: { $in: ["SELECTED", "COMPLETED"] } })
      .select("internshipId status")
      .lean();
    profile.completedInternships = applications.length;

    const internshipIds = applications.map((a) => a.internshipId);
    const internships = await Internship.find({ _id: { $in: internshipIds } }).select("title companyId").lean();
    profile.completedInternshipDetails = internships.map((i) => ({
      title: i.title,
      companyId: i.companyId,
    }));

    return res.json({ profile });
  } catch (err) { next(err); }
};

exports.updatePrivacySettings = async (req, res, next) => {
  try {
    const allowed = [
      "profilePublic", "showEmail", "showPhone", "showLinkedIn", "showGitHub",
      "showPortfolio", "showCertificates", "showProjects", "showExperience",
    ];
    const update = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) update[`privacySettings.${k}`] = !!req.body[k];
    }

    const updated = await User.findByIdAndUpdate(req.user.id, { $set: update }, { new: true })
      .select("-passwordHash")
      .lean();

    return res.json({ user: updated });
  } catch (err) { next(err); }
};

exports.getProfileCompleteness = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ error: "User not found" });

    const checks = [];
    let score = 0;

    const add = (condition, label, weight) => {
      if (condition) {
        score += weight;
      } else {
        checks.push({ label, missing: true });
      }
    };

    add(!!user.name, "Add your name", 5);
    add(!!user.avatarUrl, "Upload a profile picture", 15);
    add(!!user.phone, "Add phone number", 5);
    add(!!user.college, "Add your college", 10);
    add(!!user.degree, "Add your degree", 5);
    add((user.skills || []).length >= 3, "Add at least 3 skills", 15);
    add(!!user.linkedin, "Add LinkedIn profile", 10);
    add(!!user.portfolio, "Add portfolio link", 5);
    add(!!user.github, "Add GitHub profile", 5);
    add((user.projects || []).length > 0, "Add projects", 10);
    add((user.experience || []).length > 0, "Add work experience", 10);
    add((user.certifications || []).length > 0 || (user.courses || []).length > 0, "Add certifications", 5);
    add(!!user.resumeText || !!user.resumeData, "Upload or build a resume", 10);
    add(!!user.careerObjective, "Add a career objective", 5);
    add((user.interests || []).length > 0, "Add interests", 5);

    score = Math.min(100, score);
    const certCount = await Certificate.countDocuments({ userId: req.user.id });

    if (certCount > 0 && !checks.some((c) => c.label === "Add certifications")) {
      checks.push({ label: "Certificates uploaded", done: true });
    }

    return res.json({
      score,
      suggestions: checks,
      stats: {
        skills: (user.skills || []).length,
        projects: (user.projects || []).length,
        experience: (user.experience || []).length,
        certificates: certCount,
        certifications: (user.certifications || []).length,
      },
    });
  } catch (err) { next(err); }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const allowed = [
      "name", "avatarUrl", "phone", "address", "college", "degree", "branch",
      "cgpa", "graduationYear", "skills", "interests", "preferredLocations",
      "languages", "linkedin", "github", "portfolio", "careerObjective",
      "projects", "experience", "certifications", "courses", "achievements",
      "dob", "gender",
    ];
    const update = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) update[k] = req.body[k];
    }
    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const updated = await User.findByIdAndUpdate(req.user.id, { $set: update }, { new: true })
      .select("-passwordHash")
      .lean();

    return res.json({ user: updated });
  } catch (err) { next(err); }
};
