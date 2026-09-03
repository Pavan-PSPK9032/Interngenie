const mongoose = require("mongoose");
const Company = require("../models/Company");
const Internship = require("../models/Internship");

exports.getAll = async (req, res, next) => {
  try {
    const { includePending } = req.query;
    const filter = includePending === "1" ? {} : { status: { $ne: "REJECTED" } };
    const companies = await Company.find(filter).sort({ rating: -1 }).lean();
    const internships = await Internship.find().lean();
    return res.json({
      companies: companies.map((c) => ({
        id: c._id.toString(), name: c.name, email: c.email,
        logoUrl: c.logoUrl || undefined, industry: c.industry || undefined,
        description: c.description || undefined, website: c.website || undefined,
        location: c.location || undefined, size: c.size || undefined,
        verified: c.verified, approved: c.approved, rating: c.rating,
        status: c.status, rejectionReason: c.rejectionReason || undefined,
        contactEmail: c.contactEmail || undefined, contactPhone: c.contactPhone || undefined,
        linkedin: c.linkedin || undefined, twitter: c.twitter || undefined, facebook: c.facebook || undefined,
        internshipCount: internships.filter((i) => i.companyId === c._id.toString()).length,
        createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : undefined,
      })),
    });
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const company = mongoose.isValidObjectId(id)
      ? await Company.findById(id).lean()
      : await Company.collection.findOne({ _id: id });
    if (!company) return res.status(404).json({ error: "Company not found" });
    const internships = await Internship.find({ companyId: company._id.toString() }).lean();
    return res.json({
      company: {
        id: company._id.toString(), name: company.name, email: company.email,
        logoUrl: company.logoUrl || undefined, industry: company.industry || undefined,
        description: company.description || undefined, website: company.website || undefined,
        location: company.location || undefined, size: company.size || undefined,
        verified: company.verified, approved: company.approved, rating: company.rating,
        status: company.status, rejectionReason: company.rejectionReason || undefined,
        contactEmail: company.contactEmail || undefined, contactPhone: company.contactPhone || undefined,
        linkedin: company.linkedin || undefined, twitter: company.twitter || undefined, facebook: company.facebook || undefined,
        internshipCount: internships.length,
        createdAt: company.createdAt ? new Date(company.createdAt).toISOString() : undefined,
      },
    });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const { id, approved, verified, status, rejectionReason } = req.body;
    if (!id) return res.status(400).json({ error: "id is required" });

    const updateData = {};
    if (approved !== undefined && typeof approved === "boolean") {
      updateData.approved = approved;
      // Keep the status field in sync with the legacy boolean.
      updateData.status = approved ? "APPROVED" : "REJECTED";
    }
    if (verified !== undefined && typeof verified === "boolean") updateData.verified = verified;
    if (status !== undefined) {
      const allowed = ["PENDING", "APPROVED", "REJECTED", "SUSPENDED"];
      if (!allowed.includes(status)) return res.status(400).json({ error: "Invalid status" });
      updateData.status = status;
      if (status === "APPROVED") updateData.approved = true;
      if (status === "REJECTED" || status === "SUSPENDED") updateData.approved = false;
    }
    if (rejectionReason !== undefined) updateData.rejectionReason = rejectionReason;

    const updated = mongoose.isValidObjectId(id)
      ? await Company.findByIdAndUpdate(id, updateData, { new: true }).lean()
      : await Company.collection.findOneAndUpdate(
          { _id: id },
          { $set: updateData },
          { returnDocument: "after" }
        );
    if (!updated) return res.status(404).json({ error: "Company not found" });
    return res.json({ company: { id: updated._id.toString(), ...updateData } });
  } catch (err) { next(err); }
};
