const router = require("express").Router();
const { getStats, getUsers, deleteUser, getAuditLogs, getAIDashboard } = require("../controllers/adminController");

router.get("/stats", getStats);
router.get("/users", getUsers);
router.delete("/users", deleteUser);
router.get("/audit-logs", getAuditLogs);
router.get("/ai-dashboard", getAIDashboard);

module.exports = router;
