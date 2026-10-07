const { validationResult } = require("express-validator");

function validateRequest(req, res, next) {
  const result = validationResult(req);

  if (!result.isEmpty()) {
    const errors = result.array().map(({ path, msg }) => ({ field: path, message: msg }));
    return res.status(400).json({ message: "Invalid input", errors });
  }

  return next();
}

module.exports = validateRequest;