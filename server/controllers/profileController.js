const User = require("../models/User");
const Certificate = require("../models/Certificate");
const ATSReport = require("../models/ATSReport");
const Application = require("../models/Application");
const Internship = require("../models/Internship");
const { computeProfileCompleteness } = require("../utils/profileCompleteness");

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

    const certCount = await Certificate.countDocuments({ userId: req.user.id });

    return res.json(computeProfileCompleteness(user, certCount));
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
