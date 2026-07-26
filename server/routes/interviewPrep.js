const router = require("express").Router();
const { generateQuestions, evaluateAnswer, getHistory } = require("../controllers/interviewPrepController");

router.post("/generate", generateQuestions);
router.post("/evaluate", evaluateAnswer);
router.get("/history", getHistory);

module.exports = router;
