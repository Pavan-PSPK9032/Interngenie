const router = require("express").Router();
const { getAll, markRead } = require("../controllers/notificationController");

router.get("/", getAll);
router.patch("/", markRead);

module.exports = router;
