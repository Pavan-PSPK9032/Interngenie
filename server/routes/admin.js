const router = require("express").Router();
const { getStats, getUsers, deleteUser, getAuditLogs } = require("../controllers/adminController");

router.get("/stats", getStats);
router.get("/users", getUsers);
router.delete("/users", deleteUser);
router.get("/audit-logs", getAuditLogs);

module.exports = router;
