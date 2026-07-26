const router = require("express").Router();
const { parseResume } = require("../controllers/recommendationController");
const { uploadAndParse, saveResumeData } = require("../controllers/resumeController");

router.post("/parse", parseResume);
router.post("/upload", uploadAndParse);
router.patch("/save", saveResumeData);

module.exports = router;
