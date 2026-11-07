const prisma = require("../config/prisma");

async function requireArticleOwner(req, res, next) {
  try {
    const article = await prisma.article.findFirst({
      where: {
        id: req.params.articleId,
        userId: req.user.id,
      },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found",
      });
    }

    req.article = article;
    next();
  } catch (error) {
    next(error);
  }
}

async function requireCommentOwner(req, res, next) {
  try {
    const comment = await prisma.comment.findFirst({
      where: {
        id: req.params.commentId,
        userId: req.user.id,
      },
      select: {
        id: true,
        userId: true,
        articleId: true,
      },
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    req.comment = comment;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  requireArticleOwner,
  requireCommentOwner,
};
