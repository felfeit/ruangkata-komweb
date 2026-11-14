
const express = require("express");
const router = express.Router();

const userController = require("../controllers/user.controller");
const authenticateToken = require("../middlewares/auth.middleware");
const upload = require("../middlewares/upload.middleware");

// Upload or replace profile image
router.post(
    "/me/profile-image",
    authenticateToken,
    upload.single("image"),
    userController.updateProfileImage,
);

// Delete profile image
router.delete(
    "/me/profile-image",
    authenticateToken,
    userController.deleteProfileImage,
);

module.exports = router;
