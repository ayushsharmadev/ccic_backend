import { withAdminAuth } from "@/lib/middleware/auth";
import { NextResponse } from "next/server";
import { existsSync } from "fs";
import { join } from "path";

export const GET = withAdminAuth(async () => {
  try {
    const uploadsPath = join(process.cwd(), "public", "uploads");
    const avatarsPath = join(uploadsPath, "avatars");
    const collegesPath = join(uploadsPath, "colleges");
    const coursesPath = join(uploadsPath, "courses");
    const generalPath = join(uploadsPath, "general");

    const directories = {
      uploads: existsSync(uploadsPath),
      avatars: existsSync(avatarsPath),
      colleges: existsSync(collegesPath),
      courses: existsSync(coursesPath),
      general: existsSync(generalPath),
    };

    return NextResponse.json({
      success: true,
      message: "Upload directories status",
      directories,
      currentWorkingDir: process.cwd(),
      uploadsPath,
    });
  } catch (error) {
    console.error("Test endpoint error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
});
