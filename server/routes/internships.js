const router = require("express").Router();
const { getAll, getById, create } = require("../controllers/internshipController");
const { auth, requireRole } = require("../middleware/auth");

router.get("/", getAll);
router.get("/:id", getById);
router.post("/", auth, requireRole("COMPANY"), create);

module.exports = router;
