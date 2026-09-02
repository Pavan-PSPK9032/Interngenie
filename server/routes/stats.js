const router = require("express").Router();
const User = require("../models/User");
const Company = require("../models/Company");
const Internship = require("../models/Internship");
const Application = require("../models/Application");
const ATSReport = require("../models/ATSReport");

router.get("/", async (req, res, next) => {
  try {
    const [totalStudents, totalCompanies, totalInternships, totalApplications, totalResumes] = await Promise.all([
      User.countDocuments({ role: "STUDENT" }),
      Company.countDocuments(),
      Internship.countDocuments({ isActive: true }),
      Application.countDocuments(),
      ATSReport.countDocuments(),
    ]);
    return res.json({
      totals: {
        totalStudents,
        totalCompanies,
        totalInternships,
        totalApplications,
        totalResumes,
      },
    });
  } catch (err) { next(err); }
});

module.exports = router;
