"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ApnaEditor from "@/components/utils/ApnaEditor";
import { showSuccess, showError } from "@/components/utils/ApnaNotify";
import { useAuth } from "@/contexts/AuthContext";

export default function EditCollegeNoticePage({ params }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const { getAccessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [collegeName, setCollegeName] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    displayOrder: 0,
  });

  // Fetch college name and notice data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setPageLoading(true);

        // Fetch college name
        const collegeResponse = await fetch(
          `/api/colleges/${resolvedParams.collegeId}`
        );
        const collegeData = await collegeResponse.json();
        if (collegeData.success) {
          setCollegeName(collegeData.data.name);
        }

        // Fetch notice data
        const token = getAccessToken();
        if (!token) {
          showError("Authentication required. Please log in again.");
          return;
        }

        const noticeResponse = await fetch(
          `/api/notices/${resolvedParams.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const noticeData = await noticeResponse.json();

        if (noticeData.success) {
          const notice = noticeData.data;
          setFormData({
            title: notice.title || "",
            content: notice.content || "",
            displayOrder: notice.displayOrder || 0,
          });
        } else {
          showError(noticeData.error || "Failed to fetch notice");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        showError("Error fetching data");
      } finally {
        setPageLoading(false);
      }
    };

    fetchData();
  }, [resolvedParams.collegeId, resolvedParams.id]);

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

      const response = await fetch(`/api/notices/${resolvedParams.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        showSuccess("Notice updated successfully!");
        router.push(`/admin/college/notices/${resolvedParams.collegeId}`);
      } else {
        showError(data.error || "Failed to update notice");
      }
    } catch (error) {
      console.error("Error updating notice:", error);
      showError("Error updating notice");
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

  if (pageLoading) {
    return (
      <div className={pageWrapperClass}>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500 dark:text-white/60 transition-colors">
            Loading notice...
          </div>
        </div>
      </div>
    );
  }

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
        <h1 className={headerTitleClass}>Edit Notice - {collegeName}</h1>
        <p className={headerSubtitleClass}>Update notice information</p>
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
            {loading ? "Updating..." : "Update Notice"}
          </button>
        </div>
      </form>
    </div>
  );
}
