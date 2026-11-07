const express = require("express");
const router = express.Router();

const authenticateToken = require("../middlewares/auth.middleware");

const { requireCommentOwner } = require("../middlewares/ownership.middleware");

router.delete(
  "/:commentId",
  authenticateToken,
  requireCommentOwner,
  (req, res) => {
    res.json({
      success: true,
      message: "Ownership verified. Ready to delete comment.",
      commentId: req.comment.id,
    });
  },
);

module.exports = router;
