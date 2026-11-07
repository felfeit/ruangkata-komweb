const { randomUUID } = require("crypto");
const { supabase, storageBucket } = require("../config/supabase");

const MIME_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

async function uploadImage(file, userId) {
  if (!file) {
    throw new Error("Image file is required");
  }

  const extension = MIME_TYPES[file.mimetype];

  if (!extension) {
    throw new Error("Unsupported image format");
  }

  const filePath = `users/${userId}/${randomUUID()}.${extension}`;

  const { data, error } = await supabase.storage
    .from(storageBucket)
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) {
    throw new Error(`Image upload failed: ${error.message}`);
  }

  const { data: publicData } = supabase.storage
    .from(storageBucket)
    .getPublicUrl(data.path);

  return {
    path: data.path,
    url: publicData.publicUrl,
  };
}

async function deleteImage(filePath, userId) {
  if (!filePath) {
    throw new Error("Image path is required");
  }

  // Pastikan user hanya dapat menghapus gambar miliknya.
  const allowedPrefix = `users/${userId}/`;

  if (!filePath.startsWith(allowedPrefix)) {
    throw new Error("You are not allowed to delete this image");
  }

  const { error } = await supabase.storage
    .from(storageBucket)
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
