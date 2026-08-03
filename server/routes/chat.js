const router = require("express").Router();
const {
  chat,
  analyzeResumeContext,
  generateCertRecommendations,
} = require("../controllers/chatController");

router.post("/", chat);
router.get("/resume-context", analyzeResumeContext);
router.get("/cert-recommendations", generateCertRecommendations);

module.exports = router;
