"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ApnaEditor from "@/components/utils/ApnaEditor";
import { showSuccess, showError } from "@/components/utils/ApnaNotify";
import { useAuth } from "@/contexts/AuthContext";

export default function AddCollegeNoticePage({ params }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const { getAccessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [collegeName, setCollegeName] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    displayOrder: 0,
  });

  // Fetch college name
  useEffect(() => {
    const fetchCollegeName = async () => {
      try {
        const response = await fetch(
          `/api/colleges/${resolvedParams.collegeId}`
        );
        const data = await response.json();
        if (data.success) {
          setCollegeName(data.data.name);
        }
      } catch (error) {
        console.error("Error fetching college name:", error);
      }
    };
    fetchCollegeName();
  }, [resolvedParams.collegeId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      showError("Title is required");
      return;
    }

    if (!formData.content.trim()) {
      showError("Content is required");
      return;
    }

    try {
      setLoading(true);
      const token = getAccessToken();
      if (!token) {
        showError("Authentication required. Please log in again.");
        return;
      }

      const response = await fetch("/api/notices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          college: resolvedParams.collegeId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        showSuccess("Notice created successfully!");
        router.push(`/admin/college/notices/${resolvedParams.collegeId}`);
      } else {
        showError(data.error || "Failed to create notice");
      }
    } catch (error) {
      console.error("Error creating notice:", error);
      showError("Error creating notice");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push(`/admin/college/notices/${resolvedParams.collegeId}`);
  };

  const pageWrapperClass =
    "h-full p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300";
  const headerLinkClass =
    "text-gray-600 dark:text-white/70 no-underline text-xs flex items-center gap-1 transition-colors";
  const headerIconClass = "w-3.5 h-3.5 text-gray-500 dark:text-white/60";
  const headerTitleClass =
    "text-xl font-semibold text-gray-900 dark:text-white mb-0.5";
  const headerSubtitleClass = "text-xs text-gray-600 dark:text-white/70";
  const cardClass =
    "bg-white dark:bg-slate-900/70 rounded-lg shadow-sm border border-gray-200 dark:border-slate-800 p-6 space-y-4 transition-colors";
  const labelClassName =
    "block text-sm font-medium text-gray-700 dark:text-white/80 mb-1.5 transition-colors";
  const inputClassName =
    "w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary/30 focus:border-transparent bg-white dark:bg-slate-900/70 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/50 transition-colors";
  const helperTextClassName =
    "text-xs text-gray-500 dark:text-white/60 mt-1 transition-colors";
  const secondaryButtonClass =
    "px-6 py-2 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-white/80 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed";
  const primaryButtonClass =
    "px-6 py-2 text-white bg-primary hover:bg-primary-700 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className={pageWrapperClass}>
      {/* Page Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-0.5">
          <Link
            href={`/admin/college/notices/${resolvedParams.collegeId}`}
            className={headerLinkClass}
          >
            <svg
              className={headerIconClass}
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
            Back to Notices
          </Link>
        </div>
        <h1 className={headerTitleClass}>Add New Notice - {collegeName}</h1>
        <p className={headerSubtitleClass}>
          Create a new notice for this college
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className={cardClass}>
          {/* Title */}
          <div>
            <label className={labelClassName}>
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className={inputClassName}
              placeholder="Enter notice title"
              required
            />
          </div>

          {/* Content */}
          <div>
            <label className={labelClassName}>
              Content <span className="text-red-500">*</span>
            </label>
            <ApnaEditor
              value={formData.content}
              onChange={(value) => setFormData({ ...formData, content: value })}
              placeholder="Enter notice content"
              className="min-h-[300px]"
              showToolbar={true}
            />
          </div>

          {/* Display Order */}
          <div>
            <label className={labelClassName}>Display Order</label>
            <input
              type="number"
              value={formData.displayOrder}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  displayOrder: parseInt(e.target.value) || 0,
                })
              }
              className={inputClassName}
              placeholder="0"
            />
            <p className={helperTextClassName}>Lower numbers appear first</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={handleCancel}
            className={secondaryButtonClass}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={primaryButtonClass}
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Notice"}
          </button>
        </div>
      </form>
    </div>
  );
}
