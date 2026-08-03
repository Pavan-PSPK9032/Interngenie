const router = require("express").Router();
const { login, register, forgotPassword, resetPassword, verifyEmail, googleLogin, registerWithResume } = require("../controllers/authController");

router.post("/login", login);
router.post("/register", register);
router.post("/register/resume", registerWithResume);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/verify-email/:token", verifyEmail);
router.post("/google-login", googleLogin);

module.exports = router;
