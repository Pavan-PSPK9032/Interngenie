const User = require("../models/User");
const { parseResume } = require("../utils/resumeParser");

exports.uploadAndParse = async (req, res, next) => {
  try {
    const { text, type, fileBase64, fileName } = req.body;

    let resumeText = text || "";

    if (fileBase64 && fileName) {
      const ext = fileName.split(".").pop().toLowerCase();
      const buffer = Buffer.from(fileBase64, "base64");

      if (ext === "pdf") {
        try {
          const pdfParse = require("pdf-parse");
          const data = await pdfParse(buffer);
          resumeText = data.text || "";
        } catch {
          return res.status(400).json({ error: "Failed to parse PDF file" });
        }
      } else if (ext === "docx") {
        try {
          const mammoth = require("mammoth");
          const result = await mammoth.extractRawText({ buffer });
          resumeText = result.value || "";
        } catch {
          return res.status(400).json({ error: "Failed to parse DOCX file" });
        }
      } else if (ext === "doc") {
        try {
          const WordExtractor = require("word-extractor");
          const extractor = new WordExtractor();
          const document = await extractor.extract(buffer);
          resumeText = document.getBody() || "";
        } catch {
          return res.status(400).json({ error: "Failed to parse DOC file" });
        }
      } else if (ext === "txt") {
        resumeText = buffer.toString("utf-8");
      } else {
        return res.status(400).json({ error: `Unsupported file type: .${ext}` });
      }
    }

    if (!resumeText || resumeText.trim().length < 20) {
      return res.status(400).json({ error: "Resume text is too short (minimum 20 characters)" });
    }

    const parsed = parseResume(resumeText);

    if (req.user?.id) {
      await User.findByIdAndUpdate(req.user.id, {
        resumeText,
        resumeData: parsed,
        extractedSkills: parsed.skills.map((s) => s.name),
      });
    }

    return res.json({ parsed, resumeText });
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
