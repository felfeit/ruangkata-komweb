const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || "15m";

const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "14d";

if (!ACCESS_SECRET || !REFRESH_SECRET) {
  throw new Error("JWT secrets are missing from environment variables");
}

// Generate access token
function generateAccessToken(userId) {
  return jwt.sign(
    {
      tokenType: "access",
    },
    ACCESS_SECRET,
    {
      subject: userId,
      expiresIn: ACCESS_EXPIRES_IN,
    },
  );
}

// Generate refresh token
function generateRefreshToken(userId) {
  return jwt.sign(
    {
      tokenType: "refresh",
    },
    REFRESH_SECRET,
    {
      subject: userId,
      expiresIn: REFRESH_EXPIRES_IN,
      jwtid: crypto.randomUUID(),
    },
  );
}

// Verify access token
function verifyAccessToken(token) {
  const decoded = jwt.verify(token, ACCESS_SECRET);

  if (decoded.tokenType !== "access") {
    throw new Error("Invalid access token");
  }

  return decoded;
}

// Verify refresh token
function verifyRefreshToken(token, options = {}) {
  const decoded = jwt.verify(token, REFRESH_SECRET, options);

  if (decoded.tokenType !== "refresh") {
    throw new Error("Invalid refresh token");
  }

  return decoded;
}

// Hash refresh token sebelum disimpan ke database
function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// Mendapatkan waktu kedaluwarsa dari JWT
function getTokenExpiration(decoded) {
  if (!decoded.exp) {
    throw new Error("Token expiration is missing");
  }

  return new Date(decoded.exp * 1000);
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
  getTokenExpiration,
};
