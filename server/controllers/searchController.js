const User = require("../models/User");
const Company = require("../models/Company");
const Internship = require("../models/Internship");

exports.globalSearch = async (req, res, next) => {
  try {
    const { q, type } = req.query;
    if (!q || q.trim().length < 1) {
      return res.json({ students: [], companies: [], internships: [] });
    }

    const term = q.trim();
    const re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

    const results = { students: [], companies: [], internships: [] };

    if (!type || type === "students") {
      const students = await User.find({
        role: "STUDENT",
        "privacySettings.profilePublic": true,
        $or: [
          { name: re },
          { email: re },
          { college: re },
          { branch: re },
          { skills: re },
          { extractedSkills: re },
        ],
      })
        .select("name avatarUrl email college branch degree skills graduationYear privacySettings")
        .limit(8)
        .lean();

      results.students = students.map((s) => ({
        id: s._id.toString(),
        name: s.name,
        avatarUrl: s.avatarUrl || "",
        email: s.privacySettings?.showEmail ? s.email : "",
        college: s.college || "",
        branch: s.branch || "",
        degree: s.degree || "",
        skills: (s.skills || []).slice(0, 6),
        graduationYear: s.graduationYear,
        status: "Looking for internship",
      }));
    }

    if (!type || type === "companies") {
      const companies = await Company.find({ $or: [{ name: re }, { industry: re }, { location: re }] })
        .limit(6)
        .lean();

      results.companies = companies.map((c) => ({
        id: c._id.toString(),
        name: c.name,
        logoUrl: c.logoUrl || "",
        industry: c.industry || "",
        location: c.location || "",
        description: c.description || "",
      }));
    }

    if (!type || type === "internships") {
      const internships = await Internship.find({
        $or: [
          { title: re },
          { domain: re },
          { location: re },
          { skills: re },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(8)
        .lean();

      const companyIds = [...new Set(internships.map((i) => i.companyId).filter(Boolean))];
      const companies = await Company.find({ _id: { $in: companyIds } }).lean();
      const companyNameMap = {};
      for (const c of companies) companyNameMap[c._id.toString()] = c.name;

      results.internships = internships.map((i) => ({
        id: i._id.toString(),
        title: i.title,
        domain: i.domain || "",
        location: i.location || "",
        company: companyNameMap[i.companyId?.toString()] || i.companyId || "",
        companyId: i.companyId || "",
        skills: (i.skills || []).slice(0, 6),
        stipend: i.stipend || "",
        workMode: i.workMode || "",
      }));
    }

    return res.json(results);
  } catch (err) { next(err); }
};
