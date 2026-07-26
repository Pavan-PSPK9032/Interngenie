const router = require("express").Router();
const { getCareers } = require("../controllers/recommendationController");
router.get("/", getCareers);
module.exports = router;
