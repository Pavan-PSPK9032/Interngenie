const router = require("express").Router();
const { getSkillGap } = require("../controllers/recommendationController");
router.get("/", getSkillGap);
module.exports = router;
