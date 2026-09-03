const mongoose = require("mongoose");
const User = require("../models/User");
const Company = require("../models/Company");
const Internship = require("../models/Internship");
const Application = require("../models/Application");
const ATSReport = require("../models/ATSReport");

exports.getStats = async (req, res, next) => {
  try {
    const [totalStudents, totalCompanies, totalInternships, totalApplications, pendingCompanies] = await Promise.all([
      User.countDocuments({ role: "STUDENT" }),
      Company.countDocuments(),
      Internship.countDocuments({ isActive: true }),
      Application.countDocuments(),
      Company.countDocuments({ approved: false }),
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
      months.push({ name: label, value: count });
    }

    return res.json({
      totals: { totalStudents, totalCompanies, totalInternships, totalApplications, activeUsers: totalStudents, pendingCompanies },
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

    // Attach acting-user names/emails for readable UI display.
    const userIds = [...new Set(logs.map((l) => l.userId))];
    const users = await User.find({ _id: { $in: userIds } }).select("name email role").lean();
    const userMap = {};
    users.forEach((u) => { userMap[String(u._id)] = u; });

    return res.json({
      logs: logs.map((l) => ({
        ...l,
        id: l._id.toString(),
        user: userMap[String(l.userId)]
          ? { name: userMap[String(l.userId)].name, email: userMap[String(l.userId)].email, role: userMap[String(l.userId)].role }
          : undefined,
      })),
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

// ---------------------------------------------------------------------------
// Admin internship management (approval workflow)
// ---------------------------------------------------------------------------

exports.getInternships = async (req, res, next) => {
  try {
    const { q, status, domain, location, company, page = 1, limit = 20 } = req.query;
    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);

    const filter = {};
    if (status) filter.status = status;
    if (domain) filter.domain = domain;
    if (location) filter.location = new RegExp(location, "i");
    if (q) {
      filter.$or = [
        { title: new RegExp(q, "i") },
        { description: new RegExp(q, "i") },
        { domain: new RegExp(q, "i") },
      ];
    }

    let internships = await Internship.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    const total = await Internship.countDocuments(filter);

    if (company) {
      const companies = await Company.find({ name: new RegExp(company, "i") }).select("_id").lean();
      const ids = companies.map((c) => c._id.toString());
      internships = internships.filter((i) => ids.includes(String(i.companyId)));
    }

    const companyIds = [...new Set(internships.map((i) => String(i.companyId)))];
    const validCompanies = await Company.find({ _id: { $in: companyIds.filter((id) => mongoose.isValidObjectId(id)) } }).lean();
    const companyMap = {};
    validCompanies.forEach((c) => { companyMap[c._id.toString()] = c; });

    return res.json({
      internships: internships.map((i) => {
        const comp = companyMap[String(i.companyId)];
        return {
          id: i._id.toString(), title: i.title, companyId: i.companyId,
          company: comp ? { id: comp._id.toString(), name: comp.name, status: comp.status, approved: comp.approved, verified: comp.verified } : undefined,
          description: i.description, responsibilities: i.responsibilities || [], requirements: i.requirements || [], benefits: i.benefits || [], skills: i.skills || [],
          domain: i.domain, location: i.location, workMode: i.workMode, duration: i.duration, stipend: i.stipend, openings: i.openings,
          deadline: i.deadline ? new Date(i.deadline).toISOString() : undefined, isActive: i.isActive, status: i.status, rejectionReason: i.rejectionReason || undefined,
          createdAt: new Date(i.createdAt).toISOString(),
        };
      }),
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) { next(err); }
};

exports.updateInternship = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, isActive, rejectionReason, title, description, skills } = req.body;

    const internship = mongoose.isValidObjectId(id)
      ? await Internship.findById(id)
      : await Internship.collection.findOne({ _id: id });
    if (!internship) return res.status(404).json({ error: "Internship not found" });

    const updateData = {};
    if (status !== undefined) {
      const allowed = ["PENDING", "APPROVED", "REJECTED", "EXPIRED"];
      if (!allowed.includes(status)) return res.status(400).json({ error: "Invalid status" });
      updateData.status = status;
      updateData.isActive = status === "APPROVED" || status === "PENDING";
      if (status === "EXPIRED") updateData.isActive = false;
      if (status === "APPROVED") updateData.isActive = true;
      if (rejectionReason !== undefined) updateData.rejectionReason = status === "REJECTED" ? rejectionReason : undefined;
    }
    if (typeof isActive === "boolean") updateData.isActive = isActive;
    if (title !== undefined && String(title).trim()) updateData.title = String(title).trim();
    if (description !== undefined && String(description).trim()) updateData.description = String(description).trim();
    if (Array.isArray(skills)) updateData.skills = skills;

    let updated;
    if (mongoose.isValidObjectId(id)) {
      updated = await Internship.findByIdAndUpdate(id, updateData, { new: true }).lean();
    } else {
      updated = await Internship.collection.findOneAndUpdate(
        { _id: id },
        { $set: updateData },
        { returnDocument: "after" }
      );
    }

    // Notify the company that posted this internship.
    if (status && internship.companyId && mongoose.isValidObjectId(internship.companyId)) {
      const Notification = require("../models/Notification");
      const companyUser = await User.findOne({ companyId: String(internship.companyId), role: "COMPANY" }).lean();
      if (companyUser) {
        const msg =
          status === "APPROVED" ? `Your internship "${internship.title}" has been approved and is now live.` :
          status === "REJECTED" ? `Your internship "${internship.title}" was rejected.${rejectionReason ? ` Reason: ${rejectionReason}` : ""}` :
          status === "EXPIRED" ? `Your internship "${internship.title}" has been marked as expired.` :
          `Your internship "${internship.title}" status changed to ${status}.`;
        await Notification.create({
          userId: String(companyUser._id),
          title: status === "APPROVED" ? "Internship approved" : "Internship update",
          message: msg,
          type: status === "REJECTED" ? "WARNING" : "SUCCESS",
        }).catch(() => {});
      }
    }

    return res.json({ internship: updated });
  } catch (err) { next(err); }
};

exports.deleteInternship = async (req, res, next) => {
  try {
    const { id } = req.params;
    const internship = mongoose.isValidObjectId(id)
      ? await Internship.findByIdAndDelete(id).lean()
      : await Internship.collection.findOneAndDelete({ _id: id });
    if (!internship) return res.status(404).json({ error: "Internship not found" });
    return res.json({ success: true });
  } catch (err) { next(err); }
};

// ---------------------------------------------------------------------------
// Admin company management
// ---------------------------------------------------------------------------

exports.getAllCompaniesAdmin = async (req, res, next) => {
  try {
    const { q, status, page = 1, limit = 20 } = req.query;
    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
    const filter = {};
    if (status) filter.status = status;
    if (q) filter.name = new RegExp(q, "i");

    const [companies, total] = await Promise.all([
      Company.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      Company.countDocuments(filter),
    ]);

    return res.json({
      companies: companies.map((c) => ({
        id: c._id.toString(), name: c.name, email: c.email,
        logoUrl: c.logoUrl || undefined, industry: c.industry || undefined,
        description: c.description || undefined, website: c.website || undefined,
        location: c.location || undefined, size: c.size || undefined,
        verified: c.verified, approved: c.approved, rating: c.rating,
        status: c.status, rejectionReason: c.rejectionReason || undefined,
        createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : undefined,
      })),
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) { next(err); }
};

exports.deleteCompany = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: "Invalid id" });
    const company = await Company.findByIdAndDelete(id).lean();
    if (!company) return res.status(404).json({ error: "Company not found" });
    await Internship.deleteMany({ companyId: id }).catch(() => {});
    return res.json({ success: true });
  } catch (err) { next(err); }
};
