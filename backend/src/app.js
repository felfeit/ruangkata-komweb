const express = require("express");
const multer = require("multer");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/auth.routes");
const articleRoutes = require("./routes/article.routes");
const commentRoutes = require("./routes/comment.routes");
const likeRoutes = require("./routes/like.routes");
const bookmarkRoutes = require("./routes/bookmark.routes");
const userRoutes = require("./routes/user.routes");

const app = express();

// Parse JSON request body
app.use(express.json());

// Parse HTTP cookies
app.use(cookieParser());

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/articles", articleRoutes);
app.use("/api/v1/comments", commentRoutes);
app.use("/api/v1/likes", likeRoutes);
app.use("/api/v1/bookmarks", bookmarkRoutes);
app.use("/api/v1/users", userRoutes);

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

  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message:
        err.code === "LIMIT_FILE_SIZE"
          ? "Image file must not exceed 10 MB"
          : err.message,
    });
  }

  res.status(statusCode).json({
    success: false,
    message: statusCode >= 500 ? "Internal server error" : err.message,
  });
});

module.exports = app;
