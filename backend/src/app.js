const express = require("express");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/auth.routes");
const articleRoutes = require("./routes/article.routes");
const commentRoutes = require("./routes/comment.routes");

const app = express();

// Parse JSON request body
app.use(express.json());

// Parse HTTP cookies
app.use(cookieParser());

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/articles", articleRoutes);
app.use("/api/v1/comments", commentRoutes);

// Global error handler
// Global error handler
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  console.error(err);

  // Menangani JSON request yang formatnya tidak valid
  if (
    err instanceof SyntaxError &&
    (err.status === 400 || err.statusCode === 400) &&
    Object.prototype.hasOwnProperty.call(err, "body")
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON request body",
    });
  }

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: statusCode >= 500 ? "Internal server error" : err.message,
  });
});

module.exports = app;
