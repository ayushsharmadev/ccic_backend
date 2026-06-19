"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ImageUpload from "@/components/utils/ImageUpload";
import ApnaEditor from "@/components/utils/ApnaEditor";
import ApnaSelect from "@/components/utils/ApnaSelect";
import { showSuccess, showError } from "@/components/utils/ApnaNotify";

export default function AddStream() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    logo: null,
    about: "",
    status: "Active",
  });

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLogoChange = (file, preview) => {
    setFormData((prev) => ({
      ...prev,
      logo: { file, preview },
    }));
  };

  const handleLogoRemove = () => {
    setFormData((prev) => ({
      ...prev,
      logo: null,
    }));
  };

  // Handle direct upload success
  const handleLogoUploadSuccess = (file) => {
    console.log("🎯 Logo upload success:", file);
    setFormData((prev) => ({ ...prev, logo: file.fileUrl }));
    console.log("📝 Form data updated with logo:", file.fileUrl);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("🚀 Form submission started");
    console.log("📝 Current form data:", formData);

    // Check if user is authenticated
    const token = localStorage.getItem("token");
    console.log("🔑 Auth token exists:", !!token);

    if (!token) {
      showError("Please login again to continue");
      return;
    }

    if (!formData.name.trim()) {
      showError("Please enter a stream name");
      return;
    }

    if (!formData.about.trim()) {
      showError("Please enter stream description");
      return;
    }

    // Prevent multiple submissions
    if (submitting) {
      return;
    }

    setSubmitting(true);

    try {
      // Prepare data for API
      const apiData = {
        name: formData.name.trim(),
        about: formData.about.trim(),
        status: formData.status,
      };

      // Add logo if exists (already uploaded or file)
      if (formData.logo) {
        if (typeof formData.logo === "string") {
          // Already uploaded URL
          apiData.logo = formData.logo;
          console.log("✅ Logo URL added:", apiData.logo);
        } else if (formData.logo.file) {
          // File object, need to upload
          try {
            console.log("📤 Uploading logo file...");
            const logoFormData = new FormData();
            logoFormData.append("file", formData.logo.file);
            logoFormData.append("type", "streams");
            logoFormData.append("identifier", "stream-logo");

            const logoResponse = await fetch("/api/upload", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
              },
              body: logoFormData,
            });

            const logoResult = await logoResponse.json();
            if (logoResult.success) {
              apiData.logo = logoResult.file.fileUrl;
              console.log("✅ Logo uploaded successfully:", apiData.logo);
            } else {
              console.error("❌ Logo upload failed:", logoResult.error);
            }
          } catch (uploadError) {
            console.error("❌ Logo upload error:", uploadError);
            // Continue without logo
          }
        }
      }

      console.log("📤 Final API data:", apiData);

      // Make API call to create stream
      const response = await fetch("/api/streams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(apiData),
      });

      const result = await response.json();

      if (result.success) {
        showSuccess("Stream added successfully!");

        // Reset form
        setFormData({
          name: "",
          logo: null,
          about: "",
          status: "Active",
        });

        // Redirect after success
        setTimeout(() => {
          router.push("/admin/master/stream");
        }, 2000);
      } else {
        showError(result.error || "Failed to add stream");
      }
    } catch (error) {
      console.error("Error adding stream:", error);
      showError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
        {/* Loading State */}
        <div className="mb-4">
          <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-30 mb-2 animate-pulse"></div>
          <div className="h-6 bg-gray-200 dark:bg-slate-800 rounded w-44 mb-1 animate-pulse"></div>
          <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-70 animate-pulse"></div>
        </div>

        <div className="bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800 rounded-lg p-5 transition-colors duration-300">
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-20 mb-2 animate-pulse"></div>
              <div className="h-7 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
            </div>
            <div>
              <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-20 mb-2 animate-pulse"></div>
              <div className="h-7 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-4 flex justify-end gap-2">
            <div className="h-7 bg-gray-200 dark:bg-slate-800 rounded w-15 animate-pulse"></div>
            <div className="h-7 bg-gray-200 dark:bg-slate-800 rounded w-25 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Page Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-0.5">
          <Link
            href="/admin/master/stream"
            className="text-gray-600 dark:text-white/70 no-underline text-xs flex items-center gap-1 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Streams
          </Link>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-0.5">
          Add New Stream
        </h1>
        <p className="text-xs text-gray-600 dark:text-white/70">
          Create a new academic stream or specialization
        </p>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800 rounded-lg p-5 shadow-sm transition-colors duration-300">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 mb-5">
            {/* Stream Name */}
            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block">
                Stream Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter stream name"
                required
                className="w-full px-2 py-2 border border-gray-300 dark:border-slate-700 rounded text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary/30 bg-white dark:bg-slate-900/70 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/50"
              />
            </div>

            {/* Status */}
            <div>
              <ApnaSelect
                title="Status"
                options={[
                  { value: "Active", label: "Active" },
                  { value: "Inactive", label: "Inactive" },
                  { value: "Draft", label: "Draft" },
                ]}
                value={formData.status}
                onChange={(value) => handleInputChange("status", value)}
                placeholder="Choose status"
                searchable={true}
                required={true}
                buttonClassName="w-full px-3 py-1.5 rounded text-sm text-left flex items-center justify-between outline-none transition-all duration-200 border border-gray-300 dark:border-slate-700 focus:border-primary focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary/30 bg-white dark:bg-slate-900/70 text-gray-700 dark:text-white/80 cursor-pointer"
              />
            </div>
          </div>

          {/* Logo Upload */}
          <div className="mb-5">
            <ImageUpload
              title="Stream Logo"
              type="image"
              preview={formData.logo?.preview}
              onFileChange={handleLogoChange}
              onRemove={handleLogoRemove}
              accept="image/*"
              maxSize="2MB"
              width="200px"
              height="200px"
              className="w-full"
              uploadType="streams"
              identifier="stream-logo"
              onUploadSuccess={handleLogoUploadSuccess}
              showUploadProgress={true}
              onUploadError={(error) =>
                showError(`Logo upload failed: ${error}`)
              }
            />
            <p className="text-xs text-gray-500 dark:text-white/60 mt-1">
              Recommended size: 120x120 pixels. Supported formats: PNG, JPG,
              GIF.
            </p>
          </div>

          {/* About Section */}
          <div className="mb-5">
            <label className="text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block">
              Stream Description *
            </label>
            <ApnaEditor
              value={formData.about}
              onChange={(value) => handleInputChange("about", value)}
              placeholder="Describe the stream, its objectives, curriculum, and career prospects..."
              className="min-h-[200px]"
              showToolbar={true}
            />
            <p className="text-xs text-gray-500 dark:text-white/60 mt-1">
              Use the toolbar above to format your content. You can add
              headings, lists, links, and images.
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2 border-t border-gray-200 dark:border-slate-800 pt-4">
            <Link
              href="/admin/master/stream"
              className="px-3 py-1.5 text-xs text-gray-700 dark:text-white/80 border border-gray-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900/70 no-underline hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className={`px-3 py-1.5 text-xs text-white border-none rounded font-medium transition-all duration-200 ${
                submitting
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-primary hover:bg-primary-700 cursor-pointer"
              }`}
            >
              {submitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating Stream...</span>
                </div>
              ) : (
                "Add Stream"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
