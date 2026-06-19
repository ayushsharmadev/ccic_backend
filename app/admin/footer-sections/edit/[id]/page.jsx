"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import ApnaSelect from "@/components/utils/ApnaSelect";
import { showSuccess, showError } from "@/components/utils/ApnaNotify";

export default function EditFooterSectionPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    displayOrder: 0,
    links: [],
    isActive: true,
    sectionType: "links",
    showArrowIcon: false,
  });
  const [newLink, setNewLink] = useState({
    title: "",
    url: "",
    openInNewTab: false,
    displayOrder: 0,
  });

  // Fetch section data
  useEffect(() => {
    const fetchSection = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) {
          showError("Please login again to continue");
          router.push("/admin/login");
          return;
        }

        const response = await fetch(`/api/footer-sections/${params.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json();

        if (result.success) {
          const section = result.data;
          setFormData({
            title: section.title || "",
            displayOrder: section.displayOrder || 0,
            links: section.links || [],
            isActive: section.isActive !== undefined ? section.isActive : true,
            sectionType: section.sectionType || "links",
            showArrowIcon: section.showArrowIcon || false,
          });
        } else {
          showError(result.error || "Failed to fetch footer section");
          router.push("/admin/footer-sections");
        }
      } catch (error) {
        console.error("Error fetching footer section:", error);
        showError("Network error. Please try again.");
        router.push("/admin/footer-sections");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchSection();
    }
  }, [params.id, router]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddLink = () => {
    if (!newLink.title.trim() || !newLink.url.trim()) {
      showError("Please enter both title and URL for the link");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      links: [...(prev.links || []), { ...newLink }],
    }));

    setNewLink({
      title: "",
      url: "",
      openInNewTab: false,
      displayOrder: formData.links?.length || 0,
    });
  };

  const handleRemoveLink = (index) => {
    setFormData((prev) => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      showError("Please login again to continue");
      return;
    }

    if (!formData.title.trim()) {
      showError("Please enter a section title");
      return;
    }

    if (submitting) {
      return;
    }

    setSubmitting(true);

    try {
      const apiData = {
        title: formData.title.trim(),
        displayOrder: formData.displayOrder || 0,
        links: formData.links || [],
        isActive: formData.isActive,
        sectionType: formData.sectionType || "links",
        showArrowIcon: formData.showArrowIcon || false,
      };

      const response = await fetch(`/api/footer-sections/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(apiData),
      });

      const result = await response.json();

      if (result.success) {
        showSuccess("Footer section updated successfully!");

        setTimeout(() => {
          router.push("/admin/footer-sections");
        }, 2000);
      } else {
        showError(result.error || "Failed to update footer section");
      }
    } catch (error) {
      console.error("Error updating footer section:", error);
      showError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full p-4 sm:p-5 md:p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
        <div className="mb-4">
          <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-30 mb-2 animate-pulse"></div>
          <div className="h-6 bg-gray-200 dark:bg-slate-800 rounded w-44 mb-1 animate-pulse"></div>
        </div>
        <div className="bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800 rounded-lg p-5 shadow-sm">
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-20 mb-2 animate-pulse"></div>
            <div className="h-7 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full p-4 sm:p-5 md:p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Page Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-0.5">
          <Link
            href="/admin/footer-sections"
            className="text-gray-600 dark:text-white/70 no-underline text-xs flex items-center gap-1 transition-colors duration-300"
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
            Back to Footer Sections
          </Link>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white transition-colors duration-300 mb-0.5">
          Edit Footer Section
        </h1>
        <p className="text-xs text-gray-600 dark:text-white/70 transition-colors duration-300">
          Update footer section information
        </p>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800 rounded-lg p-5 shadow-sm transition-colors duration-300">
        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div className="mb-5">
            <label className="text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block transition-colors duration-300">
              Section Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="e.g., Useful Links, Quick Information"
              required
              className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-700 rounded text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary-50 bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors duration-300 placeholder:text-gray-400 dark:placeholder:text-white/40"
            />
          </div>

          {/* Display Order and Section Type */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block transition-colors duration-300">
                Display Order
              </label>
              <input
                type="number"
                value={formData.displayOrder}
                onChange={(e) =>
                  handleInputChange(
                    "displayOrder",
                    parseInt(e.target.value) || 0
                  )
                }
                min="0"
                className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-700 rounded text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary-50 bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors duration-300"
              />
            </div>

            <div>
              <ApnaSelect
                title="Section Type"
                options={[
                  { value: "links", label: "Links" },
                  { value: "newsletter", label: "Newsletter" },
                  { value: "company_info", label: "Company Info" },
                  { value: "social_media", label: "Social Media" },
                ]}
                value={formData.sectionType}
                onChange={(value) => handleInputChange("sectionType", value)}
                placeholder="Choose section type"
                searchable={true}
                required={true}
              />
            </div>
          </div>

          {/* Links Section */}
          <div className="mb-5">
            <label className="text-xs font-medium text-gray-700 dark:text-white/80 mb-2 block transition-colors duration-300">
              Links
            </label>

            {/* Add Link Form */}
            <div className="bg-gray-50 dark:bg-slate-800/50 p-3 rounded mb-3">
              <div className="grid grid-cols-2 gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Link Title"
                  value={newLink.title}
                  onChange={(e) =>
                    setNewLink({ ...newLink, title: e.target.value })
                  }
                  className="px-2 py-1.5 border border-gray-300 dark:border-slate-700 rounded text-xs outline-none focus:border-primary bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                />
                <input
                  type="text"
                  placeholder="Link URL"
                  value={newLink.url}
                  onChange={(e) =>
                    setNewLink({ ...newLink, url: e.target.value })
                  }
                  className="px-2 py-1.5 border border-gray-300 dark:border-slate-700 rounded text-xs outline-none focus:border-primary bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newLink.openInNewTab}
                    onChange={(e) =>
                      setNewLink({ ...newLink, openInNewTab: e.target.checked })
                    }
                    className="rounded border-gray-300 dark:border-slate-700 text-primary focus:ring-primary bg-white dark:bg-slate-900"
                  />
                  <span className="ml-2 text-xs text-gray-700 dark:text-white/80">
                    Open in new tab
                  </span>
                </label>
                <button
                  type="button"
                  onClick={handleAddLink}
                  className="px-3 py-1 text-xs text-white bg-primary hover:bg-primary-700 rounded transition-colors"
                >
                  Add Link
                </button>
              </div>
            </div>

            {/* Links List */}
            {formData.links && formData.links.length > 0 ? (
              <div className="space-y-2">
                {formData.links.map((link, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-slate-800/50 rounded"
                  >
                    <div className="flex-1">
                      <div className="text-xs font-medium text-gray-900 dark:text-white">
                        {link.title}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-white/60">
                        {link.url}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveLink(index)}
                      className="px-2 py-1 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/20 rounded transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 dark:text-white/50">
                No links added yet
              </p>
            )}
          </div>

          {/* Show Arrow Icon */}
          <div className="mb-5">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.showArrowIcon}
                onChange={(e) =>
                  handleInputChange("showArrowIcon", e.target.checked)
                }
                className="rounded border-gray-300 dark:border-slate-700 text-primary focus:ring-primary bg-white dark:bg-slate-900 transition-colors duration-300"
              />
              <span className="ml-2 text-xs text-gray-700 dark:text-white/80 transition-colors duration-300">
                Show Arrow Icon (for Quick Links style)
              </span>
            </label>
          </div>

          {/* Active Status */}
          <div className="mb-5">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) =>
                  handleInputChange("isActive", e.target.checked)
                }
                className="rounded border-gray-300 dark:border-slate-700 text-primary focus:ring-primary bg-white dark:bg-slate-900 transition-colors duration-300"
              />
              <span className="ml-2 text-xs text-gray-700 dark:text-white/80 transition-colors duration-300">
                Active (Section will be visible on frontend)
              </span>
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2 border-t border-gray-200 dark:border-slate-800 pt-4 transition-colors duration-300">
            <Link
              href="/admin/footer-sections"
              className="px-3 py-1.5 text-xs text-gray-700 dark:text-white/80 border border-gray-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 no-underline hover:bg-gray-50 dark:hover:bg-slate-900/60 transition-colors duration-200"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className={`px-3 py-1.5 text-xs text-white border-none rounded font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                submitting
                  ? "bg-gray-400 dark:bg-slate-700 cursor-not-allowed"
                  : "bg-primary hover:bg-primary-700 cursor-pointer"
              }`}
            >
              {submitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Updating Section...</span>
                </div>
              ) : (
                "Update Section"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
