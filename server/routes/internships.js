const router = require("express").Router();
const { getAll, getById, create, getMyInternships, updateMyInternship, deleteMyInternship } = require("../controllers/internshipController");
const { auth, requireRole } = require("../middleware/auth");
const auditLog = require("../middleware/auditLog");

router.get("/", getAll);
router.get("/mine", auth, requireRole("COMPANY"), getMyInternships);
router.patch("/mine/:id", auth, requireRole("COMPANY"), auditLog("internship_update", "Internship"), updateMyInternship);
router.delete("/mine/:id", auth, requireRole("COMPANY"), auditLog("internship_delete", "Internship"), deleteMyInternship);
router.get("/:id", getById);
router.post("/", auth, requireRole("COMPANY"), create);

module.exports = router;
