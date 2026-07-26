const Internship = require("../models/Internship");
const { recommendInternships } = require("../utils/aiEngine");

exports.getRecommendations = async (req, res, next) => {
  try {
    const allInternships = await Internship.find({ isActive: true }).lean();
    const internships = allInternships.map((i) => ({
      id: i._id.toString(), title: i.title, companyId: i.companyId,
      description: i.description, responsibilities: i.responsibilities || [], requirements: i.requirements || [],
      benefits: i.benefits || [], skills: i.skills || [], domain: i.domain, location: i.location,
      workMode: i.workMode, duration: i.duration, stipend: i.stipend, openings: i.openings,
      deadline: i.deadline ? new Date(i.deadline).toISOString() : undefined,
      isActive: i.isActive, createdAt: new Date(i.createdAt).toISOString(),
    }));
    const student = { skills: req.user.skills, interests: req.user.interests, preferredLocations: req.user.preferredLocations, cgpa: req.user.cgpa };
    return res.json({ recommendations: recommendInternships(student, internships) });
  } catch (err) { next(err); }
};

exports.getCareers = async (req, res, next) => {
  try {
    const { suggestCareers } = require("../utils/aiEngine");
    const suggestions = suggestCareers({ skills: req.user.skills, interests: req.user.interests, preferredLocations: req.user.preferredLocations, cgpa: req.user.cgpa });
    return res.json({ careers: suggestions });
  } catch (err) { next(err); }
};

exports.getSkillGap = async (req, res, next) => {
  try {
    const { analyzeSkillGap } = require("../utils/aiEngine");
    const all = await Internship.find({ isActive: true }).lean();
    const internships = all.map((i) => ({
      id: i._id.toString(), title: i.title, companyId: i.companyId, description: i.description,
      responsibilities: i.responsibilities || [], requirements: i.requirements || [], benefits: i.benefits || [],
      skills: i.skills || [], domain: i.domain, location: i.location, workMode: i.workMode,
      duration: i.duration, stipend: i.stipend, openings: i.openings,
      deadline: i.deadline ? new Date(i.deadline).toISOString() : undefined,
      isActive: i.isActive, createdAt: new Date(i.createdAt).toISOString(),
    }));
    return res.json({ gaps: analyzeSkillGap({ skills: req.user.skills, interests: req.user.interests, preferredLocations: req.user.preferredLocations, cgpa: req.user.cgpa }, internships), totalInternships: internships.length });
  } catch (err) { next(err); }
};

exports.parseResume = async (req, res, next) => {
  try {
    const User = require("../models/User");
    const { parseResume } = require("../utils/aiEngine");
    const { text } = req.body;
    if (!text || text.length < 20) return res.status(400).json({ error: "Resume text too short" });

    const parsed = parseResume(text);
    const existingSkills = new Set(req.user.skills.map((s) => s.toLowerCase()));
    const newSkills = parsed.skills.filter((s) => !existingSkills.has(s.toLowerCase()));
    const merged = [...new Set([...req.user.skills, ...newSkills])];

    await User.findByIdAndUpdate(req.user.id, {
      resumeText: text, extractedSkills: parsed.skills, skills: merged,
      profileCompleted: Math.min(100, req.user.profileCompleted + 15),
    });

    return res.json({ parsed, mergedSkills: merged });
  } catch (err) { next(err); }
};

exports.getCertificates = async (req, res, next) => {
  try {
    const Certificate = require("../models/Certificate");
    const certificates = await Certificate.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean();
    return res.json({
      certificates: certificates.map((c) => ({
        id: c._id.toString(), userId: c.userId, internshipId: c.internshipId,
        internshipTitle: c.internshipTitle, companyName: c.companyName,
        studentName: c.studentName, issueDate: new Date(c.createdAt).toISOString(),
        certificateId: c.certificateId, skills: c.skills || [],
      })),
    });
  } catch (err) { next(err); }
};
