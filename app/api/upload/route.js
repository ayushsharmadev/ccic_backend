import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { uploadFile, validateFile } from "@/lib/utils/upload";

export async function POST(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Access token required" },
        { status: 401 }
      );
    }

    let decoded;
    try {
      decoded = await verifyToken(token);
    } catch (tokenError) {
      console.error("Token verification error:", tokenError);
      return NextResponse.json(
        { success: false, error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    if (!decoded) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const uploadType = formData.get("type") || "general"; // e.g., 'avatar', 'college', 'course', 'general'
    const identifier = formData.get("identifier") || decoded.userId;
    const allowedTypes = formData.get("allowedTypes")?.split(",") || [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    const maxSize = parseInt(formData.get("maxSize")) || 5 * 1024 * 1024; // 5MB default
    const overwrite = formData.get("overwrite") === "true";

    if (!file) {
      return NextResponse.json(
        { success: false, error: "File is required" },
        { status: 400 }
      );
    }

    // Validate file first
    const validation = validateFile(file, allowedTypes, maxSize);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // Use reusable upload utility
    const uploadResult = await uploadFile({
      file,
      uploadDir: uploadType,
      filePrefix: uploadType,
      identifier,
      allowedTypes,
      maxSize,
      overwrite,
    });

    if (!uploadResult.success) {
      return NextResponse.json(
        { success: false, error: uploadResult.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "File uploaded successfully",
      file: {
        fileName: uploadResult.fileName,
        fileUrl: uploadResult.fileUrl,
        fileSize: uploadResult.fileSize,
        fileType: uploadResult.fileType,
      },
    });
  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to upload file" },
      { status: 500 }
    );
  }
}
