
const bookmarkService = require("../services/bookmark.service");

// Menyimpan artikel ke bookmark
async function createBookmark(req, res, next) {
    try {
        const result = await bookmarkService.createBookmark(
            req.user.id,
            req.params.articleId,
        );

        return res.status(201).json({
            success: true,
            message: "Article bookmarked successfully",
            data: result,
        });
    } catch (error) {
        next(error);
    }
}

// Menghapus bookmark artikel
async function deleteBookmark(req, res, next) {
    try {
        const result = await bookmarkService.deleteBookmark(
            req.user.id,
            req.params.articleId,
        );

        return res.status(200).json({
            success: true,
            message: "Bookmark removed successfully",
            data: result,
        });
    } catch (error) {
        next(error);
    }
}

// Mengambil daftar bookmark pengguna
async function getMyBookmarks(req, res, next) {
    try {
        const result = await bookmarkService.getMyBookmarks(
            req.user.id,
            req.query,
        );

        return res.status(200).json({
            success: true,
            data: result.bookmarks,
            pagination: result.pagination,
        });
    } catch (error) {
        next(error);
    }
}

// Memeriksa status bookmark pengguna
async function checkBookmarkStatus(req, res, next) {
    try {
        const result = await bookmarkService.checkBookmarkStatus(
            req.user.id,
            req.params.articleId,
        );

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createBookmark,
    deleteBookmark,
    getMyBookmarks,
    checkBookmarkStatus,
};
