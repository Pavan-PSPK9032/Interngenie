const router = require("express").Router();
const { checkATS, getATSHistory } = require("../controllers/atsController");

router.post("/check", checkATS);
router.get("/history", getATSHistory);

module.exports = router;
