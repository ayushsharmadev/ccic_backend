import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import { verifyToken } from "@/lib/jwt";

// GET - Get user profile
export async function GET(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Access token required" },
        { status: 401 }
      );
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        avatar: user.avatar,
        role: user.role,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        loginAttempts: user.loginAttempts,
        lockUntil: user.lockUntil,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        // Virtual field
        fullName: user.fullName,
      },
    });
  } catch (error) {
    console.error("Profile GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// PUT - Update user profile
export async function PUT(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Access token required" },
        { status: 401 }
      );
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { firstName, lastName, phoneNumber, avatar, username } = body;

    // Validate input
    const updateData = {};

    if (firstName !== undefined) {
      if (firstName.trim().length > 50) {
        return NextResponse.json(
          { success: false, error: "First name cannot exceed 50 characters" },
          { status: 400 }
        );
      }
      updateData.firstName = firstName.trim();
    }

    if (lastName !== undefined) {
      if (lastName.trim().length > 50) {
        return NextResponse.json(
          { success: false, error: "Last name cannot exceed 50 characters" },
          { status: 400 }
        );
      }
      updateData.lastName = lastName.trim();
    }

    if (phoneNumber !== undefined) {
      if (phoneNumber.trim().length > 20) {
        return NextResponse.json(
          { success: false, error: "Phone number cannot exceed 20 characters" },
          { status: 400 }
        );
      }
      updateData.phoneNumber = phoneNumber.trim();
    }

    if (avatar !== undefined) {
      updateData.avatar = avatar.trim();
    }

    if (username !== undefined) {
      if (username.trim().length < 3) {
        return NextResponse.json(
          { success: false, error: "Username must be at least 3 characters" },
          { status: 400 }
        );
      }
      if (username.trim().length > 30) {
        return NextResponse.json(
          { success: false, error: "Username cannot exceed 30 characters" },
          { status: 400 }
        );
      }

      // Check if username is already taken by another user
      const existingUser = await User.findOne({
        username: username.trim(),
        _id: { $ne: decoded.userId },
      });

      if (existingUser) {
        return NextResponse.json(
          { success: false, error: "Username is already taken" },
          { status: 400 }
        );
      }

      updateData.username = username.trim();
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const user = await User.findByIdAndUpdate(
      decoded.userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        avatar: user.avatar,
        role: user.role,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        loginAttempts: user.loginAttempts,
        lockUntil: user.lockUntil,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        fullName: user.fullName,
      },
    });
  } catch (error) {
    console.error("Profile PUT error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
