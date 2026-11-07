const prisma = require("../config/prisma");
const { verifyAccessToken } = require("../utils/token.util");

async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authentication token is required",
    });
  }

  const token = authHeader.slice(7).trim();

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication token is required",
    });
  }

  let decoded;

  // Verify JWT access token.
  try {
    decoded = verifyAccessToken(token);
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }

  try {
    // Make sure the user still exists.
    const user = await prisma.user.findUnique({
      where: {
        id: decoded.sub,
      },
      select: {
        id: true,
        username: true,
        email: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists",
      });
    }

    // Attach authenticated user to request.
    req.user = user;

    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = authenticateToken;
