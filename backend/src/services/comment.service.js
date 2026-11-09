const prisma = require("../config/prisma");

function createError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function createComment(userId, articleId, data) {
  // Validasi request body
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw createError("Invalid request body");
  }

  const { content } = data;

  if (typeof content !== "string" || !content.trim()) {
    throw createError("Comment content cannot be empty");
  }

  if (content.trim().length > 5000) {
    throw createError("Comment must not exceed 5000 characters");
  }

  // Pastikan artikel tersedia dan sudah dipublikasikan
  const article = await prisma.article.findFirst({
    where: {
      id: articleId,
      status: "PUBLISHED",
    },
    select: {
      id: true,
      title: true,
      slug: true,
    },
  });

  if (!article) {
    throw createError("Article not found", 404);
  }

  // Simpan komentar
  const comment = await prisma.comment.create({
    data: {
      userId,
      articleId,
      content: content.trim(),
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          username: true,
        },
      },
      article: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
    },
  });

  return comment;
}

async function getComments(articleId, query = {}) {
  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? 10);

  if (!Number.isInteger(page) || page < 1) {
    throw createError("Page must be a positive integer");
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    throw createError("Limit must be between 1 and 50");
  }

  // Pastikan artikel tersedia dan sudah dipublikasikan
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

  const skip = (page - 1) * limit;

  // Ambil komentar dan jumlah keseluruhan
  const [comments, total] = await prisma.$transaction([
    prisma.comment.findMany({
      where: {
        articleId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    }),

    prisma.comment.count({
      where: {
        articleId,
      },
    }),
  ]);

  return {
    comments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

async function updateComment(commentId, userId, data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw createError("Invalid request body");
  }

  const { content } = data;

  if (typeof content !== "string" || !content.trim()) {
    throw createError("Comment content cannot be empty");
  }

  if (content.trim().length > 5000) {
    throw createError("Comment must not exceed 5000 characters");
  }

  // Cari komentar milik pengguna
  const comment = await prisma.comment.findFirst({
    where: {
      id: commentId,
      userId,
    },
    select: {
      id: true,
      createdAt: true,
    },
  });

  if (!comment) {
    throw createError("Comment not found", 404);
  }

  // Batas waktu edit: 15 menit
  const EDIT_LIMIT = 15 * 60 * 1000;
  const elapsedTime = Date.now() - comment.createdAt.getTime();

  if (elapsedTime > EDIT_LIMIT) {
    throw createError("Comment can only be edited within 15 minutes", 403);
  }

  // Update komentar
  return await prisma.comment.update({
    where: {
      id: commentId,
    },
    data: {
      content: content.trim(),
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          username: true,
        },
      },
    },
  });
}

async function deleteComment(commentId, userId) {
  const result = await prisma.comment.deleteMany({
    where: {
      id: commentId,
      userId,
    },
  });

  if (result.count === 0) {
    throw createError("Comment not found", 404);
  }

  return {
    id: commentId,
  };
}

module.exports = {
  createComment,
  getComments,
  updateComment,
  deleteComment,
};
