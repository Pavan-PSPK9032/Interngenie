const router = require("express").Router();
const { getRecommendations } = require("../controllers/recommendationController");
router.get("/", getRecommendations);
module.exports = router;
