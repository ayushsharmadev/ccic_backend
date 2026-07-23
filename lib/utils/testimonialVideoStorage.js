import { unlink } from "fs/promises";
import { resolve, sep } from "path";

const TESTIMONIAL_UPLOAD_PREFIX = "/uploads/testimonials/";

export async function deleteLocalTestimonialVideo(videoUrl) {
  if (
    typeof videoUrl !== "string" ||
    !videoUrl.startsWith(TESTIMONIAL_UPLOAD_PREFIX)
  ) {
    throw new Error("Invalid testimonial video path");
  }

  const uploadRoot = resolve(process.cwd(), "uploads", "testimonials");
  const relativeFile = videoUrl.slice(TESTIMONIAL_UPLOAD_PREFIX.length);
  const filePath = resolve(uploadRoot, relativeFile);

  if (!filePath.startsWith(`${uploadRoot}${sep}`)) {
    throw new Error("Invalid testimonial video path");
  }

  try {
    await unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}
