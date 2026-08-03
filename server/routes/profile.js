const router = require("express").Router();
const {
  getPublicProfile,
  updatePrivacySettings,
  getProfileCompleteness,
  updateProfile,
} = require("../controllers/profileController");

router.patch("/", updateProfile);
router.patch("/privacy", updatePrivacySettings);
router.get("/completeness", getProfileCompleteness);
router.get("/public/:userId", getPublicProfile);

module.exports = router;
