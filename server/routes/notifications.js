const router = require("express").Router();
const { getAll, markRead, markAllRead } = require("../controllers/notificationController");

router.get("/", getAll);
router.patch("/", markRead);
router.patch("/mark-all-read", markAllRead);

module.exports = router;
