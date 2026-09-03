const router = require("express").Router();
const { getAll, getById, update, getMyCompany, updateMyCompany } = require("../controllers/companyController");
const { auth, requireRole } = require("../middleware/auth");
const auditLog = require("../middleware/auditLog");

router.get("/", getAll);
router.get("/mine", auth, requireRole("COMPANY", "ADMIN"), getMyCompany);
router.patch("/mine", auth, requireRole("COMPANY", "ADMIN"), auditLog("company_profile_update", "Company"), updateMyCompany);
router.get("/:id", getById);
router.patch("/", auth, requireRole("ADMIN"), auditLog("company_update", "Company"), update);

module.exports = router;
