const authService = require("../services/auth.service");

const isProduction = process.env.NODE_ENV === "production";

const refreshCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
  path: "/api/v1/auth",
  maxAge: 14 * 24 * 60 * 60 * 1000,
};

function setRefreshCookie(res, token) {
  res.cookie("refreshToken", token, refreshCookieOptions);
}

function clearRefreshCookie(res) {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/api/v1/auth",
  });
}

// POST /api/v1/auth/register
async function register(req, res, next) {
  try {
    const result = await authService.register(req.body);

    setRefreshCookie(res, result.refreshToken);

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/v1/auth/login
async function login(req, res, next) {
  try {
    const { identifier, password } = req.body || {};

    const result = await authService.login(identifier, password);

    setRefreshCookie(res, result.refreshToken);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/v1/auth/refresh
async function refresh(req, res, next) {
  try {
    const refreshToken = req.cookies?.refreshToken;

    const result = await authService.refresh(refreshToken);

    setRefreshCookie(res, result.refreshToken);

    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/v1/auth/logout
async function logout(req, res, next) {
  try {
    const refreshToken = req.cookies?.refreshToken;

    await authService.logout(refreshToken);

    clearRefreshCookie(res);

    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  refresh,
  logout,
};
