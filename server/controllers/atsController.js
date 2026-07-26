const { checkATS } = require("../utils/atsChecker");
const ATSReport = require("../models/ATSReport");
const Internship = require("../models/Internship");

exports.checkATS = async (req, res, next) => {
  try {
    const { resumeText, internshipId } = req.body;
    if (!resumeText || resumeText.trim().length < 20) {
      return res.status(400).json({ error: "Resume text is too short (minimum 20 characters)" });
    }

    let targetInternship = null;
    if (internshipId) {
      const internship = await Internship.findById(internshipId).lean();
      if (internship) {
        targetInternship = {
          title: internship.title,
          skills: internship.skills || [],
          domain: internship.domain,
          description: internship.description,
          requirements: internship.requirements || [],
          responsibilities: internship.responsibilities || [],
        };
      }
    }

    const report = checkATS(resumeText, targetInternship);

    const saved = await ATSReport.create({
      userId: req.user.id,
      resumeText,
      internshipId: internshipId || undefined,
      score: report.score,
      grade: report.grade,
      breakdown: report.breakdown,
      missingKeywords: report.missingKeywords,
      suggestedSkills: report.suggestedSkills,
      improvements: report.improvements,
      bulletPointSuggestions: report.bulletPointSuggestions,
      summarySuggestion: report.summarySuggestion,
    });

    return res.json({
      report: {
        id: saved._id.toString(),
        score: report.score,
        grade: report.grade,
        breakdown: report.breakdown,
        missingKeywords: report.missingKeywords,
        suggestedSkills: report.suggestedSkills,
        improvements: report.improvements,
        bulletPointSuggestions: report.bulletPointSuggestions,
        summarySuggestion: report.summarySuggestion,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getATSHistory = async (req, res, next) => {
  try {
    const reports = await ATSReport.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return res.json({
      reports: reports.map((r) => ({
        id: r._id.toString(),
        score: r.score,
        grade: r.grade,
        internshipId: r.internshipId,
        improvements: r.improvements,
        createdAt: new Date(r.createdAt).toISOString(),
      })),
    });
  } catch (err) {
    next(err);
  }
};
