
const userService = require("../services/user.service");

async function updateProfileImage(req, res, next) {
    try {
        const user = await userService.updateProfileImage(
            req.user.id,
            req.file,
        );

        return res.status(200).json({
            success: true,
            message: "Profile image updated successfully",
            data: user,
        });
    } catch (error) {
        next(error);
    }
}

async function deleteProfileImage(req, res, next) {
    try {
        const result = await userService.deleteProfileImage(req.user.id);

        return res.status(200).json({
            success: true,
            message: "Profile image deleted successfully",
            data: result,
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    updateProfileImage,
    deleteProfileImage,
};
