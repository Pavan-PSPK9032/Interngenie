const User = require("../models/User");
const { parseResume } = require("../utils/resumeParser");

exports.uploadAndParse = async (req, res, next) => {
  try {
    const { text, type } = req.body;
    if (!text || text.trim().length < 20) {
      return res.status(400).json({ error: "Resume text is too short (minimum 20 characters)" });
    }

    const parsed = parseResume(text);

    await User.findByIdAndUpdate(req.user.id, {
      resumeText: text,
      resumeData: parsed,
      extractedSkills: parsed.skills.map((s) => s.name),
    });

    return res.json({ parsed });
  } catch (err) {
    next(err);
  }
};

exports.saveResumeData = async (req, res, next) => {
  try {
    const { resumeData } = req.body;
    if (!resumeData) {
      return res.status(400).json({ error: "resumeData is required" });
    }

    const existingSkills = new Set((req.user.skills || []).map((s) => s.toLowerCase()));
    const newSkills = (resumeData.skills || [])
      .map((s) => s.name || s)
      .filter((s) => typeof s === "string" && !existingSkills.has(s.toLowerCase()));
    const merged = [...new Set([...(req.user.skills || []), ...newSkills])];

    const updates = {
      resumeData,
      skills: merged,
    };

    if (resumeData.personal) {
      if (resumeData.personal.phone) updates.phone = resumeData.personal.phone;
      if (resumeData.personal.linkedin) updates.linkedin = resumeData.personal.linkedin;
      if (resumeData.personal.github) updates.github = resumeData.personal.github;
    }
    if (resumeData.education && resumeData.education.length > 0) {
      const edu = resumeData.education[0];
      if (edu.institution) updates.college = edu.institution;
      if (edu.degree) updates.degree = edu.degree;
      if (edu.branch) updates.branch = edu.branch;
      if (edu.cgpa) updates.cgpa = edu.cgpa;
      if (edu.endYear) updates.graduationYear = edu.endYear;
    }

    const updated = await User.findByIdAndUpdate(req.user.id, updates, { new: true })
      .select("-passwordHash")
      .lean();

    return res.json({ user: updated });
  } catch (err) {
    next(err);
  }
};
