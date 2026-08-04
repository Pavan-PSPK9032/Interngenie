const mongoose = require("mongoose");
const Application = require("../models/Application");
const Internship = require("../models/Internship");
const Company = require("../models/Company");
const Notification = require("../models/Notification");
const Certificate = require("../models/Certificate");
const ATSReport = require("../models/ATSReport");
const { computeMatch } = require("../utils/aiEngine");

exports.getAll = async (req, res, next) => {
  try {
    const user = req.user;
    let apps;

    if (user.role === "STUDENT") {
      apps = await Application.find({ studentId: user.id }).sort({ createdAt: -1 }).lean();
    } else if (user.role === "COMPANY") {
      const internships = await Internship.find({ companyId: user.companyId || "" }).select("_id").lean();
      const ids = internships.map((i) => i._id.toString());
      apps = await Application.find({ internshipId: { $in: ids } }).sort({ matchScore: -1 }).lean();
    } else {
      apps = await Application.find().sort({ createdAt: -1 }).lean();
    }

    // Populate ATS scores for company/admin views
    let atsScoreMap = {};
    if (user.role !== "STUDENT") {
      const studentIds = [...new Set(apps.map((a) => a.studentId))];
      const latestReports = await ATSReport.aggregate([
        { $match: { userId: { $in: studentIds } } },
        { $sort: { createdAt: -1 } },
        { $group: { _id: "$userId", score: { $first: "$score" } } },
      ]);
      latestReports.forEach((r) => { atsScoreMap[r._id] = r.score; });
    }

    // Populate internship and company info
    const internshipIds = [...new Set(apps.map((a) => a.internshipId))];
    const validInternshipIds = internshipIds.filter((id) => mongoose.isValidObjectId(id));
    const internships = await Internship.find({ _id: { $in: validInternshipIds } }).lean();
    const internshipMap = {};
    internships.forEach((i) => { internshipMap[i._id.toString()] = i; });

    const companyIds = [...new Set(internships.map((i) => i.companyId))];
    const validCompanyIds = companyIds.filter((id) => mongoose.isValidObjectId(id));
    const companies = await Company.find({ _id: { $in: validCompanyIds } }).lean();
    const companyMap = {};
    companies.forEach((c) => { companyMap[c._id.toString()] = c; });

    // Populate student info (for company/admin views)
    let studentMap = {};
    if (user.role !== "STUDENT") {
      const stdIds = [...new Set(apps.map((a) => a.studentId))];
      const { default: User } = require("../models/User");
      const students = await User.find({ _id: { $in: stdIds } }).lean();
      students.forEach((s) => { studentMap[s._id.toString()] = s; });
    }

    return res.json({
      applications: apps.map((a) => {
        const internship = internshipMap[a.internshipId];
        const company = internship ? companyMap[internship.companyId] : null;
        const student = studentMap[a.studentId];
        return {
          id: a._id.toString(), internshipId: a.internshipId, studentId: a.studentId,
          status: a.status, matchScore: a.matchScore, matchingSkills: a.matchingSkills || [], missingSkills: a.missingSkills || [],
          coverLetter: a.coverLetter || undefined, atsScoreAtApply: a.atsScoreAtApply || undefined,
          candidateAtsScore: atsScoreMap[a.studentId] || null,
          interviewScheduledAt: a.interviewScheduledAt ? new Date(a.interviewScheduledAt).toISOString() : undefined,
          feedback: a.feedback || undefined, createdAt: new Date(a.createdAt).toISOString(),
          internship: internship ? {
            id: internship._id.toString(), title: internship.title, companyId: internship.companyId,
            company: company ? { id: company._id.toString(), name: company.name, industry: company.industry || undefined, location: company.location || undefined, rating: company.rating, verified: company.verified, approved: company.approved, email: company.email } : undefined,
            domain: internship.domain, location: internship.location, workMode: internship.workMode, duration: internship.duration, stipend: internship.stipend, skills: internship.skills || [],
          } : undefined,
          student: student ? { id: student._id.toString(), name: student.name, email: student.email, college: student.college || undefined, degree: student.degree || undefined, branch: student.branch || undefined, cgpa: student.cgpa || undefined, graduationYear: student.graduationYear || undefined, skills: student.skills || [], phone: student.phone || undefined, linkedin: student.linkedin || undefined, github: student.github || undefined } : undefined,
        };
      }),
    });
  } catch (err) { next(err); }
};

exports.apply = async (req, res, next) => {
  try {
    if (req.user.role !== "STUDENT") return res.status(403).json({ error: "Unauthorized" });
    const { internshipId, coverLetter } = req.body;
    if (!internshipId) return res.status(400).json({ error: "Missing internshipId" });

    const existing = await Application.findOne({ internshipId, studentId: req.user.id });
    if (existing) return res.status(409).json({ error: "Already applied" });

    let i = mongoose.isValidObjectId(internshipId)
      ? await Internship.findById(internshipId).lean()
      : null;
    if (!i) i = await Internship.collection.findOne({ _id: internshipId });
    const internship = i;
    if (!internship) return res.status(404).json({ error: "Internship not found" });

    const match = computeMatch(
      { skills: req.user.skills, interests: req.user.interests, preferredLocations: req.user.preferredLocations, cgpa: req.user.cgpa },
      { id: internship._id.toString(), skills: internship.skills || [], domain: internship.domain, location: internship.location, workMode: internship.workMode, stipend: internship.stipend, duration: internship.duration }
    );

    // Check user's resume and ATS score
    const { default: User } = require("../models/User");
    const userDoc = await User.findById(req.user.id).lean();
    const resumeText = userDoc?.resumeText || null;

    let atsScoreAtApply = null;
    let atsWarning = null;

    if (resumeText) {
      const latestReport = await ATSReport.findOne({ userId: req.user.id }).sort({ createdAt: -1 }).lean();
      if (latestReport && typeof latestReport.score === "number") {
        atsScoreAtApply = latestReport.score;
        if (latestReport.score < 60) {
          atsWarning = {
            score: latestReport.score,
            message: `Your ATS score is ${latestReport.score}%. Consider improving your resume before applying for better chances.`,
          };
        }
      }
    }

    const app = await Application.create({
      internshipId, studentId: req.user.id, status: "APPLIED",
      matchScore: match.score, matchingSkills: match.matchingSkills, missingSkills: match.missingSkills,
      coverLetter: coverLetter || null,
      resumeText: resumeText || null,
      atsScoreAtApply,
    });

    await Notification.create({
      userId: req.user.id,
      title: "Application Submitted",
      message: `You applied for ${internship.title}. Match score: ${match.score}%`,
      type: "APPLICATION",
    });

    return res.json({ application: app, match, atsWarning });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    if (req.user.role !== "COMPANY" && req.user.role !== "ADMIN") return res.status(403).json({ error: "Unauthorized" });
    const { status, interviewScheduledAt, feedback } = req.body;

    const app = await Application.findById(req.params.id).lean();
    if (!app) return res.status(404).json({ error: "Not found" });

    const updateData = {};
    if (status) updateData.status = status;
    if (interviewScheduledAt) updateData.interviewScheduledAt = new Date(interviewScheduledAt);
    if (feedback !== undefined) updateData.feedback = feedback;

    const updated = await Application.findByIdAndUpdate(req.params.id, updateData, { new: true }).lean();

    if (status) {
      const internship = await Internship.findById(app.internshipId).lean();
      const notifType = status === "INTERVIEW" ? "INTERVIEW" : status === "SELECTED" ? "SUCCESS" : status === "REJECTED" ? "WARNING" : "APPLICATION";
      const title = status === "INTERVIEW" ? "Interview scheduled" : status === "SELECTED" ? "You're selected!" : status === "REJECTED" ? "Application update" : "Application status updated";
      const msg = `Your application for ${internship ? internship.title : "an internship"} is now ${status}.`;

      await Notification.create({ userId: app.studentId, title, message: msg, type: notifType });

      if (status === "SELECTED") {
        const company = internship && internship.companyId && mongoose.isValidObjectId(internship.companyId) ? await Company.findById(internship.companyId).lean() : null;
        const { default: User } = require("../models/User");
        const student = await User.findById(app.studentId).lean();
        const certId = "CERT-" + Math.random().toString(36).slice(2, 10).toUpperCase();
        await Certificate.create({
          userId: app.studentId, internshipId: app.internshipId,
          internshipTitle: internship ? internship.title : "", companyName: company ? company.name : "",
          studentName: student ? student.name : "", certificateId: certId, skills: internship ? internship.skills || [] : [],
        });
      }
    }

    return res.json({ application: updated });
  } catch (err) { next(err); }
};
