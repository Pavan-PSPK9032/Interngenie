const router = require("express").Router();
const { generateCoverLetter } = require("../controllers/recommendationController");

router.post("/generate", generateCoverLetter);

module.exports = router;
