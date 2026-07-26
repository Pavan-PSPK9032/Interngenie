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

exports.generateCoverLetter = async (req, res, next) => {
  try {
    const { internshipId, studentProfile } = req.body;
    if (!internshipId) return res.status(400).json({ error: "internshipId is required" });

    const internship = await Internship.findById(internshipId).lean();
    if (!internship) return res.status(404).json({ error: "Internship not found" });

    const profile = studentProfile || {
      name: req.user.name,
      email: req.user.email,
      skills: req.user.skills,
      college: req.user.college,
      degree: req.user.degree,
      branch: req.user.branch,
      graduationYear: req.user.graduationYear,
      cgpa: req.user.cgpa,
    };

    const topSkills = (profile.skills || []).slice(0, 5).join(", ");
    const skillHighlight = topSkills || "software development and problem-solving";

    const letter = `Dear Hiring Manager,

I am writing to express my strong interest in the ${internship.title} position${internship.companyId ? ` at your organization` : ""}. As a ${profile.degree || "computer science"}${profile.branch ? ` ${profile.branch}` : ""} student at ${profile.college || "my university"}${profile.cgpa ? ` with a CGPA of ${profile.cgpa}` : ""}, I am eager to apply my skills in ${skillHighlight} to contribute meaningfully to your team.

Your ${internship.title} role in the ${internship.domain} domain aligns closely with my academic background and career aspirations. The${internship.description ? ` ${internship.description.slice(0, 120).trim()}${internship.description.length > 120 ? "..." : ""}` : ""} responsibilities outlined for this position resonate with my hands-on experience and learning objectives.

${(profile.skills || []).length > 0 ? `My technical skill set includes ${topSkills}${(profile.skills || []).length > 5 ? ` among ${profile.skills.length} total technologies` : ""}, which I have developed through coursework, personal projects, and practical applications. I am confident that these competencies, combined with my passion for ${internship.domain || "technology"}, will enable me to deliver tangible results during the internship.` : `I am committed to rapidly acquiring the technical competencies required for this role and contributing effectively from day one.`}

${internship.requirements && internship.requirements.length > 0 ? `I have reviewed the requirements for this position${internship.requirements.length <= 3 ? ` including ${internship.requirements.join(", ")}` : ""} and am confident in my ability to meet and exceed expectations.` : ""} I thrive in collaborative environments and am eager to learn from experienced professionals in your organization.

I would welcome the opportunity to discuss how my background, skills, and enthusiasm align with the goals of your team. Thank you for considering my application. I look forward to the possibility of contributing to your organization.

Sincerely,
${profile.name || "Applicant"}
${profile.email || ""}${profile.phone ? `\n${profile.phone}` : ""}`;

    return res.json({ coverLetter: letter });
  } catch (err) {
    next(err);
  }
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
