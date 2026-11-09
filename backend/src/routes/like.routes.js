const express = require("express");
const router = express.Router();

const authenticateToken = require("../middlewares/auth.middleware");
const likeController = require("../controllers/like.controller");

// Memberikan like pada artikel
router.post(
    "/articles/:articleId",
    authenticateToken,
    likeController.createLike,
);

// Menghapus like dari artikel
router.delete(
    "/articles/:articleId",
    authenticateToken,
    likeController.deleteLike,
);

// Mengecek status like pengguna
router.get(
    "/articles/:articleId/me",
    authenticateToken,
    likeController.getLikeStatus,
);

// Melihat jumlah like artikel
router.get(
    "/articles/:articleId",
    likeController.getLikeCount,
);

module.exports = router;