const router = require("express").Router();
const { update } = require("../controllers/profileController");

router.patch("/", update);

module.exports = router;
