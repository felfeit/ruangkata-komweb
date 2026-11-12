
const likeService = require("../services/like.service");

// Memberikan like pada artikel
async function createLike(req, res, next) {
    try {
        const result = await likeService.createLike(
            req.user.id,
            req.params.articleId,
        );

        return res.status(201).json({
            success: true,
            message: "Article liked successfully",
            data: result,
        });
    } catch (error) {
        next(error);
    }
}

// Menghapus like dari artikel
async function deleteLike(req, res, next) {
    try {
        const result = await likeService.deleteLike(
            req.user.id,
            req.params.articleId,
        );

        return res.status(200).json({
            success: true,
            message: "Article unliked successfully",
            data: result,
        });
    } catch (error) {
        next(error);
    }
}

// Melihat jumlah like artikel
async function getLikeCount(req, res, next) {
    try {
        const result = await likeService.getLikeCount(
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

// Mengecek status like pengguna
async function getLikeStatus(req, res, next) {
    try {
        const result = await likeService.getLikeStatus(
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
    createLike,
    deleteLike,
    getLikeCount,
    getLikeStatus,
};
