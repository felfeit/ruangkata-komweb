const articleService = require("../services/article.service");

async function createArticle(req, res, next) {
  try {
    const article = await articleService.createArticle(req.user.id, req.body);

    return res.status(201).json({
      success: true,
      message: "Article created successfully",
      data: article,
    });
  } catch (error) {
    next(error);
  }
}

async function getPublishedArticles(req, res, next) {
  try {
    const result = await articleService.getPublishedArticles(req.query);

    return res.status(200).json({
      success: true,
      data: result.articles,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

async function getPublishedArticle(req, res, next) {
  try {
    const article = await articleService.getPublishedArticle(
      req.params.articleId,
    );

    return res.status(200).json({
      success: true,
      data: article,
    });
  } catch (error) {
    next(error);
  }
}

async function getMyArticles(req, res, next) {
  try {
    const result = await articleService.getMyArticles(req.user.id, req.query);

    return res.status(200).json({
      success: true,
      data: result.articles,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

async function updateArticle(req, res, next) {
  try {
    const article = await articleService.updateArticle(
      req.params.articleId,
      req.user.id,
      req.body,
    );

    return res.status(200).json({
      success: true,
      message: "Article updated successfully",
      data: article,
    });
  } catch (error) {
    next(error);
  }
}

async function deleteArticle(req, res, next) {
  try {
    const result = await articleService.deleteArticle(
      req.params.articleId,
      req.user.id,
    );

    return res.status(200).json({
      success: true,
      message: "Article deleted successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

async function updateCoverImage(req, res, next) {
  try {
    const article = await articleService.updateCoverImage(
      req.params.articleId,
      req.user.id,
      req.file,
    );

    return res.status(200).json({
      success: true,
      message: "Article cover image updated successfully",
      data: article,
    });
  } catch (error) {
    next(error);
  }
}

async function deleteCoverImage(req, res, next) {
  try {
    const result = await articleService.deleteCoverImage(
      req.params.articleId,
      req.user.id,
    );

    return res.status(200).json({
      success: true,
      message: "Article cover image deleted successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createArticle,
  getPublishedArticles,
  getPublishedArticle,
  getMyArticles,
  updateArticle,
  deleteArticle,
  updateCoverImage,
  deleteCoverImage,
};
