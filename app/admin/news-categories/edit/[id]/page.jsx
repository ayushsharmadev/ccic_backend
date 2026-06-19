"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import ApnaSelect from "@/components/utils/ApnaSelect";
import { showSuccess, showError } from "@/components/utils/ApnaNotify";

export default function EditNewsCategory() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [category, setCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    color: "#6b7280",
    displayOrder: 0,
    status: "active",
  });

  useEffect(() => {
    // Fetch real category data from API
    const fetchCategoryData = async () => {
      try {
        setLoading(true);

        // Get access token
        const token = localStorage.getItem("token");
        if (!token) {
          showError("Please login again to continue");
          router.push("/login");
          return;
        }

        const response = await fetch(`/api/news-categories/${params.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json();

        if (result.success) {
          const categoryData = result.data;
          setCategory(categoryData);
          setFormData({
            name: categoryData.name || "",
            slug: categoryData.slug || "",
            description: categoryData.description || "",
            color: categoryData.color || "#6b7280",
            displayOrder: categoryData.displayOrder || 0,
            status: categoryData.status || "active",
          });
        } else {
          showError(result.error || "Failed to fetch category data");
          setCategory(null);
        }
      } catch (error) {
        console.error("Error fetching category:", error);
        showError("Network error. Please try again.");
        setCategory(null);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchCategoryData();
    }
  }, [params.id, router]);

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

    // Validation
    if (!formData.name.trim()) {
      showError("Please enter a category name");
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
        slug: formData.slug.trim(),
        description: formData.description.trim(),
        color: formData.color,
        displayOrder: parseInt(formData.displayOrder) || 0,
        status: formData.status,
      };

      console.log("✅ Updating category with data:", apiData);

      const response = await fetch(`/api/news-categories/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(apiData),
      });

      const result = await response.json();

      if (result.success) {
        showSuccess("Category updated successfully!");
        // Redirect to categories list
        router.push("/admin/news-categories");
      } else {
        showError(result.error || "Failed to update category");
      }
    } catch (error) {
      console.error("Error updating category:", error);
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
            <div className="h-7 bg-gray-200 dark:bg-slate-800 rounded w-30 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="h-full p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Category Not Found
          </h1>
          <p className="text-gray-600 dark:text-white/70 mb-6">
            The category you're looking for doesn't exist.
          </p>
          <Link
            href="/admin/news-categories"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-700 transition-colors"
          >
            Back to Categories
          </Link>
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
    "px-3 py-1.5 text-xs text-white bg-primary border-none rounded cursor-pointer font-medium hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary/30";
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
        <h1 className={headerTitleClass}>Edit Category - {formData.name}</h1>
        <p className={headerSubtitleClass}>
          Update category information and details
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
              className={submitButtonClass}
            >
              {submitting ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Updating Category...</span>
                </>
              ) : (
                "Update Category"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
