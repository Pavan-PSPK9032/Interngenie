const router = require("express").Router();
const { getCertificates } = require("../controllers/recommendationController");
router.get("/", getCertificates);
module.exports = router;
