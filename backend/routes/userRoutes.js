const express = require("express");
const { body } = require("express-validator");
const { registerUser, loginUser, getProfile } = require("../controllers/userController");
const { authenticateToken, authorizeRoles } = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");

const router = express.Router();

router.post(
  "/register",
  [
    body("name").isString().withMessage("Name is required").bail().trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("A valid email is required").normalizeEmail(),
    body("password").isString().withMessage("Password is required").bail().isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  validateRequest,
  registerUser
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("A valid email is required").normalizeEmail(),
    body("password").isString().withMessage("Password is required").bail().notEmpty().withMessage("Password is required"),
  ],
  validateRequest,
  loginUser
);

router.get("/profile", authenticateToken, getProfile);

router.get("/dashboard", authenticateToken, (req, res) => {
  return res.status(200).json({
    message: "Dashboard access granted",
    user: req.user,
  });
});

router.get("/admin", authenticateToken, authorizeRoles("admin"), (req, res) => {
  return res.status(200).json({
    message: "Admin access granted",
    user: req.user,
  });
});

module.exports = router;