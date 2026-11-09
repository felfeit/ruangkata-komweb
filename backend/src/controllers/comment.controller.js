const commentService = require("../services/comment.service");

async function createComment(req, res, next) {
  try {
    const comment = await commentService.createComment(
      req.user.id,
      req.params.articleId,
      req.body,
    );

    return res.status(201).json({
      success: true,
      message: "Comment created successfully",
      data: comment,
    });
  } catch (error) {
    next(error);
  }
}

async function getComments(req, res, next) {
  try {
    const result = await commentService.getComments(
      req.params.articleId,
      req.query,
    );

    return res.status(200).json({
      success: true,
      data: result.comments,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

async function updateComment(req, res, next) {
  try {
    const comment = await commentService.updateComment(
      req.params.commentId,
      req.user.id,
      req.body,
    );

    return res.status(200).json({
      success: true,
      message: "Comment updated successfully",
      data: comment,
    });
  } catch (error) {
    next(error);
  }
}

async function deleteComment(req, res, next) {
  try {
    const result = await commentService.deleteComment(
      req.params.commentId,
      req.user.id,
    );

    return res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createComment,
  getComments,
  updateComment,
  deleteComment,
};
