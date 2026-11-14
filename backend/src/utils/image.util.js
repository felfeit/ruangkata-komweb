
const sharp = require("sharp");

const MAX_IMAGE_SIZE = 1 * 1024 * 1024; // 1 MB

const IMAGE_CONFIG = {
    profile: {
        width: 512,
        height: 512,
    },
    article: {
        width: 1600,
        height: 1200,
    },
};

const ALLOWED_FORMATS = ["jpeg", "png", "webp"];

const processImage = async (buffer, type) => {
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
        throw new Error("Invalid image file");
    }

    const config = IMAGE_CONFIG[type];

    if (!config) {
        throw new Error("Invalid image type");
    }

    let metadata;

    try {
        metadata = await sharp(buffer).metadata();
    } catch {
        throw new Error("Invalid or corrupted image file");
    }

    if (!ALLOWED_FORMATS.includes(metadata.format)) {
        throw new Error("Only JPEG, PNG, and WebP images are allowed");
    }

    if (!metadata.width || !metadata.height) {
        throw new Error("Invalid image dimensions");
    }

    let quality = 80;

    while (quality >= 30) {
        const processedBuffer = await sharp(buffer)
            .rotate()
            .resize({
                width: config.width,
                height: config.height,
                fit: "inside",
                withoutEnlargement: true,
            })
            .webp({ quality, effort: 5 })
            .toBuffer();

        if (processedBuffer.length <= MAX_IMAGE_SIZE) {
            return {
                buffer: processedBuffer,
                mimetype: "image/webp",
                size: processedBuffer.length,
                extension: "webp",
            };
        }

        quality -= 10;
    }

    throw new Error("Image cannot be compressed to 1 MB or less");
};

module.exports = {
    processImage,
    MAX_IMAGE_SIZE,
    IMAGE_CONFIG,
};
