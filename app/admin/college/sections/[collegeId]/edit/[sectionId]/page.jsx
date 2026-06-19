"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ApnaEditor from "@/components/utils/ApnaEditor";
import { showSuccess, showError } from "@/components/utils/ApnaNotify";
import { useAuth } from "@/contexts/AuthContext";

export default function EditSectionPage({ params }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const { getAccessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [collegeName, setCollegeName] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    tabName: "",
    content: "",
    displayOrder: 0,
  });

  // Fetch section data
  useEffect(() => {
    const fetchSection = async () => {
      try {
        setLoading(true);
        const token = getAccessToken();
        if (!token) {
          showError("Authentication required. Please log in again.");
          return;
        }

        const response = await fetch(
          `/api/facility-sections/${resolvedParams.sectionId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (data.success) {
          setFormData({
            title: data.data.title,
            tabName: data.data.tabName || data.data.title || "",
            content: data.data.content,
            displayOrder: data.data.displayOrder || 0,
          });
          setCollegeName(data.data.college?.name || "");
        } else {
          showError(data.error || "Failed to fetch section");
        }
      } catch (error) {
        console.error("Error fetching section:", error);
        showError("Error fetching section");
      } finally {
        setLoading(false);
      }
    };

    fetchSection();
  }, [resolvedParams.sectionId]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };

      if (field === "title") {
        const prevTitle = prev.title?.trim() || "";
        const prevTabName = prev.tabName?.trim() || "";
        const incomingTitle = value;

        if (!prevTabName || prevTabName === prevTitle) {
          next.tabName = incomingTitle;
        }
      }

      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      showError("Please enter section title");
      return;
    }

    if (!formData.tabName.trim()) {
      showError("Please enter tab name");
      return;
    }

    if (!formData.content.trim()) {
      showError("Please enter section content");
      return;
    }

    setSubmitting(true);

    try {
      const token = getAccessToken();
      if (!token) {
        showError("Authentication required. Please log in again.");
        return;
      }

      const response = await fetch(
        `/api/facility-sections/${resolvedParams.sectionId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: formData.title.trim(),
            tabName: formData.tabName.trim(),
            content: formData.content,
            displayOrder: parseInt(formData.displayOrder) || 0,
            status: "active",
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        showSuccess("Section updated successfully!");
        setTimeout(() => {
          router.push(`/admin/college/sections/${resolvedParams.collegeId}`);
        }, 1500);
      } else {
        showError(data.error || "Failed to update section");
      }
    } catch (error) {
      console.error("Error updating section:", error);
      showError("Error updating section. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-gray-200 dark:bg-slate-800 rounded w-48"></div>
          <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-96"></div>
        </div>
      </div>
    );
  }

  const pageWrapperClass =
    "h-full p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300";
  const headerLinkClass =
    "text-gray-600 dark:text-white/70 no-underline text-xs flex items-center gap-1 transition-colors";
  const headerIconClass = "w-3.5 h-3.5 text-gray-500 dark:text-white/60";
  const headerTitleClass = "text-xl font-semibold text-gray-900 dark:text-white mb-0.5";
  const headerSubtitleClass = "text-xs text-gray-600 dark:text-white/70";
  const cardClass =
    "bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800 rounded-lg p-5 shadow-sm transition-colors";
  const labelClassName =
    "text-sm font-medium text-gray-700 dark:text-white/80 mb-1 block transition-colors";
  const inputClassName =
    "w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary/30 bg-white dark:bg-slate-900/70 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/50 transition-colors";
  const helperTextClassName =
    "text-xs text-gray-500 dark:text-white/60 mt-1 transition-colors";
  const primaryButtonClass =
    "px-6 py-2 rounded-lg text-white font-medium text-sm shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary/30 bg-primary hover:bg-primary-700";
  const secondaryLinkClass =
    "px-6 py-2 rounded-lg border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-white/80 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors font-medium text-sm no-underline inline-flex items-center justify-center";

  return (
    <div className={pageWrapperClass}>
      {/* Page Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-0.5">
          <Link
            href={`/admin/college/sections/${resolvedParams.collegeId}`}
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
            Back to Sections
          </Link>
        </div>
        <h1 className={headerTitleClass}>
          Edit Section - {collegeName}
        </h1>
        <p className={headerSubtitleClass}>Update section content</p>
      </div>

      {/* Form */}
      <div className={cardClass}>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className={labelClassName}>
              Section Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="e.g., Library Facilities, Sports Complex"
              required
              className={inputClassName}
            />
          </div>

          {/* Tab Name */}
          <div>
            <label className={labelClassName}>
              Tab Name *
            </label>
            <input
              type="text"
              value={formData.tabName}
              onChange={(e) => handleInputChange("tabName", e.target.value)}
              placeholder="e.g., Facilities, Campus Life"
              required
              className={inputClassName}
            />
          </div>

          {/* Content with Editor */}
          <div>
            <label className={labelClassName}>
              Section Content *
            </label>
            <ApnaEditor
              value={formData.content}
              onChange={(value) => handleInputChange("content", value)}
              placeholder="Enter detailed section content..."
              className="min-h-[300px]"
              showToolbar={true}
            />
          </div>

          {/* Display Order */}
          <div>
            <label className={labelClassName}>
              Display Order
            </label>
            <input
              type="number"
              value={formData.displayOrder}
              onChange={(e) =>
                handleInputChange("displayOrder", e.target.value)
              }
              placeholder="0"
              className={inputClassName}
            />
            <p className={helperTextClassName}>
              Lower numbers appear first
            </p>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-slate-800">
            <button
              type="submit"
              disabled={submitting}
              className={primaryButtonClass}
            >
              {submitting ? "Updating..." : "Update Section"}
            </button>
            <Link
              href={`/admin/college/sections/${resolvedParams.collegeId}`}
              className={secondaryLinkClass}
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
