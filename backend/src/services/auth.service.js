const bcrypt = require("bcryptjs");
const prisma = require("../config/prisma");

const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
  getTokenExpiration,
} = require("../utils/token.util");

// Helper untuk membuat error HTTP
function createError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function validateRegisterInput(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw createError("Invalid request body");
  }

  const { name, username, email, password } = data;

  if (
    typeof name !== "string" ||
    typeof username !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string"
  ) {
    throw createError("All fields are required and must be strings");
  }

  const normalizedName = name.trim();
  const normalizedUsername = username.trim().toLowerCase();
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedName || !normalizedUsername || !normalizedEmail || !password) {
    throw createError("All fields are required");
  }

  if (normalizedName.length < 2 || normalizedName.length > 100) {
    throw createError("Name must be between 2 and 100 characters");
  }

  if (
    normalizedUsername.length < 3 ||
    normalizedUsername.length > 30 ||
    !/^[a-z0-9_]+$/.test(normalizedUsername)
  ) {
    throw createError(
      "Username must be 3-30 characters and contain only lowercase letters, numbers, and underscores",
    );
  }

  if (
    normalizedEmail.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
  ) {
    throw createError("Invalid email address");
  }

  if (password.length < 8) {
    throw createError("Password must be at least 8 characters");
  }

  if (Buffer.byteLength(password, "utf8") > 72) {
    throw createError("Password must not exceed 72 bytes");
  }

  return {
    name: normalizedName,
    username: normalizedUsername,
    email: normalizedEmail,
    password,
  };
}

function validateLoginInput(identifier, password) {
  if (
    typeof identifier !== "string" ||
    typeof password !== "string" ||
    !identifier.trim() ||
    !password
  ) {
    throw createError("Email/username and password are required");
  }

  if (identifier.trim().length > 254) {
    throw createError("Invalid credentials", 401);
  }

  if (Buffer.byteLength(password, "utf8") > 72) {
    throw createError("Invalid credentials", 401);
  }

  return {
    identifier: identifier.trim().toLowerCase(),
    password,
  };
}

// Data user yang aman untuk dikirim ke frontend
function formatUser(user) {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    bio: user.bio,
    avatarPath: user.avatarPath,
    createdAt: user.createdAt,
  };
}

// Membuat access token dan refresh token
async function issueTokens(tx, user) {
  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  const decoded = verifyRefreshToken(refreshToken);

  await tx.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: getTokenExpiration(decoded),
    },
  });

  return {
    accessToken,
    refreshToken,
  };
}

// REGISTER
async function register(data) {
  const validated = validateRegisterInput(data);

  // validated sudah berisi nilai yang sudah dinormalisasi
  const { name, username, email, password } = validated;

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username }],
    },
    select: { id: true },
  });

  if (existingUser) {
    throw createError("Email or username is already registered", 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          username,
          email,
          passwordHash,
        },
      });

      const tokens = await issueTokens(tx, user);

      return {
        user: formatUser(user),
        ...tokens,
      };
    });
  } catch (error) {
    if (error.code === "P2002") {
      throw createError("Email or username is already registered", 409);
    }
    throw error;
  }
}

// LOGIN
async function login(identifier, password) {
  const validated = validateLoginInput(identifier, password);

  const normalizedIdentifier = validated.identifier;
  password = validated.password;

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: normalizedIdentifier }, { username: normalizedIdentifier }],
    },
  });

  if (!user) {
    throw createError("Invalid credentials", 401);
  }

  const passwordValid = await bcrypt.compare(password, user.passwordHash);

  if (!passwordValid) {
    throw createError("Invalid credentials", 401);
  }

  const tokens = await prisma.$transaction(async (tx) => {
    return issueTokens(tx, user);
  });

  return {
    user: formatUser(user),
    ...tokens,
  };
}

// REFRESH TOKEN ROTATION
async function refresh(refreshToken) {
  if (!refreshToken) {
    throw createError("Refresh token is required", 401);
  }

  let decoded;

  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (error) {
    throw createError("Invalid or expired refresh token", 401);
  }

  const tokenHash = hashToken(refreshToken);

  const result = await prisma.$transaction(async (tx) => {
    const storedToken = await tx.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!storedToken) {
      return { error: "Refresh token not recognized" };
    }

    if (storedToken.revokedAt) {
      await tx.refreshToken.updateMany({
        where: {
          userId: storedToken.userId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });

      return { error: "Refresh token reuse detected" };
    }

    if (
      storedToken.expiresAt <= new Date() ||
      decoded.sub !== storedToken.userId
    ) {
      return { error: "Refresh token is invalid or expired" };
    }

    const revoked = await tx.refreshToken.updateMany({
      where: {
        id: storedToken.id,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    if (revoked.count !== 1) {
      return { error: "Refresh token has already been used" };
    }

    const tokens = await issueTokens(tx, storedToken.user);

    return {
      user: formatUser(storedToken.user),
      ...tokens,
    };
  });

  if (result.error) {
    throw createError(result.error, 401);
  }

  return result;
}

// LOGOUT
async function logout(refreshToken) {
  if (!refreshToken) {
    return {
      message: "Logged out successfully",
    };
  }

  let decoded;

  try {
    // Signature tetap diverifikasi, tetapi expiration diabaikan
    // agar token yang sudah expired masih bisa dicabut.
    decoded = verifyRefreshToken(refreshToken, {
      ignoreExpiration: true,
    });
  } catch (error) {
    return {
      message: "Logged out successfully",
    };
  }

  await prisma.refreshToken.updateMany({
    where: {
      tokenHash: hashToken(refreshToken),
      userId: decoded.sub,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });

  return {
    message: "Logged out successfully",
  };
}

module.exports = {
  register,
  login,
  refresh,
  logout,
};
