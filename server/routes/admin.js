const router = require("express").Router();
const {
  getStats, getUsers, deleteUser, getAuditLogs, getAIDashboard,
  getInternships, updateInternship, deleteInternship,
  getAllCompaniesAdmin, deleteCompany,
} = require("../controllers/adminController");
const auditLog = require("../middleware/auditLog");

router.get("/stats", getStats);
router.get("/users", getUsers);
router.delete("/users", auditLog("delete_user", "User"), deleteUser);
router.get("/audit-logs", getAuditLogs);
router.get("/ai-dashboard", getAIDashboard);

// Internship management (approval workflow)
router.get("/internships", getInternships);
router.patch("/internships/:id", auditLog("internship", "Internship"), updateInternship);
router.delete("/internships/:id", auditLog("internship", "Internship"), deleteInternship);

// Company management
router.get("/companies", getAllCompaniesAdmin);
router.delete("/companies/:id", auditLog("delete_company", "Company"), deleteCompany);

module.exports = router;
