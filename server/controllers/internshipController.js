const mongoose = require("mongoose");
const Internship = require("../models/Internship");
const Company = require("../models/Company");

exports.getAll = async (req, res, next) => {
  try {
    const { domain, workMode, location, minStipend, maxDuration, q, skill, sort } = req.query;

    let internships = await Internship.find({ isActive: true }).lean();

    let list = internships.map((i) => ({
      id: i._id.toString(),
      title: i.title,
      companyId: i.companyId,
      description: i.description,
      responsibilities: i.responsibilities || [],
      requirements: i.requirements || [],
      benefits: i.benefits || [],
      skills: i.skills || [],
      domain: i.domain,
      location: i.location,
      workMode: i.workMode,
      duration: i.duration,
      stipend: i.stipend,
      openings: i.openings,
      deadline: i.deadline ? new Date(i.deadline).toISOString() : undefined,
      isActive: i.isActive,
      createdAt: new Date(i.createdAt).toISOString(),
    }));

    if (domain) list = list.filter((i) => i.domain === domain);
    if (workMode) list = list.filter((i) => i.workMode === workMode);
    if (location) list = list.filter((i) => i.location.toLowerCase().includes(location.toLowerCase()));
    if (minStipend) list = list.filter((i) => i.stipend >= Number(minStipend));
    if (maxDuration) list = list.filter((i) => i.duration <= Number(maxDuration));
    if (skill) { const sl = skill.toLowerCase(); list = list.filter((i) => i.skills.some((s) => s.toLowerCase().includes(sl))); }
    if (q) { const ql = q.toLowerCase(); list = list.filter((i) => i.title.toLowerCase().includes(ql) || i.description.toLowerCase().includes(ql) || i.domain.toLowerCase().includes(ql)); }

    switch (sort) {
      case "stipend": list.sort((a, b) => b.stipend - a.stipend); break;
      case "duration": list.sort((a, b) => a.duration - b.duration); break;
      default: list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    // Attach company info
    const companyIds = [...new Set(list.map((i) => i.companyId))];
    const validCompanyIds = companyIds.filter((id) => mongoose.isValidObjectId(id));
    const companies = await Company.find({ _id: { $in: validCompanyIds } }).lean();
    const companyMap = {};
    companies.forEach((c) => { companyMap[c._id.toString()] = c; });

    list = list.map((i) => ({
      ...i,
      company: companyMap[i.companyId] ? {
        id: companyMap[i.companyId]._id.toString(),
        name: companyMap[i.companyId].name,
        email: companyMap[i.companyId].email,
        logoUrl: companyMap[i.companyId].logoUrl || undefined,
        industry: companyMap[i.companyId].industry || undefined,
        description: companyMap[i.companyId].description || undefined,
        website: companyMap[i.companyId].website || undefined,
        location: companyMap[i.companyId].location || undefined,
        size: companyMap[i.companyId].size || undefined,
        verified: companyMap[i.companyId].verified,
        approved: companyMap[i.companyId].approved,
        rating: companyMap[i.companyId].rating,
      } : undefined,
    }));

    return res.json({ internships: list });
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let i = mongoose.isValidObjectId(id)
      ? await Internship.findById(id).lean()
      : null;
    if (!i) {
      i = await Internship.collection.findOne({ _id: id });
    }
    if (!i) return res.status(404).json({ error: "Not found" });

    const company = i.companyId && mongoose.isValidObjectId(i.companyId) ? await Company.findById(i.companyId).lean() : null;
    return res.json({
      internship: {
        id: i._id.toString(), title: i.title, companyId: i.companyId,
        company: company ? { id: company._id.toString(), name: company.name, email: company.email, logoUrl: company.logoUrl || undefined, industry: company.industry || undefined, description: company.description || undefined, website: company.website || undefined, location: company.location || undefined, size: company.size || undefined, verified: company.verified, approved: company.approved, rating: company.rating } : undefined,
        description: i.description, responsibilities: i.responsibilities || [], requirements: i.requirements || [], benefits: i.benefits || [], skills: i.skills || [],
        domain: i.domain, location: i.location, workMode: i.workMode, duration: i.duration, stipend: i.stipend, openings: i.openings,
        deadline: i.deadline ? new Date(i.deadline).toISOString() : undefined, isActive: i.isActive, createdAt: new Date(i.createdAt).toISOString(),
      },
    });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { title, description, responsibilities, requirements, benefits, skills, domain, location, workMode, duration, stipend, openings, deadline } = req.body;
    if (!title || !description || !domain || !location || !workMode) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const created = await Internship.create({
      title, companyId: req.user.companyId || "co_flipkart", description,
      responsibilities: responsibilities || [], requirements: requirements || [], benefits: benefits || [], skills: skills || [],
      domain, location, workMode, duration: Number(duration) || 12, stipend: Number(stipend) || 0, openings: Number(openings) || 1,
      deadline: deadline ? new Date(deadline) : null,
    });

    return res.json({
      internship: { id: created._id.toString(), title: created.title, companyId: created.companyId, description: created.description,
        responsibilities: created.responsibilities, requirements: created.requirements, benefits: created.benefits, skills: created.skills,
        domain: created.domain, location: created.location, workMode: created.workMode, duration: created.duration, stipend: created.stipend,
        openings: created.openings, deadline: created.deadline ? new Date(created.deadline).toISOString() : undefined,
        isActive: created.isActive, createdAt: new Date(created.createdAt).toISOString() },
    });
  } catch (err) { next(err); }
};
