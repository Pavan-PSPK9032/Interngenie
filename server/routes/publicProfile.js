const router = require("express").Router();
const { getPublicProfile } = require("../controllers/profileController");

router.get("/:userId", getPublicProfile);

module.exports = router;
