"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import ImageUpload from "@/components/utils/ImageUpload";
import ApnaEditor from "@/components/utils/ApnaEditor";
import ApnaSelect from "@/components/utils/ApnaSelect";
import {
  showSuccess,
  showError,
  showInfo,
} from "@/components/utils/ApnaNotify";

export default function EditStream() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [stream, setStream] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    logo: null,
    about: "",
    status: "Active",
  });

  useEffect(() => {
    // Fetch real stream data from API
    const fetchStreamData = async () => {
      try {
        setLoading(true);

        // Get access token
        const token = localStorage.getItem("token");
        if (!token) {
          showError("Please login again to continue");
          router.push("/login");
          return;
        }

        const response = await fetch(`/api/streams/${params.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json();

        if (result.success) {
          const streamData = result.data;
          setStream(streamData);
          setFormData({
            name: streamData.name || "",
            logo: streamData.logo ? { preview: streamData.logo } : null,
            about: streamData.about || "",
            status: streamData.status || "Active",
          });
        } else {
          showError(result.error || "Failed to fetch stream data");
          setStream(null);
        }
      } catch (error) {
        console.error("Error fetching stream:", error);
        showError("Network error. Please try again.");
        setStream(null);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchStreamData();
    }
  }, [params.id, router]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLogoUploadSuccess = (fileUrl) => {
    setFormData((prev) => ({
      ...prev,
      logo: { preview: fileUrl, fileUrl },
    }));
  };

  const handleLogoUploadError = (error) => {
    showError(`Logo upload failed: ${error}`);
  };

  const handleLogoRemove = () => {
    setFormData((prev) => ({
      ...prev,
      logo: null,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      showError("Please enter a stream name");
      return;
    }

    if (!formData.about.trim()) {
      showError("Please enter stream description");
      return;
    }

    try {
      setSubmitting(true);

      // Get access token
      const token = localStorage.getItem("token");
      if (!token) {
        showError("Please login again to continue");
        router.push("/login");
        return;
      }

      // Prepare data for API
      const apiData = {
        name: formData.name.trim(),
        about: formData.about.trim(),
        status: formData.status,
      };

      // Handle logo
      if (formData.logo?.fileUrl) {
        apiData.logo = formData.logo.fileUrl;
      } else if (formData.logo === null) {
        apiData.logo = null; // Explicitly set to null if removed
      }

      console.log("✅ Updating stream with data:", apiData);

      const response = await fetch(`/api/streams/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(apiData),
      });

      const result = await response.json();

      if (result.success) {
        showSuccess("Stream updated successfully!");
        // Redirect to streams list
        router.push("/admin/master/stream");
      } else {
        showError(result.error || "Failed to update stream");
      }
    } catch (error) {
      console.error("Error updating stream:", error);
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
          <div className="h-6 bg-gray-200 dark:bg-slate-800 rounded w-48 mb-1 animate-pulse"></div>
          <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-75 animate-pulse"></div>
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
            <div className="h-7 bg-gray-200 dark:bg-slate-800 rounded w-30 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="h-full p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Stream Not Found
          </h1>
          <p className="text-gray-600 dark:text-white/70 mb-6">
            The stream you're looking for doesn't exist.
          </p>
          <Link
            href="/admin/master/stream"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-700 transition-colors"
          >
            Back to Streams
          </Link>
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
          Edit Stream - {formData.name}
        </h1>
        <p className="text-xs text-gray-600 dark:text-white/70">
          Update stream information and details
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
              uploadType="streams"
              identifier={`stream-${params.id}`}
              onUploadSuccess={handleLogoUploadSuccess}
              onUploadError={handleLogoUploadError}
              showUploadProgress={true}
              title="Stream Logo"
              preview={formData.logo?.preview}
              onRemove={handleLogoRemove}
              accept="image/*"
              maxSize="2MB"
              width="200px"
              height="200px"
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
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
              className="px-3 py-1.5 text-xs text-white border-none rounded cursor-pointer font-medium flex items-center gap-2 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Updating Stream...</span>
                </>
              ) : (
                "Update Stream"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
