import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "30d";

// Generate access token
export const generateAccessToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: "ccic",
    audience: "ccic-users",
  });
};

// Generate refresh token
export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
    issuer: "ccic",
    audience: "ccic-users",
  });
};

// Verify token
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: "ccic",
      audience: "ccic-users",
    });
  } catch (error) {
    throw new Error(`Invalid or expired token: ${error.message}`);
  }
};

// Decode token without verification (for getting payload)
export const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch {
    throw new Error("Invalid token format");
  }
};

// Generate token pair (access + refresh)
export const generateTokenPair = (payload) => {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return {
    accessToken,
    refreshToken,
    expiresIn: JWT_EXPIRES_IN,
    refreshExpiresIn: JWT_REFRESH_EXPIRES_IN,
  };
};

// Extract token from Authorization header
export const extractTokenFromHeader = (authorization) => {
  if (!authorization || !authorization.startsWith("Bearer ")) {
    return null;
  }

  return authorization.substring(7); // Remove "Bearer " prefix
};

// Get token expiration time
export const getTokenExpiration = (token) => {
  try {
    const decoded = jwt.decode(token);
    return decoded ? new Date(decoded.exp * 1000) : null;
  } catch {
    return null;
  }
};

// Check if token is expired
export const isTokenExpired = (token) => {
  const expiration = getTokenExpiration(token);
  return expiration ? expiration < new Date() : true;
};
