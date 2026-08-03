const Certificate = require("../models/Certificate");

exports.getMyCertificates = async (req, res, next) => {
  try {
    const certs = await Certificate.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean();
    return res.json({
      certificates: certs.map((c) => ({
        id: c._id.toString(),
        name: c.name,
        organization: c.organization,
        category: c.category,
        issueDate: c.issueDate,
        credentialId: c.credentialId,
        verificationLink: c.verificationLink,
        fileUrl: c.fileUrl,
        fileName: c.fileName,
        fileType: c.fileType,
        isPublic: c.isPublic,
        description: c.description,
        skills: c.skills,
      })),
    });
  } catch (err) { next(err); }
};

exports.getPublicCertificates = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const certs = await Certificate.find({ userId, isPublic: true }).sort({ issueDate: -1 }).lean();
    return res.json({
      certificates: certs.map((c) => ({
        id: c._id.toString(),
        name: c.name,
        organization: c.organization,
        category: c.category,
        issueDate: c.issueDate,
        credentialId: c.credentialId,
        verificationLink: c.verificationLink,
        fileUrl: c.fileUrl,
        fileType: c.fileType,
        description: c.description,
      })),
    });
  } catch (err) { next(err); }
};

exports.addCertificate = async (req, res, next) => {
  try {
    const { name, organization, category, issueDate, expiryDate, credentialId, verificationLink, fileUrl, fileName, fileType, isPublic, description, skills } = req.body;

    if (!name || !organization) {
      return res.status(400).json({ error: "Certificate name and organization are required" });
    }

    const cert = await Certificate.create({
      userId: req.user.id,
      name,
      organization,
      category: category || "Other",
      issueDate: issueDate ? new Date(issueDate) : undefined,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      credentialId,
      verificationLink,
      fileUrl,
      fileName,
      fileType: fileType || "pdf",
      isPublic: isPublic !== false,
      description,
      skills: skills || [],
    });

    return res.status(201).json({
      certificate: {
        id: cert._id.toString(),
        name: cert.name,
        organization: cert.organization,
        category: cert.category,
        issueDate: cert.issueDate,
        credentialId: cert.credentialId,
        verificationLink: cert.verificationLink,
        fileUrl: cert.fileUrl,
        fileName: cert.fileName,
        fileType: cert.fileType,
        isPublic: cert.isPublic,
        description: cert.description,
        skills: cert.skills,
      },
    });
  } catch (err) { next(err); }
};

exports.updateCertificate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cert = await Certificate.findOne({ _id: id, userId: req.user.id });
    if (!cert) return res.status(404).json({ error: "Certificate not found" });

    const fields = ["name", "organization", "category", "issueDate", "expiryDate", "credentialId", "verificationLink", "fileUrl", "fileName", "fileType", "isPublic", "description", "skills"];
    for (const f of fields) {
      if (req.body[f] !== undefined) cert[f] = req.body[f];
    }
    if (req.body.issueDate) cert.issueDate = new Date(req.body.issueDate);
    if (req.body.expiryDate) cert.expiryDate = new Date(req.body.expiryDate);

    await cert.save();
    return res.json({ message: "Certificate updated", certificate: cert });
  } catch (err) { next(err); }
};

exports.deleteCertificate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cert = await Certificate.findOneAndDelete({ _id: id, userId: req.user.id });
    if (!cert) return res.status(404).json({ error: "Certificate not found" });
    return res.json({ message: "Certificate deleted" });
  } catch (err) { next(err); }
};

exports.getCategories = async (req, res, next) => {
  try {
    const cats = ["Programming", "AI", "Cloud", "Cybersecurity", "Data Science", "Web Development", "Other"];
    return res.json({ categories: cats });
  } catch (err) { next(err); }
};
