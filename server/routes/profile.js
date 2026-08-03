const router = require("express").Router();
const {
  getPublicProfile,
  getProfileByUsername,
  getMyProfile,
  getProfileStats,
  registerProfileView,
  followUser,
  unfollowUser,
  getFollowStatus,
  getFollowers,
  getFollowing,
  updatePrivacySettings,
  getProfileCompleteness,
  updateProfile,
} = require("../controllers/profileController");

router.get("/me", getMyProfile);
router.get("/stats", getProfileStats);
router.get("/by-username/:username", getProfileByUsername);
router.get("/followers", getFollowers);
router.get("/following", getFollowing);
router.get("/follow/status/:userId", getFollowStatus);
router.post("/follow/:userId", followUser);
router.delete("/follow/:userId", unfollowUser);
router.post("/view/:userId", registerProfileView);
router.patch("/", updateProfile);
router.patch("/privacy", updatePrivacySettings);
router.get("/completeness", getProfileCompleteness);
router.get("/public/:userId", getPublicProfile);

module.exports = router;
