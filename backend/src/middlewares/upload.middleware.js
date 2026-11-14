
const multer = require("multer");

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 10 * 1024 * 1024,
  },

  fileFilter: (req, file, callback) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.mimetype)) {
      const error = new Error(
        "Only JPEG, PNG, and WebP images are allowed",
      );
      error.statusCode = 400;

      return callback(error);
    }

    callback(null, true);
  },
});

module.exports = upload;
