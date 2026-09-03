const router = require("express").Router();
const { getAll, getById, update } = require("../controllers/companyController");
const { auth, requireRole } = require("../middleware/auth");
const auditLog = require("../middleware/auditLog");

router.get("/", getAll);
router.get("/:id", getById);
router.patch("/", auth, requireRole("ADMIN"), auditLog("company_update", "Company"), update);

module.exports = router;
