const router = require("express").Router();
const { getAll, apply, update } = require("../controllers/applicationController");
const { auth, requireRole } = require("../middleware/auth");

router.get("/", auth, getAll);
router.post("/", auth, requireRole("STUDENT"), apply);
router.patch("/:id", auth, requireRole("COMPANY", "ADMIN"), update);

module.exports = router;
