const prisma = require("../config/prisma");

function createError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

// Mengubah judul menjadi URL-friendly slug
function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Memastikan slug belum digunakan
async function generateUniqueSlug(title) {
  const baseSlug = slugify(title) || "artikel";
  let slug = baseSlug;
  let counter = 1;

  while (await prisma.article.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

async function createArticle(userId, data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw createError("Invalid request body");
  }

  const { title, contentMarkdown, categoryId, status } = data;

  if (typeof title !== "string" || typeof contentMarkdown !== "string") {
    throw createError("Title and content are required");
  }

  const normalizedTitle = title.trim();
  const normalizedContent = contentMarkdown.trim();

  if (!normalizedTitle || !normalizedContent) {
    throw createError("Title and content are required");
  }

  if (normalizedTitle.length > 255) {
    throw createError("Title must not exceed 255 characters");
  }

  const articleStatus = status || "DRAFT";

  if (!["DRAFT", "PUBLISHED"].includes(articleStatus)) {
    throw createError("Invalid article status");
  }

  if (categoryId !== undefined && categoryId !== null) {
    if (typeof categoryId !== "string") {
      throw createError("Invalid category ID");
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });

    if (!category) {
      throw createError("Category not found", 404);
    }
  }

  const slug = await generateUniqueSlug(normalizedTitle);

  try {
    const article = await prisma.article.create({
      data: {
        userId,
        categoryId: categoryId || null,
        title: normalizedTitle,
        slug,
        contentMarkdown: normalizedContent,
        status: articleStatus,
        publishedAt: articleStatus === "PUBLISHED" ? new Date() : null,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return article;
  } catch (error) {
    if (error.code === "P2002") {
      throw createError("Article slug already exists", 409);
    }

    throw error;
  }
}

function parsePagination(query = {}) {
  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? 10);

  if (!Number.isInteger(page) || page < 1) {
    throw createError("Page must be a positive integer");
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    throw createError("Limit must be between 1 and 50");
  }

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}

async function getPublishedArticles(query = {}) {
  const { page, limit, skip } = parsePagination(query);

  const where = {
    status: "PUBLISHED",
  };

  if (query.search !== undefined) {
    if (typeof query.search !== "string") {
      throw createError("Invalid search parameter");
    }

    const search = query.search.trim();

    if (search.length > 100) {
      throw createError("Search must not exceed 100 characters");
    }

    if (search) {
      where.title = {
        contains: search,
        mode: "insensitive",
      };
    }
  }

  const [articles, total] = await prisma.$transaction([
    prisma.article.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      skip,
      take: limit,
    }),
    prisma.article.count({ where }),
  ]);

  return {
    articles,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

async function getPublishedArticle(identifier) {
  if (typeof identifier !== "string" || !identifier.trim()) {
    throw createError("Article identifier is required");
  }

  const conditions = [{ slug: identifier }];

  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      identifier,
    );

  if (isUuid) {
    conditions.push({ id: identifier });
  }

  const article = await prisma.article.findFirst({
    where: {
      status: "PUBLISHED",
      OR: conditions,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          username: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  if (!article) {
    throw createError("Article not found", 404);
  }

  return article;
}

async function getMyArticles(userId, query = {}) {
  const { page, limit, skip } = parsePagination(query);

  const where = {
    userId,
  };

  if (query.status !== undefined) {
    if (!["DRAFT", "PUBLISHED"].includes(query.status)) {
      throw createError("Invalid article status");
    }

    where.status = query.status;
  }

  const [articles, total] = await prisma.$transaction([
    prisma.article.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      skip,
      take: limit,
    }),
    prisma.article.count({ where }),
  ]);

  return {
    articles,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

async function updateArticle(articleId, userId, data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw createError("Invalid request body");
  }

  const { title, contentMarkdown, categoryId, status } = data;

  const existingArticle = await prisma.article.findFirst({
    where: {
      id: articleId,
      userId,
    },
    select: {
      id: true,
      status: true,
      publishedAt: true,
    },
  });

  if (!existingArticle) {
    throw createError("Article not found", 404);
  }

  const updateData = {};

  if (title !== undefined) {
    if (typeof title !== "string" || !title.trim()) {
      throw createError("Title cannot be empty");
    }

    if (title.trim().length > 255) {
      throw createError("Title must not exceed 255 characters");
    }

    updateData.title = title.trim();
  }

  if (contentMarkdown !== undefined) {
    if (typeof contentMarkdown !== "string" || !contentMarkdown.trim()) {
      throw createError("Content cannot be empty");
    }

    updateData.contentMarkdown = contentMarkdown.trim();
  }

  if (categoryId !== undefined) {
    if (categoryId === null) {
      updateData.categoryId = null;
    } else {
      if (typeof categoryId !== "string") {
        throw createError("Invalid category ID");
      }

      const category = await prisma.category.findUnique({
        where: { id: categoryId },
        select: { id: true },
      });

      if (!category) {
        throw createError("Category not found", 404);
      }

      updateData.categoryId = categoryId;
    }
  }

  if (status !== undefined) {
    if (!["DRAFT", "PUBLISHED"].includes(status)) {
      throw createError("Invalid article status");
    }

    updateData.status = status;
  }

  // Mengatur tanggal publikasi berdasarkan perubahan status
  const nextStatus = updateData.status ?? existingArticle.status;

  if (nextStatus === "PUBLISHED" && existingArticle.status === "DRAFT") {
    updateData.publishedAt = new Date();
  }

  if (nextStatus === "DRAFT" && existingArticle.status === "PUBLISHED") {
    updateData.publishedAt = null;
  }

  try {
    return await prisma.article.update({
      where: {
        id: articleId,
      },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  } catch (error) {
    if (error.code === "P2025") {
      throw createError("Article not found", 404);
    }

    throw error;
  }
}

async function deleteArticle(articleId, userId) {
  const result = await prisma.article.deleteMany({
    where: {
      id: articleId,
      userId,
    },
  });

  if (result.count === 0) {
    throw createError("Article not found", 404);
  }

  return {
    id: articleId,
  };
}

module.exports = {
  createArticle,
  getPublishedArticles,
  getPublishedArticle,
  getMyArticles,
  updateArticle,
  deleteArticle,
};
