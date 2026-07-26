const Company = require("../models/Company");
const Internship = require("../models/Internship");

exports.getAll = async (req, res, next) => {
  try {
    const companies = await Company.find().sort({ rating: -1 }).lean();
    const internships = await Internship.find().lean();
    return res.json({
      companies: companies.map((c) => ({
        id: c._id.toString(), name: c.name, email: c.email,
        logoUrl: c.logoUrl || undefined, industry: c.industry || undefined,
        description: c.description || undefined, website: c.website || undefined,
        location: c.location || undefined, size: c.size || undefined,
        verified: c.verified, approved: c.approved, rating: c.rating,
        internshipCount: internships.filter((i) => i.companyId === c._id.toString()).length,
      })),
    });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const { id, approved, verified } = req.body;
    const updateData = {};
    if (approved !== undefined) updateData.approved = approved;
    if (verified !== undefined) updateData.verified = verified;
    const updated = await Company.findByIdAndUpdate(id, updateData, { new: true }).lean();
    return res.json({ company: updated });
  } catch (err) { next(err); }
};
