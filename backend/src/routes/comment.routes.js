const express = require("express");
const router = express.Router();

const authenticateToken = require("../middlewares/auth.middleware");
const { requireCommentOwner } = require("../middlewares/ownership.middleware");
const commentController = require("../controllers/comment.controller");

// Membuat komentar pada artikel
router.post(
  "/articles/:articleId",
  authenticateToken,
  commentController.createComment,
);

// Melihat komentar pada artikel
router.get("/articles/:articleId", commentController.getComments);

// Mengubah komentar
router.put(
  "/:commentId",
  authenticateToken,
  requireCommentOwner,
  commentController.updateComment,
);

// Menghapus komentar
router.delete(
  "/:commentId",
  authenticateToken,
  requireCommentOwner,
  commentController.deleteComment,
);

module.exports = router;
