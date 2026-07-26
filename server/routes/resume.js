const router = require("express").Router();
const { parseResume } = require("../controllers/recommendationController");

router.post("/parse", parseResume);

module.exports = router;
