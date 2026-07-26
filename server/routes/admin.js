const router = require("express").Router();
const { getStats, getUsers, deleteUser } = require("../controllers/adminController");

router.get("/stats", getStats);
router.get("/users", getUsers);
router.delete("/users", deleteUser);

module.exports = router;
