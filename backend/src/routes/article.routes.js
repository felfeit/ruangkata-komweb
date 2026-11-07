const express = require("express");
const router = express.Router();

const authenticateToken = require("../middlewares/auth.middleware");

const { requireArticleOwner } = require("../middlewares/ownership.middleware");

// Contoh route edit artikel
router.put(
  "/:articleId",
  authenticateToken,
  requireArticleOwner,
  (req, res) => {
    res.json({
      success: true,
      message: "Ownership verified. Ready to update article.",
      articleId: req.article.id,
    });
  },
);

// Contoh route hapus artikel
router.delete(
  "/:articleId",
  authenticateToken,
  requireArticleOwner,
  (req, res) => {
    res.json({
      success: true,
      message: "Ownership verified. Ready to delete article.",
      articleId: req.article.id,
    });
  },
);

module.exports = router;
