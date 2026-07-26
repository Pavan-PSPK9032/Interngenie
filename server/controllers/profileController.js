const User = require("../models/User");
const { sanitizeUser } = require("../utils/helpers");

exports.update = async (req, res, next) => {
  try {
    const { name, phone, college, degree, branch, cgpa, graduationYear, skills, interests, preferredLocations, languages, linkedin, github, portfolio } = req.body;

    let completion = 20;
    if (phone) completion += 5;
    if (college && degree) completion += 15;
    if (cgpa) completion += 10;
    if (graduationYear) completion += 5;
    if (skills && skills.length > 0) completion += 15;
    if (interests && interests.length > 0) completion += 10;
    if (preferredLocations && preferredLocations.length > 0) completion += 5;
    if (languages && languages.length > 0) completion += 5;
    if (linkedin || github || portfolio) completion += 10;
    completion = Math.min(100, completion);

    const updateData = { profileCompleted: completion };
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (college !== undefined) updateData.college = college;
    if (degree !== undefined) updateData.degree = degree;
    if (branch !== undefined) updateData.branch = branch;
    if (cgpa !== undefined) updateData.cgpa = Number(cgpa);
    if (graduationYear !== undefined) updateData.graduationYear = Number(graduationYear);
    if (skills !== undefined) updateData.skills = skills;
    if (interests !== undefined) updateData.interests = interests;
    if (preferredLocations !== undefined) updateData.preferredLocations = preferredLocations;
    if (languages !== undefined) updateData.languages = languages;
    if (linkedin !== undefined) updateData.linkedin = linkedin;
    if (github !== undefined) updateData.github = github;
    if (portfolio !== undefined) updateData.portfolio = portfolio;

    const updated = await User.findByIdAndUpdate(req.user.id, updateData, { new: true }).lean();
    return res.json({ user: sanitizeUser(updated) });
  } catch (err) { next(err); }
};
