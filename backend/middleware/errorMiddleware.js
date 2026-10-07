function errorMiddleware(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  let statusCode = 500;

  if (error.type === "entity.parse.failed" || error.name === "ValidationError") {
    statusCode = 400;
  } else if (error.name === "CastError") {
    statusCode = 400;
  } else if (error.code === 11000) {
    statusCode = 409;
  } else if (error.type === "entity.too.large") {
    statusCode = 413;
  } else if ([400, 401, 403, 404, 409, 413, 429].includes(error.statusCode)) {
    statusCode = error.statusCode;
  }

  const messages = {
    400: "Invalid request",
    401: "Authentication required",
    403: "Forbidden",
    404: "Resource not found",
    409: "A resource with these details already exists",
    413: "Request body too large",
    429: "Too many requests",
    500: "Internal server error",
  };

  if (statusCode === 500) {
    console.error("Unhandled API error");
  }

  return res.status(statusCode).json({ message: messages[statusCode] });
}

module.exports = errorMiddleware;