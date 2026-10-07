const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

function safeUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

async function registerUser(req, res) {
  const { name, email, password } = req.body;
  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    return res.status(409).json({ message: "An account with this email already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
  });

  return res.status(201).json({
    message: "User registered successfully",
    user: safeUser(user),
  });
}

async function loginUser(req, res) {
  const email = req.body.email.toLowerCase().trim();
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  if (!process.env.JWT_SECRET) {
    const error = new Error("Server configuration error");
    error.statusCode = 500;
    throw error;
  }

  const token = jwt.sign(
    { userId: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  return res.status(200).json({ token, user: safeUser(user) });
}

async function getProfile(req, res) {
  const user = await User.findById(req.user.userId);

  if (!user) {
    const error = new Error("Not found");
    error.statusCode = 404;
    throw error;
  }

  return res.status(200).json(safeUser(user));
}

module.exports = { registerUser, loginUser, getProfile };