"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ApnaSelect from "@/components/utils/ApnaSelect";
import { showSuccess, showError } from "@/components/utils/ApnaNotify";

export default function AddNewsCategory() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    color: "#6b7280",
    displayOrder: 0,
    status: "active",
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

    // Auto-generate slug when name changes (only if slug is empty or matches previous auto-generated slug)
    if (field === "name") {
      const autoSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim("-");

      // Only auto-update slug if it's empty or if it looks like it was auto-generated
      const currentSlug = formData.slug;
      if (
        !currentSlug ||
        currentSlug ===
          formData.name
            ?.toLowerCase()
            .replace(/[^a-z0-9 -]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .trim("-")
      ) {
        setFormData((prev) => ({
          ...prev,
          slug: autoSlug,
        }));
      }
    }
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
      showError("Please enter a category name");
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
        slug: formData.slug.trim(),
        description: formData.description.trim(),
        color: formData.color,
        displayOrder: parseInt(formData.displayOrder) || 0,
        status: formData.status,
      };

      console.log("📤 Final API data:", apiData);

      // Make API call to create category
      const response = await fetch("/api/news-categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(apiData),
      });

      const result = await response.json();

      if (result.success) {
        showSuccess("Category added successfully!");

        // Reset form
        setFormData({
          name: "",
          slug: "",
          description: "",
          color: "#6b7280",
          displayOrder: 0,
          status: "active",
        });

        // Redirect after success
        setTimeout(() => {
          router.push("/admin/news-categories");
        }, 2000);
      } else {
        showError(result.error || "Failed to add category");
      }
    } catch (error) {
      console.error("Error adding category:", error);
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

        <div className="bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800 rounded-lg p-5 shadow-sm transition-colors">
          {/* First Row - Category Name and Status */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-20 mb-2 animate-pulse"></div>
              <div className="h-7 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
            </div>
            <div>
              <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-16 mb-2 animate-pulse"></div>
              <div className="h-7 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
            </div>
          </div>

          {/* Slug Field */}
          <div className="mb-5">
            <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-12 mb-2 animate-pulse"></div>
            <div className="h-7 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
            <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded w-40 mt-1 animate-pulse"></div>
          </div>

          {/* Description Field */}
          <div className="mb-5">
            <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-20 mb-2 animate-pulse"></div>
            <div className="h-16 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
            <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded w-32 mt-1 animate-pulse"></div>
          </div>

          {/* Color and Display Order Row */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-12 mb-2 animate-pulse"></div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
                <div className="h-7 bg-gray-200 dark:bg-slate-800 rounded flex-1 animate-pulse"></div>
              </div>
            </div>
            <div>
              <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-24 mb-2 animate-pulse"></div>
              <div className="h-7 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="border-t border-gray-200 dark:border-slate-800 pt-4 flex justify-end gap-2">
            <div className="h-7 bg-gray-200 dark:bg-slate-800 rounded w-15 animate-pulse"></div>
            <div className="h-7 bg-gray-200 dark:bg-slate-800 rounded w-25 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  const pageWrapperClass =
    "h-full p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300";
  const headerLinkClass =
    "text-gray-600 dark:text-white/70 no-underline text-xs flex items-center gap-1 transition-colors";
  const headerIconClass = "w-3.5 h-3.5 text-gray-500 dark:text-white/60";
  const headerTitleClass =
    "text-xl font-semibold text-gray-900 dark:text-white mb-0.5";
  const headerSubtitleClass = "text-xs text-gray-600 dark:text-white/70";
  const cardClass =
    "bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800 rounded-lg p-5 shadow-sm transition-colors";
  const labelClassName =
    "text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block transition-colors";
  const inputClassName =
    "w-full px-2 py-1.5 border border-gray-300 dark:border-slate-700 rounded text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary/30 bg-white dark:bg-slate-900/70 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/50 transition-colors";
  const textareaClassName = `${inputClassName} resize-none`;
  const helperTextClassName =
    "text-xs text-gray-500 dark:text-white/60 mt-1 transition-colors";
  const colorInputClass =
    "h-8 w-8 p-0 border border-gray-300 dark:border-slate-700 rounded cursor-pointer bg-white dark:bg-slate-900/70";
  const actionLinkClass =
    "px-3 py-1.5 text-xs text-gray-700 dark:text-white/80 border border-gray-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900/70 no-underline hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors";
  const submitButtonClass =
    "px-3 py-1.5 text-xs text-white border-none rounded font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary/30";
  const selectButtonClassName =
    "!w-full !justify-between !px-2 !py-1.5 !text-xs border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900/70 text-gray-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary/30";
  const selectDropdownClassName =
    "bg-white dark:bg-slate-900/90 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white";
  const selectOptionClassName =
    "hover:bg-primary-50 dark:hover:bg-primary/20 text-gray-900 dark:text-white";

  return (
    <div className={pageWrapperClass}>
      {/* Page Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-0.5">
          <Link href="/admin/news-categories" className={headerLinkClass}>
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
            Back to Categories
          </Link>
        </div>
        <h1 className={headerTitleClass}>Add New Category</h1>
        <p className={headerSubtitleClass}>
          Create a new news category for organizing articles
        </p>
      </div>

      {/* Form */}
      <div className={cardClass}>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 mb-5">
            {/* Category Name */}
            <div>
              <label className={labelClassName}>Category Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter category name"
                required
                className={inputClassName}
              />
            </div>

            {/* Status */}
            <div>
              <ApnaSelect
                title="Status"
                options={[
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                ]}
                value={formData.status}
                onChange={(value) => handleInputChange("status", value)}
                placeholder="Choose status"
                searchable={true}
                required={true}
              />
            </div>
          </div>

          {/* Slug */}
          <div className="mb-5">
            <label className={labelClassName}>Slug *</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => handleInputChange("slug", e.target.value)}
              placeholder="auto-generated-slug"
              required
              className={inputClassName}
            />
          </div>

          {/* Description */}
          <div className="mb-5">
            <label className={labelClassName}>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={3}
              placeholder="Brief description of the category (optional)"
              maxLength={500}
              className={textareaClassName}
            />
            <p className={helperTextClassName}>
              {formData.description.length}/500 characters
            </p>
          </div>

          {/* Color and Display Order */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            {/* Color */}
            <div>
              <label className={labelClassName}>Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => handleInputChange("color", e.target.value)}
                  className={colorInputClass}
                  title="Choose category color"
                />
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => handleInputChange("color", e.target.value)}
                  placeholder="#RRGGBB"
                  maxLength={7}
                  className={inputClassName}
                />
              </div>
            </div>

            {/* Display Order */}
            <div>
              <label className={labelClassName}>Display Order</label>
              <input
                type="number"
                value={formData.displayOrder}
                onChange={(e) =>
                  handleInputChange("displayOrder", e.target.value)
                }
                placeholder="0"
                className={inputClassName}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2 border-t border-gray-200 dark:border-slate-800 pt-4">
            <Link href="/admin/news-categories" className={actionLinkClass}>
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className={`${submitButtonClass} ${
                submitting
                  ? "bg-gray-400 dark:bg-slate-700 cursor-not-allowed"
                  : "bg-primary hover:bg-primary-700 cursor-pointer"
              }`}
            >
              {submitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating Category...</span>
                </div>
              ) : (
                "Add Category"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
