"use client";

import { useState, useEffect } from "react";
import { HiDocumentText, HiCheckCircle } from "react-icons/hi";
import ImageUpload from "./ImageUpload";
import ApnaModal from "./ApnaModal";
import { showSuccess, showError } from "./ApnaNotify";

export default function ApnaModalBrochureUpload({
  isOpen,
  onClose,
  collegeId,
  collegeName,
  existingBrochure = null,
  onBrochureUploaded,
}) {
  const [brochureFile, setBrochureFile] = useState(null);
  const [brochurePreview, setBrochurePreview] = useState(existingBrochure);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Reset state when modal opens with different college
  useEffect(() => {
    if (isOpen) {
      setBrochureFile(null);
      setBrochurePreview(existingBrochure);
      setUploadProgress(0);
      setIsUploading(false);
    }
  }, [isOpen, collegeId, existingBrochure]);

  const handleFileChange = (file, preview) => {
    setBrochureFile(file);
    setBrochurePreview(preview);
  };

  const handleRemoveBrochure = () => {
    setBrochureFile(null);
    setBrochurePreview(null);
  };

  const handleUploadSuccess = (uploadedFile) => {
    setBrochurePreview(uploadedFile.fileUrl);
    showSuccess("Brochure uploaded successfully!");
  };

  const handleUploadError = (error) => {
    console.error("Upload error:", error);
    showError("Failed to upload brochure. Please try again.");
  };

  const handleSave = async () => {
    if (!brochurePreview) {
      showError("Please upload a brochure file");
      return;
    }

    try {
      setIsUploading(true);

      // Get auth token
      const token = localStorage.getItem("token");
      if (!token) {
        showError("Authentication required. Please log in again.");
        return;
      }

      // Update college brochure using dedicated endpoint
      const response = await fetch(`/api/colleges/${collegeId}/brochure`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          brochure: brochurePreview,
        }),
      });

      const data = await response.json();

      if (data.success) {
        showSuccess("College brochure updated successfully!");
        if (onBrochureUploaded) {
          onBrochureUploaded(brochurePreview);
        }
        handleClose();
      } else {
        showError(data.error || "Failed to update brochure");
      }
    } catch (error) {
      console.error("Error updating brochure:", error);
      showError("Failed to update brochure. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    await handleSave();
  };

  const handleClose = () => {
    // Reset state
    setBrochureFile(null);
    setBrochurePreview(existingBrochure);
    setUploadProgress(0);
    onClose();
  };

  const handleRemoveExisting = async () => {
    try {
      setIsUploading(true);

      const token = localStorage.getItem("token");
      if (!token) {
        showError("Authentication required. Please log in again.");
        return;
      }

      const response = await fetch(`/api/colleges/${collegeId}/brochure`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          brochure: null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        showSuccess("Brochure removed successfully!");
        setBrochurePreview(null);
        if (onBrochureUploaded) {
          onBrochureUploaded(null);
        }
        handleClose();
      } else {
        showError(data.error || "Failed to remove brochure");
      }
    } catch (error) {
      console.error("Error removing brochure:", error);
      showError("Failed to remove brochure. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <ApnaModal
      isOpen={isOpen}
      onClose={handleClose}
      onSubmit={handleSubmit}
      title={`Upload Brochure - ${collegeName}`}
      submitText={isUploading ? "Saving..." : "Save Brochure"}
      cancelText="Cancel"
      size="md"
      submitDisabled={!brochurePreview || isUploading}
    >
      {/* Header with Icon */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-orange-100 dark:bg-orange-500/20 rounded-lg flex items-center justify-center">
          <HiDocumentText className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            College Brochure Upload
          </h3>
          <p className="text-sm text-gray-600 dark:text-white/70">{collegeName}</p>
        </div>
      </div>

      {/* Upload Section */}
      <div className="mb-6">
        <ImageUpload
          key={`brochure-${collegeId}`}
          title="College Brochure"
          type="brochure"
          accept=".pdf"
          maxSize="10MB"
          width="100%"
          height="120px"
          preview={brochurePreview}
          onFileChange={handleFileChange}
          onRemove={handleRemoveBrochure}
          uploadType="brochure"
          identifier={collegeId}
          onUploadSuccess={handleUploadSuccess}
          onUploadError={handleUploadError}
          showUploadProgress={true}
          disabled={isUploading}
        />
      </div>

      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-500/20 border border-blue-200 dark:border-blue-400/40 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <HiCheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-300 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
              Brochure Guidelines
            </h4>
            <ul className="text-xs text-blue-800 dark:text-blue-100 space-y-1">
              <li>• Only PDF files are allowed</li>
              <li>• Maximum file size: 10MB</li>
              <li>
                • Include college information, courses, fees, and facilities
              </li>
              <li>• Ensure the document is clear and readable</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Remove Existing Brochure Button */}
      {brochurePreview && (
        <div className="mb-4">
          <button
            onClick={handleRemoveExisting}
            disabled={isUploading}
            className="w-full px-4 py-2 border border-red-300 dark:border-red-500 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? "Removing..." : "Remove Existing Brochure"}
          </button>
        </div>
      )}
    </ApnaModal>
  );
}
