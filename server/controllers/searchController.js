const mongoose = require("mongoose");
const User = require("../models/User");
const Company = require("../models/Company");
const Internship = require("../models/Internship");
const Certificate = require("../models/Certificate");
const ATSReport = require("../models/ATSReport");
const Follow = require("../models/Follow");

function escapeRegex(term) {
  return term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function enrichStudents(students) {
  if (students.length === 0) return [];
  const ids = students.map((s) => s._id.toString());

  const reports = await ATSReport.find({ userId: { $in: ids } })
    .sort({ createdAt: -1 })
    .select("userId score grade")
    .lean();
  const atsMap = {};
  for (const r of reports) {
    if (atsMap[r.userId] === undefined) atsMap[r.userId] = { score: r.score, grade: r.grade };
  }

  const followRows = await Follow.aggregate([
    { $match: { followingId: { $in: ids } } },
    { $group: { _id: "$followingId", count: { $sum: 1 } } },
  ]);
  const followersMap = {};
  for (const f of followRows) followersMap[f._id] = f.count;

  await User.updateMany({ _id: { $in: ids } }, { $inc: { searchAppearances: 1 } });

  return students.map((s) => {
    const id = s._id.toString();
    const ats = atsMap[id];
    return {
      id,
      name: s.name,
      username: s.username || "",
      avatarUrl: s.avatarUrl || "",
      email: s.privacySettings?.showEmail ? s.email : "",
      college: s.college || "",
      branch: s.branch || "",
      degree: s.degree || "",
      headline: s.headline || "",
      skills: (s.skills || []).slice(0, 6),
      graduationYear: s.graduationYear || 0,
      profileCompleted: s.profileCompleted || 0,
      atsScore: ats ? ats.score : null,
      atsGrade: ats ? ats.grade : null,
      followersCount: followersMap[id] || 0,
      status: "Looking for internship",
    };
  });
}

exports.globalSearch = async (req, res, next) => {
  try {
    const { q, type, sort } = req.query;
    if (!q || q.trim().length < 1) {
      return res.json({ students: [], companies: [], internships: [], skills: [], colleges: [], certificates: [] });
    }

    const term = q.trim();
    const isUsernameQuery = term.startsWith("@");
    const cleanTerm = isUsernameQuery ? term.slice(1) : term;
    const re = new RegExp(escapeRegex(cleanTerm), "i");
    const t = type || "all";

    const results = { students: [], companies: [], internships: [], skills: [], colleges: [], certificates: [] };

    // ── People / students ───────────────────────────────────
    if (t === "all" || t === "people" || t === "students") {
      const searchable = isUsernameQuery
        ? { username: re }
        : {
            $or: [
              { name: re },
              { email: re },
              { username: re },
              { college: re },
              { branch: re },
              { headline: re },
              { skills: re },
              { extractedSkills: re },
            ],
          };
      const query = User.find({
        role: "STUDENT",
        "privacySettings.profilePublic": true,
        ...searchable,
      })
        .select("name username avatarUrl email college branch degree headline skills graduationYear profileCompleted privacySettings")
        .limit(8)
        .lean();

      if (sort === "newest") query.sort({ createdAt: -1 });
      else query.sort({ name: 1 });

      const students = await query;
      results.students = await enrichStudents(students);
    }

    // ── Skills ──────────────────────────────────────────────
    if (t === "all" || t === "skills") {
      const rows = await User.aggregate([
        { $match: { role: "STUDENT", "privacySettings.profilePublic": true } },
        { $unwind: { path: "$skills", preserveNullAndEmptyArrays: false } },
        { $match: { skills: re } },
        { $group: { _id: { $toLower: "$skills" }, name: { $first: "$skills" }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]);
      results.skills = rows.map((r) => ({ name: r.name, count: r.count }));
    }

    // ── Colleges ────────────────────────────────────────────
    if (t === "all" || t === "colleges") {
      const rows = await User.aggregate([
        { $match: { role: "STUDENT", "privacySettings.profilePublic": true, college: { $exists: true, $ne: "" } } },
        { $match: { college: re } },
        { $group: { _id: { $toLower: "$college" }, name: { $first: "$college" }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]);
      results.colleges = rows.map((r) => ({ name: r.name, count: r.count }));
    }

    // ── Companies ───────────────────────────────────────────
    if (t === "all" || t === "companies") {
      const companies = await Company.find({ $or: [{ name: re }, { industry: re }, { location: re }] })
        .sort({ name: 1 })
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

    // ── Internships ─────────────────────────────────────────
    if (t === "all" || t === "internships") {
      const internshipQuery = Internship.find({
        $or: [
          { title: re },
          { domain: re },
          { location: re },
          { skills: re },
        ],
      })
        .limit(8)
        .lean();

      if (sort === "newest") internshipQuery.sort({ createdAt: -1 });
      else internshipQuery.sort({ title: 1 });

      const internships = await internshipQuery;

      const companyIds = [...new Set(internships.map((i) => i.companyId).filter(Boolean))];
      const validCompanyIds = companyIds.filter((id) => mongoose.isValidObjectId(id));
      const companies = await Company.find({ _id: { $in: validCompanyIds } }).lean();
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

    // ── Certificates ────────────────────────────────────────
    if (t === "all" || t === "certificates") {
      const certRows = await Certificate.aggregate([
        { $match: { isPublic: true, $or: [{ name: re }, { organization: re }, { category: re }] } },
        { $sort: { issueDate: -1 } },
        { $limit: 8 },
      ]);
      results.certificates = certRows.map((c) => ({
        id: c._id.toString(),
        name: c.name,
        organization: c.organization,
        category: c.category || "",
        issueDate: c.issueDate,
        userId: c.userId,
      }));
    }

    return res.json(results);
  } catch (err) { next(err); }
};
