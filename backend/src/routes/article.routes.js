const upload = require("../middlewares/upload.middleware");
const express = require("express");
const router = express.Router();

const authenticateToken = require("../middlewares/auth.middleware");
const articleController = require("../controllers/article.controller");
const { requireArticleOwner } = require("../middlewares/ownership.middleware");

// Artikel milik user (harus diletakkan sebelum /:articleId)
router.get("/my", authenticateToken, articleController.getMyArticles);

// Daftar artikel publik
router.get("/", articleController.getPublishedArticles);


// Membuat artikel
router.post("/", authenticateToken, articleController.createArticle);

// Detail artikel publik
router.get("/:articleId", articleController.getPublishedArticle);

// Update artikel (hanya bisa dilakukan oleh pemilik artikel)
router.put(
  "/:articleId",
  authenticateToken,
  requireArticleOwner,
  articleController.updateArticle,
);

// Delete artikel (hanya bisa dilakukan oleh pemilik artikel)
router.delete(
  "/:articleId",
  authenticateToken,
  requireArticleOwner,
  articleController.deleteArticle,
);

// Upload or replace article cover image
router.post(
  "/:articleId/cover-image",
  authenticateToken,
  requireArticleOwner,
  upload.single("image"),
  articleController.updateCoverImage,
);

// Delete article cover image
router.delete(
  "/:articleId/cover-image",
  authenticateToken,
  requireArticleOwner,
  articleController.deleteCoverImage,
);

module.exports = router;
