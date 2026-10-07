const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
  const authorization = req.get("Authorization");
  const match = authorization && authorization.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return res.status(401).json({ message: "Authentication required" });
  }

  if (!process.env.JWT_SECRET) {
    const error = new Error("Server configuration error");
    error.statusCode = 500;
    return next(error);
  }

  try {
    const decoded = jwt.verify(match[1], process.env.JWT_SECRET);

    if (!decoded.userId || !["user", "admin"].includes(decoded.role)) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    req.user = { userId: decoded.userId, role: decoded.role };
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
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