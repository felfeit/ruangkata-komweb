
const { randomUUID } = require("crypto");

const {
  supabase,
  articleImageBucket,
  profileImageBucket,
} = require("../config/supabase");

const { processImage } = require("../utils/image.util");

async function uploadImage(file, type, ownerId) {
  if (!file || !file.buffer) {
    throw new Error("Image file is required");
  }

  if (!["profile", "article"].includes(type)) {
    throw new Error("Invalid image type");
  }

  if (!ownerId) {
    throw new Error("Image owner ID is required");
  }

  const processedImage = await processImage(file.buffer, type);

  const bucket =
    type === "profile" ? profileImageBucket : articleImageBucket;

  const folder =
    type === "profile" ? `users/${ownerId}` : `articles/${ownerId}`;

  const filePath = `${folder}/${randomUUID()}.webp`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, processedImage.buffer, {
      contentType: processedImage.mimetype,
      upsert: false,
    });

  if (error) {
    throw new Error(`Image upload failed: ${error.message}`);
  }

  const { data: publicData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return {
    path: data.path,
    url: publicData.publicUrl,
    size: processedImage.size,
    mimetype: processedImage.mimetype,
  };
}

async function deleteImage(filePath, type, ownerId) {
  if (!filePath) {
    throw new Error("Image path is required");
  }

  if (!["profile", "article"].includes(type)) {
    throw new Error("Invalid image type");
  }

  if (!ownerId) {
    throw new Error("Image owner ID is required");
  }

  const bucket =
    type === "profile" ? profileImageBucket : articleImageBucket;

  const allowedPrefix =
    type === "profile" ? `users/${ownerId}/` : `articles/${ownerId}/`;

  if (!filePath.startsWith(allowedPrefix)) {
    throw new Error("You are not allowed to delete this image");
  }

  const { error } = await supabase.storage
    .from(bucket)
    .remove([filePath]);

  if (error) {
    throw new Error(`Image deletion failed: ${error.message}`);
  }

  return {
    message: "Image deleted successfully",
  };
}

module.exports = {
  uploadImage,
  deleteImage,
};
