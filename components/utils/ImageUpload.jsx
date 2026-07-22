"use client";

import { useState, useId, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function ImageUpload({
  title = "Upload Image",
  type = "image",
  preview = null,
  onFileChange,
  onRemove,
  accept = "image/*",
  maxSize = "2MB",
  width = "80px",
  height = "80px",
  className = "",
  disabled = false,
  // New props for direct upload functionality
  uploadType = "general",
  identifier,
  onUploadSuccess,
  onUploadError,
  onAllUploadsComplete, // New callback for when all uploads are done
  showUploadProgress = false,
  multiple = false, // New prop for multiple file uploads
}) {
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [uploadingFiles, setUploadingFiles] = useState([]); // Track multiple uploads
  const { user } = useAuth();
  const id = useId();

  // Handle preview changes
  useEffect(() => {
    if (preview !== null) {
      setUploadError("");
    }
  }, [preview]);

  // Function to get file type text based on accept prop
  const getFileTypeText = () => {
    if (accept === ".pdf") return "PDF";
    if (accept === "image/*") return "PNG, JPG, GIF";
    if (accept === ".doc,.docx") return "DOC, DOCX";
    if (accept === ".xls,.xlsx") return "XLS, XLSX";
    if (accept === ".txt") return "TXT";
    if (accept === ".csv") return "CSV";
    // Default fallback
    return "PNG, JPG, GIF";
  };

  // Function to validate file type based on accept prop
  const isValidFileType = (file) => {
    if (accept === ".pdf") return file.type === "application/pdf";
    if (accept === "image/*") return file.type.startsWith("image/");
    if (accept === ".doc,.docx")
      return (
        file.type.includes("document") ||
        file.name.endsWith(".doc") ||
        file.name.endsWith(".docx")
      );
    if (accept === ".xls,.xlsx")
      return (
        file.type.includes("spreadsheet") ||
        file.name.endsWith(".xls") ||
        file.name.endsWith(".xlsx")
      );
    if (accept === ".txt") return file.type === "text/plain";
    if (accept === ".csv") return file.type === "text/csv";
    // Default fallback to image files
    return file.type.startsWith("image/");
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setDragActive(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setDragActive(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !dragActive) {
      setDragActive(true);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;

    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      if (multiple) {
        handleMultipleFileSelection(files);
      } else {
        const file = files[0];
        if (isValidFileType(file)) {
          handleFileSelection(file);
        } else {
          alert(`Please upload only ${getFileTypeText()} files!`);
        }
      }
    }
  };

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      if (multiple) {
        handleMultipleFileSelection(files);
      } else {
        handleFileSelection(files[0]);
      }
    }
  };

  const handleMultipleFileSelection = async (files) => {
    // Calculate maxSizeBytes once
    const sizeRegex = /^(\d+(?:\.\d+)?)\s*(MB|KB|GB)?$/i;
    const match = maxSize.match(sizeRegex);

    let maxSizeBytes;
    if (match) {
      const size = parseFloat(match[1]);
      const unit = (match[2] || "MB").toUpperCase();

      switch (unit) {
        case "KB":
          maxSizeBytes = size * 1024;
          break;
        case "GB":
          maxSizeBytes = size * 1024 * 1024 * 1024;
          break;
        case "MB":
        default:
          maxSizeBytes = size * 1024 * 1024;
          break;
      }
    } else {
      maxSizeBytes = parseFloat(maxSize) * 1024 * 1024;
    }

    // Validate all files first
    const validFiles = [];
    const invalidFiles = [];

    files.forEach((file) => {
      if (isValidFileType(file)) {
        if (file.size > maxSizeBytes) {
          invalidFiles.push(`${file.name} (too large)`);
        } else {
          validFiles.push(file);
        }
      } else {
        invalidFiles.push(`${file.name} (invalid type)`);
      }
    });

    // Show error for invalid files
    if (invalidFiles.length > 0) {
      alert(`Invalid files: ${invalidFiles.join(", ")}`);
    }

    // Upload valid files
    if (validFiles.length > 0) {
      if (uploadType && uploadType !== "general") {
        // Upload files simultaneously
        await handleMultipleDirectUpload(validFiles, maxSizeBytes);
      } else {
        // Handle local preview for multiple files
        validFiles.forEach((file) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            onFileChange(file, e.target.result);
          };
          reader.readAsDataURL(file);
        });
      }
    }
  };

  const parseUploadResponse = async (response) => {
    const text = await response.text();

    try {
      return text ? JSON.parse(text) : {};
    } catch {
      return {
        success: false,
        error: text.slice(0, 300) || `Upload failed with status: ${response.status}`,
      };
    }
  };

  const handleMultipleDirectUpload = async (files, maxSizeBytes) => {
    setIsUploading(true);
    setUploadError("");

    // Initialize upload tracking for each file
    const initialUploadStates = files.map((file) => ({
      file,
      progress: 0,
      status: "uploading", // 'uploading', 'completed', 'error'
      error: null,
    }));

    setUploadingFiles(initialUploadStates);

    try {
      // Check if user is authenticated
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("User not authenticated. Please log in again.");
      }

      // Upload all files simultaneously
      const uploadPromises = files.map(async (file, index) => {
        try {
          // Validate file object
          if (!file || !file.name || !file.size || !file.type) {
            throw new Error("Invalid file object");
          }

          // Create FormData
          const formData = new FormData();
          formData.append("file", file);
          formData.append("type", uploadType);
          formData.append("identifier", identifier || user?._id || "unknown");

          // Set allowed types based on accept prop
          let allowedTypes = "image/jpeg,image/png,image/gif,image/webp"; // Default
          if (accept === ".pdf") {
            allowedTypes = "application/pdf";
          } else if (accept === ".doc,.docx") {
            allowedTypes =
              "application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
          } else if (accept === ".xls,.xlsx") {
            allowedTypes =
              "application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
          } else if (accept === ".txt") {
            allowedTypes = "text/plain";
          } else if (accept === ".csv") {
            allowedTypes = "text/csv";
          }

          formData.append("allowedTypes", allowedTypes);
          formData.append("maxSize", maxSizeBytes.toString());
          formData.append("overwrite", "false");

          // Simulate upload progress for this specific file
          const progressInterval = setInterval(() => {
            setUploadingFiles((prev) =>
              prev.map((item, i) =>
                i === index && item.status === "uploading"
                  ? { ...item, progress: Math.min(item.progress + 10, 90) }
                  : item
              )
            );
          }, 100);

          // Upload file
          const response = await fetch("/api/upload", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          });

          clearInterval(progressInterval);

          const data = await parseUploadResponse(response);

          if (!response.ok) {
            throw new Error(
              data.error || `Upload failed with status: ${response.status}`
            );
          }

          if (!data.success) {
            throw new Error(data.error || "Upload failed");
          }

          // Mark this file as completed
          setUploadingFiles((prev) =>
            prev.map((item, i) =>
              i === index
                ? { ...item, progress: 100, status: "completed" }
                : item
            )
          );

          // Call success callback
          if (onUploadSuccess) {
            onUploadSuccess(data.file);
          }

          // Don't call onFileChange for multiple uploads to avoid duplicates
          // onFileChange is only for single file uploads

          return "success"; // Return success status
        } catch (error) {
          // Mark this file as error
          setUploadingFiles((prev) =>
            prev.map((item, i) =>
              i === index
                ? { ...item, status: "error", error: error.message }
                : item
            )
          );

          // Call error callback
          if (onUploadError) {
            onUploadError(error);
          }

          return "error"; // Return error status
        }
      });

      // Wait for all uploads to complete
      const results = await   (uploadPromises);

      // Count successful uploads
      const successfulUploads = results.filter(
        (result) => result === "success"
      ).length;

      // Call callback when all uploads are complete
      if (onAllUploadsComplete && successfulUploads > 0) {
        onAllUploadsComplete(successfulUploads);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError(error.message || "Upload failed");

      // Call error callback
      if (onUploadError) {
        onUploadError(error);
      }
    } finally {
      setIsUploading(false);
      // Clear uploading files after a delay
      setTimeout(() => {
        setUploadingFiles([]);
      }, 2000);
    }
  };

  const handleFileSelection = async (file) => {
    // Validate file type first
    if (!isValidFileType(file)) {
      alert(`Please upload only ${getFileTypeText()} files!`);
      return;
    }

    // Parse maxSize - extract number and unit
    const sizeRegex = /^(\d+(?:\.\d+)?)\s*(MB|KB|GB)?$/i;
    const match = maxSize.match(sizeRegex);

    let maxSizeBytes;
    if (match) {
      const size = parseFloat(match[1]);
      const unit = (match[2] || "MB").toUpperCase();

      switch (unit) {
        case "KB":
          maxSizeBytes = size * 1024;
          break;
        case "GB":
          maxSizeBytes = size * 1024 * 1024 * 1024;
          break;
        case "MB":
        default:
          maxSizeBytes = size * 1024 * 1024;
          break;
      }
    } else {
      // Fallback: assume it's MB if no unit specified
      maxSizeBytes = parseFloat(maxSize) * 1024 * 1024;
    }

    if (file.size > maxSizeBytes) {
      alert(
        `File size should be less than ${maxSize}${
          match && match[2] ? "" : "MB"
        }`
      );
      return;
    }

    // If uploadType is specified, upload directly
    if (uploadType && uploadType !== "general") {
      await handleDirectUpload(file, maxSizeBytes);
    } else {
      // Create preview for local handling
      const reader = new FileReader();
      reader.onload = (e) => {
        onFileChange(file, e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDirectUpload = async (file, maxSizeBytes) => {
    try {
      setIsUploading(true);
      setUploadError("");
      setUploadProgress(0);

      // Check if user is authenticated
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("User not authenticated. Please log in again.");
      }

      // Validate file object
      if (!file || !file.name || !file.size || !file.type) {
        throw new Error("Invalid file object");
      }

      // Create FormData
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", uploadType);
      formData.append("identifier", identifier || user?._id || "unknown");
      // Set allowed types based on accept prop
      let allowedTypes = "image/jpeg,image/png,image/gif,image/webp"; // Default
      if (accept === ".pdf") {
        allowedTypes = "application/pdf";
      } else if (accept === ".doc,.docx") {
        allowedTypes =
          "application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      } else if (accept === ".xls,.xlsx") {
        allowedTypes =
          "application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      } else if (accept === ".txt") {
        allowedTypes = "text/plain";
      } else if (accept === ".csv") {
        allowedTypes = "text/csv";
      }

      formData.append("allowedTypes", allowedTypes);
      formData.append("maxSize", maxSizeBytes.toString());
      formData.append("overwrite", "false");

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      // Upload file
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await parseUploadResponse(response);

      if (!response.ok) {
        throw new Error(
          data.error || `Upload failed with status: ${response.status}`
        );
      }

      if (!data.success) {
        throw new Error(data.error || "Upload failed");
      }

      // Call success callback
      if (onUploadSuccess) {
        onUploadSuccess(data.file);
      }

      // Also call onFileChange for backward compatibility
      if (onFileChange) {
        onFileChange(file, data.file.fileUrl);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError(error.message || "Upload failed");

      // Call error callback
      if (onUploadError) {
        onUploadError(error);
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    if (onRemove) {
      onRemove();
    }
  };

  const inputId = `${type}-input-${id}`;

  return (
    <div className={`min-w-0 ${className}`}>
      <label className="text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block">
        {title}
      </label>
      <div
        className={`relative border-2 border-dashed rounded-md p-4 text-center transition-all duration-200 ${
          disabled
            ? "border-gray-300 bg-gray-50 dark:border-slate-700 dark:bg-slate-900/60 cursor-not-allowed opacity-60"
            : dragActive
            ? "border-primary bg-primary/10 dark:border-primary dark:bg-primary/15"
            : "border-gray-300 dark:border-slate-700 bg-[--upload-bg,#fafafa] dark:bg-slate-900"
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !disabled && document.getElementById(inputId).click()}
      >
        {preview ? (
          <div className="relative">
            {accept === ".pdf" ? (
              <div
                className="mx-auto rounded border-2 border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 flex items-center justify-center"
                style={{ width, height }}
              >
                <div className="min-w-0 max-w-full px-2 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-xs text-gray-600">PDF Document</p>
                  <p className="line-clamp-2 max-w-full break-all text-xs text-gray-500 dark:text-gray-400">
                    {preview.split("/").pop()}
                  </p>
                </div>
              </div>
            ) : (
              <img
                src={preview}
                alt={`${title} Preview`}
                className="mx-auto block rounded object-cover"
                style={{ width, height }}
              />
            )}
            {!disabled && onRemove && (
              <button
                type="button"
                onClick={handleRemove}
                className="absolute -top-2 bg-secondary-500 text-white border-none rounded-full w-5 h-5 text-xs cursor-pointer flex items-center justify-center transition-all duration-200"
                style={{
                  right: `calc(50% - ${parseInt(width) / 2 - 12}px)`,
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#dc2626";
                  e.target.style.borderColor = "#dc2626";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#ef4444";
                  e.target.style.borderColor = "#ef4444";
                }}
              >
                ×
              </button>
            )}
            <p className="text-xs text-gray-600 dark:text-white/70 mt-2">
              {disabled
                ? "Preview only"
                : `Click to change or drag new ${
                    accept === ".pdf" ? "PDF" : "image"
                  }`}
            </p>
          </div>
        ) : (
          <div>
            {accept === ".pdf" ? (
              <svg
                className={`mx-auto mb-2 h-8 w-8 ${
                  disabled
                    ? "text-gray-300"
                    : "text-gray-400 dark:text-white/50"
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            ) : (
              <svg
                className={`mx-auto mb-2 h-8 w-8 ${
                  disabled ? "text-gray-300" : "text-gray-400"
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            )}
            <p
              className={`text-xs mb-1 ${
                disabled ? "text-gray-300" : "text-gray-700 dark:text-white"
              }`}
            >
              <span
                className={`font-medium ${
                  disabled ? "text-gray-300" : "text-primary"
                }`}
              >
                {disabled
                  ? "Upload disabled"
                  : multiple
                  ? "Click to upload multiple"
                  : "Click to upload"}
              </span>{" "}
              {!disabled && "or drag and drop"}
            </p>
            <p
              className={`text-xs ${
                disabled ? "text-gray-300" : "text-gray-400 dark:text-white/60"
              }`}
            >
              {getFileTypeText()} up to {maxSize}
              {maxSize && !maxSize.match(/MB|KB|GB/i) ? "MB" : ""}
            </p>
          </div>
        )}

        {/* Upload Progress Bars */}
        {showUploadProgress && uploadingFiles.length > 0 && (
          <div className="mt-3 space-y-2">
            {uploadingFiles.map((uploadFile, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 dark:text-white/70 truncate max-w-[200px]">
                    {uploadFile.file.name}
                  </span>
                  <span className="text-xs text-gray-600 dark:text-white/70">
                    {uploadFile.status === "uploading" &&
                      `${uploadFile.progress}%`}
                    {uploadFile.status === "completed" && "✓ Complete"}
                    {uploadFile.status === "error" && "✗ Error"}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      uploadFile.status === "completed"
                        ? "bg-green-500"
                        : uploadFile.status === "error"
                        ? "bg-red-500"
                        : "bg-primary"
                    }`}
                    style={{ width: `${uploadFile.progress}%` }}
                  ></div>
                </div>
                {uploadFile.error && (
                  <p className="text-xs text-red-600">{uploadFile.error}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Single Upload Progress Bar (for backward compatibility) */}
        {showUploadProgress && isUploading && uploadingFiles.length === 0 && (
          <div className="mt-3">
            <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-600 dark:text-white/70 mt-1">
              Uploading... {uploadProgress}%
            </p>
          </div>
        )}

        {/* Upload Error */}
        {uploadError && (
          <div className="mt-3 p-2 bg-secondary-50 dark:bg-secondary/20 border border-secondary-200 dark:border-secondary-500/60 rounded">
            <p className="text-xs text-secondary dark:text-secondary-200">
              {uploadError}
            </p>
          </div>
        )}

        <input
          id={inputId}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
          disabled={disabled || isUploading}
          className="hidden"
        />
      </div>
    </div>
  );
}
