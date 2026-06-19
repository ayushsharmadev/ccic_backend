import { NextResponse } from "next/server";
import { verifyToken, extractTokenFromHeader } from "@/lib/jwt";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";

// Authentication middleware
export const authenticateToken = async (request) => {
  try {
    console.log("🔍 Authenticating token...");
    const authorization = request.headers.get("authorization");
    console.log(
      "🔑 Authorization header:",
      authorization ? "Present" : "Missing"
    );

    if (!authorization) {
      return {
        success: false,
        error: "Access token required",
        status: 401,
      };
    }

    const token = extractTokenFromHeader(authorization);

    if (!token) {
      return {
        success: false,
        error: "Invalid token format",
        status: 401,
      };
    }

    // Verify token
    const decoded = verifyToken(token);

    if (!decoded || !decoded.userId) {
      return {
        success: false,
        error: "Invalid token",
        status: 401,
      };
    }

    // Connect to database
    await connectDB();

    // Find user
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return {
        success: false,
        error: "User not found",
        status: 401,
      };
    }

    // Special case: Allow admin to activate themselves if they are deactivated
    // This prevents the situation where all admins are deactivated and can't reactivate
    if (!user.isActive && user.role !== "admin") {
      return {
        success: false,
        error: "User account is deactivated",
        status: 401,
      };
    }

    // Return user data
    return {
      success: true,
      user,
      decoded,
    };
  } catch (error) {
    console.error("Authentication error:", error);
    return {
      success: false,
      error: "Authentication failed",
      status: 401,
    };
  }
};

// Role-based authorization middleware
export const requireRole = (allowedRoles) => {
  return async (request) => {
    const authResult = await authenticateToken(request);

    if (!authResult.success) {
      return authResult;
    }

    const { user } = authResult;

    if (!allowedRoles.includes(user.role)) {
      return {
        success: false,
        error: "Insufficient permissions",
        status: 403,
      };
    }

    return authResult;
  };
};

// Admin-only middleware
export const requireAdmin = async (request) => {
  return await requireRole(["admin"])(request);
};

// Admin or moderator middleware
export const requireAdminOrModerator = async (request) => {
  return await requireRole(["admin", "moderator"])(request);
};

// Higher-order function to wrap API handlers with authentication
export const withAuth = (handler, options = {}) => {
  const {
    requireRole: role,
    requireAdmin: admin,
    requireAdminOrModerator: adminOrMod,
  } = options;

  return async (request, context) => {
    console.log("🔐 Auth middleware called with options:", {
      role,
      admin,
      adminOrMod,
    });
    let authResult;

    if (admin) {
      authResult = await requireAdmin(request);
    } else if (adminOrMod) {
      authResult = await requireAdminOrModerator(request);
    } else if (role) {
      authResult = await requireRole(role)(request);
    } else {
      authResult = await authenticateToken(request);
    }

    if (!authResult.success) {
      console.log(
        "❌ Auth failed:",
        authResult.error,
        "Status:",
        authResult.status
      );
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    console.log("✅ Auth successful for user:", authResult.user.email);

    // Add user to request context
    request.user = authResult.user;
    request.decoded = authResult.decoded;

    // Call the original handler
    return handler(request, context);
  };
};

// Higher-order function to wrap API handlers with admin-only access
export const withAdminAuth = (handler) => {
  return withAuth(handler, { requireAdmin: true });
};

// Higher-order function to wrap API handlers with admin/moderator access
export const withAdminOrModeratorAuth = (handler) => {
  return withAuth(handler, { requireAdminOrModerator: true });
};
