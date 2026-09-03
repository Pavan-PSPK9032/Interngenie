const router = require("express").Router();
const { getAll, apply, update } = require("../controllers/applicationController");
const { auth, requireRole } = require("../middleware/auth");
const auditLog = require("../middleware/auditLog");

router.get("/", auth, getAll);
router.post("/", auth, requireRole("STUDENT"), apply);
router.patch("/:id", auth, requireRole("COMPANY", "ADMIN"), auditLog("application_update", "Application"), update);

module.exports = router;
