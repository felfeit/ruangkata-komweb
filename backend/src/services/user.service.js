
const prisma = require("../config/prisma");

const {
    uploadImage,
    deleteImage,
} = require("./storage.service");

function createError(message, statusCode = 400) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

async function updateProfileImage(userId, file) {
    if (!file) {
        throw createError("Profile image is required");
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            profileImagePath: true,
        },
    });

    if (!user) {
        throw createError("User not found", 404);
    }

    // Upload gambar baru terlebih dahulu.
    const uploadedImage = await uploadImage(file, "profile", userId);

    let updatedUser;

    try {
        updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                profileImagePath: uploadedImage.path,
            },
            select: {
                id: true,
                name: true,
                username: true,
                profileImagePath: true,
                updatedAt: true,
            },
        });
    } catch (error) {
        // Hapus gambar baru jika update database gagal.
        try {
            await deleteImage(uploadedImage.path, "profile", userId);
        } catch (cleanupError) {
            console.error("Failed to clean up uploaded profile image:", cleanupError);
        }

        throw error;
    }

    // Hapus gambar lama setelah database berhasil diperbarui.
    if (user.profileImagePath) {
        try {
            await deleteImage(user.profileImagePath, "profile", userId);
        } catch (error) {
            console.error("Failed to delete old profile image:", error);
        }
    }

    return {
        ...updatedUser,
        profileImageUrl: uploadedImage.url,
        imageSize: uploadedImage.size,
    };
}

async function deleteProfileImage(userId) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            profileImagePath: true,
        },
    });

    if (!user) {
        throw createError("User not found", 404);
    }

    if (!user.profileImagePath) {
        throw createError("Profile image not found", 404);
    }

    await prisma.user.update({
        where: { id: userId },
        data: {
            profileImagePath: null,
        },
    });

    try {
        await deleteImage(user.profileImagePath, "profile", userId);
    } catch (error) {
        console.error("Failed to delete profile image from storage:", error);
    }

    return {
        id: userId,
    };
}

module.exports = {
    updateProfileImage,
    deleteProfileImage,
};
