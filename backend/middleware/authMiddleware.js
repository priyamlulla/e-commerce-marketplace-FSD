const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function authenticateToken(req, res, next) {
  const authorization = req.get("Authorization");
  const match = authorization && authorization.match(/^Bearer\s+(.+)$/i);
  const token = req.cookies?.shopsphere_session || (match && match[1]);

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  if (!process.env.JWT_SECRET) {
    const error = new Error("Server configuration error");
    error.statusCode = 500;
    return next(error);
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  if (!decoded.userId || !["user", "admin"].includes(decoded.role)) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  if (!/^[0-9a-f]{24}$/i.test(decoded.userId)) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  const user = await User.findById(decoded.userId).select("name email role");
  if (!user || user.role !== decoded.role) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  req.user = {
    userId: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  };
  return next();
}

function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    return next();
  };
}

module.exports = { authenticateToken, authorizeRoles };