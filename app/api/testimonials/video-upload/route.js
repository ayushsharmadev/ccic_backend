import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/middleware/auth";
import { uploadFile, validateFile } from "@/lib/utils/upload";
import { deleteLocalTestimonialVideo } from "@/lib/utils/testimonialVideoStorage";

const MAX_VIDEO_SIZE = 300 * 1024 * 1024;
const MAX_REQUEST_SIZE = MAX_VIDEO_SIZE + 1024 * 1024;
const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

export const POST = withAdminAuth(async (request) => {
  try {
    const contentLength = Number(request.headers.get("content-length"));
    if (contentLength && contentLength > MAX_REQUEST_SIZE) {
      return NextResponse.json(
        { success: false, error: "Video file must be 300 MB or smaller" },
        { status: 413 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { success: false, error: "Video file is required" },
        { status: 400 }
      );
    }

    const validation = validateFile(
      file,
      ALLOWED_VIDEO_TYPES,
      MAX_VIDEO_SIZE
    );
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const uploadResult = await uploadFile({
      file,
      uploadDir: "testimonials",
      filePrefix: "testimonial-video",
      identifier: "testimonial-video",
      allowedTypes: ALLOWED_VIDEO_TYPES,
      maxSize: MAX_VIDEO_SIZE,
      overwrite: false,
    });

    if (!uploadResult.success) {
      return NextResponse.json(
        { success: false, error: uploadResult.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Testimonial video uploaded successfully",
      file: {
        fileName: uploadResult.fileName,
        fileUrl: uploadResult.fileUrl,
        fileSize: uploadResult.fileSize,
        fileType: uploadResult.fileType,
      },
    });
  } catch (error) {
    console.error("Testimonial video upload error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to upload testimonial video",
      },
      { status: 500 }
    );
  }
});

export const DELETE = withAdminAuth(async (request) => {
  try {
    const { videoUrl } = await request.json();
    await deleteLocalTestimonialVideo(videoUrl);

    return NextResponse.json({
      success: true,
      message: "Testimonial video deleted successfully",
    });
  } catch (error) {
    console.error("Testimonial video deletion error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete video" },
      { status: 400 }
    );
  }
});
