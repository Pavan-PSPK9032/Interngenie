const router = require("express").Router();
const { getPublicProfile, getProfileByUsername } = require("../controllers/profileController");

router.get("/username/:username", getProfileByUsername);
router.get("/:userId", getPublicProfile);

module.exports = router;
