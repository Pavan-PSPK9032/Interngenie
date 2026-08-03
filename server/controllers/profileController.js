const User = require("../models/User");
const Certificate = require("../models/Certificate");
const ATSReport = require("../models/ATSReport");
const Application = require("../models/Application");
const Internship = require("../models/Internship");
const Follow = require("../models/Follow");
const { computeProfileCompleteness } = require("../utils/profileCompleteness");
const { isUsernameAvailable } = require("../utils/username");

function isProfileVisible(privacy, viewer) {
  const p = privacy || {};
  const vis = p.visibility || (p.profilePublic === false ? "private" : "public");
  if (vis === "public") return true;
  if (vis === "private") return viewer && viewer.isOwner;
  if (vis === "recruiters") {
    if (viewer && viewer.isOwner) return true;
    if (viewer && (viewer.role === "COMPANY" || viewer.role === "ADMIN")) return true;
    return false;
  }
  return false;
}

function computeBadges(user, atsScore, profileCompleted, certCount, completedInternships) {
  const badges = [];
  if (atsScore != null && atsScore >= 85) badges.push({ name: "Top ATS Resume", icon: "award" });
  if (profileCompleted >= 80) badges.push({ name: "Profile Star", icon: "sparkles" });
  if ((user.skills || []).length >= 10) badges.push({ name: "Skills Master", icon: "code" });
  if (certCount >= 5) badges.push({ name: "Certified Pro", icon: "badge" });
  if (completedInternships >= 1) badges.push({ name: "Internship Graduate", icon: "briefcase" });
  if (user.languages && user.languages.length >= 3) badges.push({ name: "Polyglot", icon: "languages" });
  return badges;
}

async function loadProfileStats(userId) {
  const [followersCount, followingCount, applicationsCount, completedCount, certCount] = await Promise.all([
    Follow.countDocuments({ followingId: userId }),
    Follow.countDocuments({ followerId: userId }),
    Application.countDocuments({ studentId: userId }),
    Application.countDocuments({ studentId: userId, status: { $in: ["SELECTED", "COMPLETED"] } }),
    Certificate.countDocuments({ userId }),
  ]);
  return { followersCount, followingCount, applicationsCount, completedInternships: completedCount, certificatesCount: certCount };
}

async function loadPublicProfile(userId, viewer) {
  const user = await User.findById(userId).lean();
  if (!user || user.role !== "STUDENT") return null;
  if (!isProfileVisible(user.privacySettings, viewer)) return null;

  const p = user.privacySettings || {};
  const stats = await loadProfileStats(userId);

  const reports = await ATSReport.find({ userId }).sort({ createdAt: -1 }).limit(1).lean();
  const atsScore = reports[0] ? reports[0].score : null;
  const atsGrade = reports[0] ? reports[0].grade : null;
  const showAts = p.showAtsScore !== false;

  const profile = {
    id: user._id.toString(),
    name: user.name,
    username: user.username || "",
    avatarUrl: user.avatarUrl || "",
    bannerUrl: user.bannerUrl || "",
    bannerPosition: user.bannerPosition || "50% 50%",
    headline: user.headline || "",
    college: user.college || "",
    branch: user.branch || "",
    degree: user.degree || "",
    graduationYear: user.graduationYear || 0,
    location: user.location || "",
    cgpa: user.cgpa || 0,
    skills: user.skills || [],
    summary: user.careerObjective || "",
    interests: user.interests || [],
    achievements: user.achievements || [],
    languages: user.languages || [],
    profileCompleted: user.profileCompleted || 0,
    profileViews: user.profileViews || 0,
    searchAppearances: user.searchAppearances || 0,
    followersCount: stats.followersCount,
    followingCount: stats.followingCount,
    applicationsCount: stats.applicationsCount,
    completedInternships: stats.completedInternships,
    certificatesCount: stats.certificatesCount,
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

  if (showAts) {
    profile.atsScore = atsScore;
    profile.atsGrade = atsGrade;
  }

  const applications = await Application.find({ studentId: userId, status: { $in: ["SELECTED", "COMPLETED"] } })
    .select("internshipId status")
    .lean();
  const internshipIds = applications.map((a) => a.internshipId);
  const internships = await Internship.find({ _id: { $in: internshipIds } }).select("title companyId").lean();
  profile.completedInternshipDetails = internships.map((i) => ({
    title: i.title,
    companyId: i.companyId,
  }));

  profile.badges = computeBadges(user, atsScore, user.profileCompleted || 0, stats.certificatesCount, stats.completedInternships);

  if (viewer && !viewer.isOwner && viewer.id) {
    profile.isFollowing = await Follow.exists({ followerId: viewer.id, followingId: userId });
  } else {
    profile.isFollowing = false;
  }

  return profile;
}

exports.getPublicProfile = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const viewer = req.user ? { id: req.user.id, role: req.user.role, isOwner: false } : null;
    const profile = await loadPublicProfile(userId, viewer);
    if (!profile) return res.status(404).json({ error: "Profile not available" });
    return res.json({ profile });
  } catch (err) { next(err); }
};

exports.getProfileByUsername = async (req, res, next) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username: String(username || "").toLowerCase().replace(/^@/, "") })
      .select("_id role")
      .lean();
    if (!user) return res.status(404).json({ error: "Profile not found" });
    return res.json({ userId: user._id.toString() });
  } catch (err) { next(err); }
};

exports.getMyProfile = async (req, res, next) => {
  try {
    const viewer = { id: req.user.id, role: req.user.role, isOwner: true };
    const profile = await loadPublicProfile(req.user.id, viewer);
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    return res.json({ profile });
  } catch (err) { next(err); }
};

exports.getProfileStats = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ error: "User not found" });
    const stats = await loadProfileStats(req.user.id);
    const reports = await ATSReport.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(1).lean();
    const projectsCount = (user.projects || []).length;
    return res.json({
      stats: {
        profileViews: user.profileViews || 0,
        searchAppearances: user.searchAppearances || 0,
        followersCount: stats.followersCount,
        followingCount: stats.followingCount,
        applications: stats.applicationsCount,
        completedInternships: stats.completedInternships,
        certificates: stats.certificatesCount,
        projects: projectsCount,
        atsScore: reports[0] ? reports[0].score : null,
        profileCompleted: user.profileCompleted || 0,
      },
    });
  } catch (err) { next(err); }
};

exports.registerProfileView = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!userId || userId === req.user.id) return res.json({ ok: true });
    await User.updateOne({ _id: userId }, { $inc: { profileViews: 1 } });
    return res.json({ ok: true });
  } catch (err) { next(err); }
};

exports.followUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (userId === req.user.id) return res.status(400).json({ error: "You cannot follow yourself" });
    const target = await User.findById(userId).select("_id role").lean();
    if (!target) return res.status(404).json({ error: "User not found" });

    await Follow.updateOne(
      { followerId: req.user.id, followingId: userId },
      { $setOnInsert: { followerId: req.user.id, followingId: userId } },
      { upsert: true }
    );
    const followersCount = await Follow.countDocuments({ followingId: userId });
    return res.json({ following: true, followersCount });
  } catch (err) {
    if (err.code === 11000) return res.json({ following: true });
    next(err);
  }
};

exports.unfollowUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    await Follow.deleteOne({ followerId: req.user.id, followingId: userId });
    const followersCount = await Follow.countDocuments({ followingId: userId });
    return res.json({ following: false, followersCount });
  } catch (err) { next(err); }
};

exports.getFollowStatus = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const following = await Follow.exists({ followerId: req.user.id, followingId: userId });
    const followersCount = await Follow.countDocuments({ followingId: userId });
    return res.json({ following: !!following, followersCount });
  } catch (err) { next(err); }
};

exports.getFollowers = async (req, res, next) => {
  try {
    const rows = await Follow.find({ followingId: req.user.id }).sort({ createdAt: -1 }).limit(50).lean();
    const ids = rows.map((r) => r.followerId);
    const users = await User.find({ _id: { $in: ids } })
      .select("name avatarUrl headline college username")
      .lean();
    const map = {};
    for (const u of users) map[u._id.toString()] = u;
    return res.json({
      followers: rows.map((r) => {
        const u = map[r.followerId] || {};
        return {
          id: r.followerId,
          name: u.name || "User",
          avatarUrl: u.avatarUrl || "",
          headline: u.headline || "",
          college: u.college || "",
          username: u.username || "",
        };
      }),
    });
  } catch (err) { next(err); }
};

exports.getFollowing = async (req, res, next) => {
  try {
    const rows = await Follow.find({ followerId: req.user.id }).sort({ createdAt: -1 }).limit(50).lean();
    const ids = rows.map((r) => r.followingId);
    const users = await User.find({ _id: { $in: ids } })
      .select("name avatarUrl headline college username")
      .lean();
    const map = {};
    for (const u of users) map[u._id.toString()] = u;
    return res.json({
      following: rows.map((r) => {
        const u = map[r.followingId] || {};
        return {
          id: r.followingId,
          name: u.name || "User",
          avatarUrl: u.avatarUrl || "",
          headline: u.headline || "",
          college: u.college || "",
          username: u.username || "",
        };
      }),
    });
  } catch (err) { next(err); }
};

exports.updatePrivacySettings = async (req, res, next) => {
  try {
    const allowed = [
      "visibility", "profilePublic", "showEmail", "showPhone", "showLinkedIn", "showGitHub",
      "showPortfolio", "showCertificates", "showProjects", "showExperience", "showAtsScore", "showResume",
    ];
    const update = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) {
        if (k === "visibility") update[`privacySettings.${k}`] = ["public", "private", "recruiters"].includes(req.body[k]) ? req.body[k] : "public";
        else update[`privacySettings.${k}`] = !!req.body[k];
      }
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
      "name", "username", "avatarUrl", "bannerUrl", "bannerPosition", "headline", "location", "phone", "address", "college", "degree", "branch",
      "cgpa", "graduationYear", "skills", "interests", "preferredLocations",
      "languages", "linkedin", "github", "portfolio", "careerObjective",
      "projects", "experience", "certifications", "courses", "achievements",
      "dob", "gender",
    ];
    const update = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) update[k] = req.body[k];
    }

    if (update.username) {
      update.username = String(update.username).toLowerCase().replace(/^@/, "");
      if (!/^[a-z0-9_]{3,30}$/.test(update.username)) {
        return res.status(400).json({ error: "Username must be 3-30 characters (letters, numbers, underscores)" });
      }
      const available = await isUsernameAvailable(update.username, req.user.id);
      if (!available) {
        return res.status(409).json({ error: "That username is already taken. Try another." });
      }
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
