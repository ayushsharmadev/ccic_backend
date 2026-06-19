import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import { verifyToken } from "@/lib/jwt";
import { uploadFile } from "@/lib/utils/upload";

export async function POST(request) {
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

    const formData = await request.formData();
    const file = formData.get("avatar");

    console.log("Avatar upload request received:", {
      userId: decoded.userId,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
    });

    if (!file) {
      return NextResponse.json(
        { success: false, error: "Avatar file is required" },
        { status: 400 }
      );
    }

    // Use reusable upload utility
    const uploadResult = await uploadFile({
      file,
      uploadDir: "avatars",
      filePrefix: "avatar",
      identifier: decoded.userId,
      allowedTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
      maxSize: 5 * 1024 * 1024, // 5MB
      overwrite: false,
    });

    if (!uploadResult.success) {
      return NextResponse.json(
        { success: false, error: uploadResult.error },
        { status: 400 }
      );
    }

    console.log("File uploaded successfully:", uploadResult);
    const avatarUrl = uploadResult.fileUrl;

    // Update user avatar field in database
    const user = await User.findByIdAndUpdate(
      decoded.userId,
      { avatar: avatarUrl },
      { new: true }
    ).select("-password");

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    console.log("User avatar updated in database successfully");

    return NextResponse.json({
      success: true,
      message: "Avatar uploaded successfully",
      avatar: avatarUrl,
      user: {
        _id: user._id,
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
    console.error("Avatar upload error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload avatar" },
      { status: 500 }
    );
  }
}
