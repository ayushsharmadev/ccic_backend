import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

/**
 * Reusable file upload utility
 * @param {Object} options - Upload configuration options
 * @param {File} options.file - The file to upload
 * @param {string} options.uploadDir - Directory name under public/uploads (e.g., 'avatars', 'colleges', 'courses')
 * @param {string} options.filePrefix - Prefix for the filename (e.g., 'avatar', 'college', 'course')
 * @param {string} options.identifier - Unique identifier (e.g., userId, collegeId)
 * @param {Array<string>} options.allowedTypes - Allowed MIME types (e.g., ['image/jpeg', 'image/png'])
 * @param {number} options.maxSize - Maximum file size in bytes (default: 5MB)
 * @param {boolean} options.overwrite - Whether to overwrite existing files (default: false)
 * @returns {Promise<Object>} - Upload result with success status, file path, and URL
 */
export async function uploadFile({
  file,
  uploadDir,
  filePrefix,
  identifier,
  allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"],
  maxSize = 5 * 1024 * 1024, // 5MB default
  overwrite = false,
}) {
  try {
    if (!file) {
      throw new Error("File is required");
    }

    // Validate file type
    if (!allowedTypes.includes(file.type)) {
      throw new Error(
        `File type not allowed. Allowed types: ${allowedTypes.join(", ")}`
      );
    }

    // Validate file size
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      throw new Error(`File size must be less than ${maxSizeMB}MB`);
    }

    // Create uploads directory if it doesn't exist
    const uploadsPath = join(process.cwd(), "uploads", uploadDir);

    try {
      await mkdir(uploadsPath, { recursive: true });
    } catch (dirError) {
      console.error(`Error creating uploads directory: ${dirError}`);
      throw new Error(
        `Failed to create uploads directory: ${dirError.message}`
      );
    }

    // Generate unique filename
    const fileExtension = file.name.split(".").pop().toLowerCase();
    const timestamp = Date.now();
    const fileName = `${filePrefix}_${identifier}_${timestamp}.${fileExtension}`;
    const filePath = join(uploadsPath, fileName);

    // Check if file already exists and handle overwrite
    if (existsSync(filePath) && !overwrite) {
      throw new Error("File already exists");
    }

    // Convert file to buffer and save
    try {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Write file to disk
      await writeFile(filePath, buffer);
    } catch (fileError) {
      console.error("Error saving file:", fileError);
      throw new Error(`Failed to save file to disk: ${fileError.message}`);
    }

    // Create URL for the uploaded file
    const fileUrl = `/uploads/${uploadDir}/${fileName}`;

    return {
      success: true,
      fileName,
      filePath,
      fileUrl,
      fileSize: file.size,
      fileType: file.type,
      message: "File uploaded successfully",
    };
  } catch (error) {
    console.error("File upload error:", error);
    return {
      success: false,
      error: error.message || "Failed to upload file",
    };
  }
}

/**
 * Delete a file from the uploads directory
 * @param {string} filePath - Full path to the file
 * @returns {Promise<Object>} - Deletion result
 */
export async function deleteFile(filePath) {
  try {
    if (!filePath) {
      throw new Error("File path is required");
    }

    // Check if file exists
    if (!existsSync(filePath)) {
      return {
        success: true,
        message: "File does not exist",
      };
    }

    // Delete the file
    await unlink(filePath);

    return {
      success: true,
      message: "File deleted successfully",
    };
  } catch (error) {
    console.error("File deletion error:", error);
    return {
      success: false,
      error: error.message || "Failed to delete file",
    };
  }
}

/**
 * Delete a file by URL (relative to public/uploads)
 * @param {string} fileUrl - URL relative to public/uploads (e.g., '/uploads/avatars/filename.jpg')
 * @returns {Promise<Object>} - Deletion result
 */
export async function deleteFileByUrl(fileUrl) {
  try {
    if (!fileUrl) {
      throw new Error("File URL is required");
    }

    // Remove leading slash and construct full path
    const relativePath = fileUrl.startsWith("/") ? fileUrl.slice(1) : fileUrl;
    const fullPath = join(process.cwd(), "public", relativePath);

    return await deleteFile(fullPath);
  } catch (error) {
    console.error("File deletion by URL error:", error);
    return {
      success: false,
      error: error.message || "Failed to delete file",
    };
  }
}

/**
 * Get file info without uploading
 * @param {File} file - The file to analyze
 * @returns {Object} - File information
 */
export function getFileInfo(file) {
  if (!file) {
    return {
      success: false,
      error: "File is required",
    };
  }

  return {
    success: true,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    fileExtension: file.name.split(".").pop().toLowerCase(),
    lastModified: file.lastModified,
  };
}

/**
 * Validate file before upload
 * @param {File} file - The file to validate
 * @param {Array<string>} allowedTypes - Allowed MIME types
 * @param {number} maxSize - Maximum file size in bytes
 * @returns {Object} - Validation result
 */
export function validateFile(
  file,
  allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"],
  maxSize = 5 * 1024 * 1024
) {
  if (!file) {
    return {
      success: false,
      error: "File is required",
    };
  }

  // Validate file type
  if (!allowedTypes.includes(file.type)) {
    return {
      success: false,
      error: `File type not allowed. Allowed types: ${allowedTypes.join(", ")}`,
    };
  }

  // Validate file size
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    return {
      success: false,
      error: `File size must be less than ${maxSizeMB}MB`,
    };
  }

  return {
    success: true,
    message: "File validation passed",
  };
}
