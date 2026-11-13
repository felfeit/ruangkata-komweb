
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

// Menyimpan artikel ke bookmark
async function createBookmark(userId, articleId) {
    await validatePublishedArticle(articleId);

    try {
        return await prisma.bookmark.create({
            data: {
                userId,
                articleId,
            },
        });
    } catch (error) {
        // Mencegah bookmark duplikat
        if (error.code === "P2002") {
            throw createError("You have already bookmarked this article", 409);
        }

        throw error;
    }
}

// Menghapus bookmark artikel
async function deleteBookmark(userId, articleId) {
    await validatePublishedArticle(articleId);

    await prisma.bookmark.deleteMany({
        where: {
            userId,
            articleId,
        },
    });

    return {
        articleId,
        isBookmarked: false,
    };
}

// Mengambil daftar bookmark milik pengguna
async function getMyBookmarks(userId, query = {}) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;

    if (
        !Number.isInteger(page) ||
        !Number.isInteger(limit) ||
        page < 1 ||
        limit < 1 ||
        limit > 50
    ) {
        throw createError("Invalid pagination parameters");
    }

    const skip = (page - 1) * limit;

    const [bookmarks, total] = await prisma.$transaction([
        prisma.bookmark.findMany({
            where: {
                userId,
                article: {
                    status: "PUBLISHED",
                },
            },
            include: {
                article: {
                    include: {
                        author: {
                            select: {
                                id: true,
                                name: true,
                                username: true,
                            },
                        },
                        category: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
            skip,
            take: limit,
        }),
        prisma.bookmark.count({
            where: {
                userId,
                article: {
                    status: "PUBLISHED",
                },
            },
        }),
    ]);

    return {
        bookmarks,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}

// Memeriksa status bookmark pengguna
async function checkBookmarkStatus(userId, articleId) {
    await validatePublishedArticle(articleId);

    const bookmark = await prisma.bookmark.findUnique({
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
        isBookmarked: Boolean(bookmark),
    };
}

module.exports = {
    createBookmark,
    deleteBookmark,
    getMyBookmarks,
    checkBookmarkStatus,
};
