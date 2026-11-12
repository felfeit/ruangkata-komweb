
const prisma = require("../config/prisma");

function createError(message, statusCode = 400) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

// Memastikan artikel tersedia dan sudah dipublikasikan
async function validatePublishedArticle(articleId) {
    const article = await prisma.article.findFirst({
        where: {
            id: articleId,
            status: "PUBLISHED",
        },
        select: {
            id: true,
        },
    });

    if (!article) {
        throw createError("Article not found", 404);
    }

    return article;
}

// Memberikan like pada artikel
async function createLike(userId, articleId) {
    await validatePublishedArticle(articleId);

    try {
        return await prisma.like.create({
            data: {
                userId,
                articleId,
            },
        });
    } catch (error) {
        // Mencegah like duplikat
        if (error.code === "P2002") {
            throw createError("You have already liked this article", 409);
        }

        throw error;
    }
}

// Menghapus like dari artikel
async function deleteLike(userId, articleId) {
    await validatePublishedArticle(articleId);

    await prisma.like.deleteMany({
        where: {
            userId,
            articleId,
        },
    });

    return {
        articleId,
        isLiked: false,
    };
}

// Mengambil jumlah like artikel
async function getLikeCount(articleId) {
    await validatePublishedArticle(articleId);

    const totalLikes = await prisma.like.count({
        where: {
            articleId,
        },
    });

    return {
        articleId,
        totalLikes,
    };
}

// Mengecek apakah user sudah menyukai artikel
async function getLikeStatus(userId, articleId) {
    await validatePublishedArticle(articleId);

    const like = await prisma.like.findUnique({
        where: {
            userId_articleId: {
                userId,
                articleId,
            },
        },
        select: {
            id: true,
        },
    });

    return {
        articleId,
        isLiked: Boolean(like),
    };
}

module.exports = {
    createLike,
    deleteLike,
    getLikeCount,
    getLikeStatus,
};
