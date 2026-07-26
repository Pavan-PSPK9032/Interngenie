const router = require("express").Router();
const { getAll, update } = require("../controllers/companyController");
const { auth, requireRole } = require("../middleware/auth");

router.get("/", getAll);
router.patch("/", auth, requireRole("ADMIN"), update);

module.exports = router;
