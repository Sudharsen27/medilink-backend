const AppError = require("../utils/AppError");

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.code = err.code || "SERVER_ERROR";

  // Log for backend visibility
  console.error("🔥 ERROR:", err);

  if (process.env.NODE_ENV === "production") {
    if (!err.isOperational) {
      return res.status(500).json({
        success: false,
        message: "Something went wrong",
        code: "INTERNAL_ERROR",
      });
    }
  }

  res.status(err.statusCode).json({
    success: false,
    message: err.message,
    code: err.code,
  });
};
