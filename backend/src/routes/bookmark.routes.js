
const express = require("express");
const router = express.Router();

const authenticateToken = require("../middlewares/auth.middleware");
const bookmarkController = require("../controllers/bookmark.controller");

// Mengambil daftar bookmark pengguna
router.get(
    "/my",
    authenticateToken,
    bookmarkController.getMyBookmarks,
);

// Menyimpan artikel ke bookmark
router.post(
    "/articles/:articleId",
    authenticateToken,
    bookmarkController.createBookmark,
);

// Menghapus bookmark artikel
router.delete(
    "/articles/:articleId",
    authenticateToken,
    bookmarkController.deleteBookmark,
);

// Memeriksa status bookmark pengguna
router.get(
    "/articles/:articleId",
    authenticateToken,
    bookmarkController.checkBookmarkStatus,
);

module.exports = router;
