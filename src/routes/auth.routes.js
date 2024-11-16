const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");

// POST /api/auth/login: Login with email or phoneNo
router.post("/register", authController.register);
router.get("/verify-email/:verificationToken", authController.verifyEmail);
router.post("/login", authController.login);

module.exports = router;
