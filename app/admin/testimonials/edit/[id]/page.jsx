"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import ApnaSelect from "@/components/utils/ApnaSelect";
import { showSuccess, showError } from "@/components/utils/ApnaNotify";
import TestimonialVideoFields from "@/components/admin/testimonials/TestimonialVideoFields";

export default function EditTestimonialPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [persistedVideoUrl, setPersistedVideoUrl] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    designation: "",
    college: "",
    testimonial: "",
    rating: 5,
    avatar: "",
    image: "",
    videoUrl: "",
    videoType: "",
    isFeatured: false,
    status: "draft",
    displayOrder: 0,
  });

  // Fetch testimonial data
  useEffect(() => {
    const fetchTestimonial = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) {
          showError("Please login again to continue");
          router.push("/admin/login");
          return;
        }

        const response = await fetch(`/api/testimonials/${params.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json();

        if (result.success) {
          const testimonial = result.data;
          setFormData({
            name: testimonial.name || "",
            designation: testimonial.designation || "",
            college: testimonial.college || "",
            testimonial: testimonial.testimonial || "",
            rating: testimonial.rating || 5,
            avatar: testimonial.avatar || "",
            image: testimonial.image || "",
            videoUrl: testimonial.videoUrl || "",
            videoType: testimonial.videoType || "",
            isFeatured: testimonial.isFeatured || false,
            status: testimonial.status || "draft",
            displayOrder: testimonial.displayOrder || 0,
          });
          setPersistedVideoUrl(
            testimonial.videoType === "local"
              ? testimonial.videoUrl || ""
              : ""
          );
        } else {
          showError(result.error || "Failed to fetch testimonial");
          router.push("/admin/testimonials");
        }
      } catch (error) {
        console.error("Error fetching testimonial:", error);
        showError("Network error. Please try again.");
        router.push("/admin/testimonials");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchTestimonial();
    }
  }, [params.id, router]);

  // Auto-generate avatar from name
  useEffect(() => {
    if (formData.name) {
      const nameParts = formData.name
        .trim()
        .split(" ")
        .filter((part) => part.length > 0);
      let initials = "";

      if (nameParts.length === 1) {
        // Single word: take first 2 characters
        initials = nameParts[0].substring(0, 2).toUpperCase();
      } else {
        // Multiple words: take first character of first 2 words
        initials = nameParts
          .slice(0, 2)
          .map((part) => part.charAt(0).toUpperCase())
          .join("");
      }

      setFormData((prev) => ({
        ...prev,
        avatar: initials,
      }));
    }
  }, [formData.name]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
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
      showError("Please enter a name");
      return;
    }

    if (!formData.designation.trim()) {
      showError("Please enter a designation");
      return;
    }

    if (!formData.college.trim()) {
      showError("Please enter a college name");
      return;
    }

    if (!formData.testimonial.trim()) {
      showError("Please enter testimonial content");
      return;
    }

    if (!formData.avatar.trim()) {
      showError("Please enter avatar initials");
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
        designation: formData.designation.trim(),
        college: formData.college.trim(),
        testimonial: formData.testimonial.trim(),
        rating: formData.rating,
        avatar: formData.avatar.trim(),
        image: formData.image || null,
        videoUrl: formData.videoUrl.trim() || null,
        videoType: formData.videoUrl.trim() ? formData.videoType : null,
        isFeatured: formData.isFeatured,
        status: formData.status,
        displayOrder: formData.displayOrder,
      };

      console.log("📤 Final API data:", apiData);

      // Make API call to update testimonial
      const response = await fetch(`/api/testimonials/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(apiData),
      });

      const result = await response.json();

      if (result.success) {
        showSuccess("Testimonial updated successfully!");

        // Redirect after success
        setTimeout(() => {
          router.push("/admin/testimonials");
        }, 2000);
      } else {
        showError(result.error || "Failed to update testimonial");
      }
    } catch (error) {
      console.error("Error updating testimonial:", error);
      showError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full p-4 sm:p-5 md:p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
        {/* Loading State */}
        <div className="mb-4">
          <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-30 mb-2 animate-pulse"></div>
          <div className="h-6 bg-gray-200 dark:bg-slate-800 rounded w-44 mb-1 animate-pulse"></div>
          <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-64 animate-pulse"></div>
        </div>

        <div className="bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800 rounded-lg p-5 shadow-sm transition-colors duration-300">
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
          <div className="mb-5">
            <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-20 mb-2 animate-pulse"></div>
            <div className="h-7 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
          </div>
          <div className="mb-5">
            <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-24 mb-2 animate-pulse"></div>
            <div className="h-20 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-16 mb-2 animate-pulse"></div>
              <div className="h-7 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
            </div>
            <div>
              <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-20 mb-2 animate-pulse"></div>
              <div className="h-7 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-slate-800 pt-4 flex justify-end gap-2 transition-colors duration-300">
            <div className="h-7 bg-gray-200 dark:bg-slate-800 rounded w-15 animate-pulse"></div>
            <div className="h-7 bg-gray-200 dark:bg-slate-800 rounded w-25 animate-pulse"></div>
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
            href="/admin/testimonials"
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
            Back to Testimonials
          </Link>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white transition-colors duration-300 mb-0.5">
          Edit Testimonial
        </h1>
        <p className="text-xs text-gray-600 dark:text-white/70 transition-colors duration-300">
          Update testimonial information for CCIC
        </p>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800 rounded-lg p-5 shadow-sm transition-colors duration-300">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 mb-5">
            {/* Name */}
            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block transition-colors duration-300">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter full name"
                required
                className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-700 rounded text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary-50 bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors duration-300 placeholder:text-gray-400 dark:placeholder:text-white/40"
              />
            </div>

            {/* Designation */}
            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block transition-colors duration-300">
                Designation *
              </label>
              <input
                type="text"
                value={formData.designation}
                onChange={(e) =>
                  handleInputChange("designation", e.target.value)
                }
                placeholder="e.g., International Student, University Graduate"
                required
                className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-700 rounded text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary-50 bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors duration-300 placeholder:text-gray-400 dark:placeholder:text-white/40"
              />
            </div>
          </div>

          {/* College */}
          <div className="mb-5">
            <label className="text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block transition-colors duration-300">
              College *
            </label>
            <input
              type="text"
              value={formData.college}
              onChange={(e) => handleInputChange("college", e.target.value)}
              placeholder="Enter college name"
              required
              className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-700 rounded text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary-50 bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors duration-300 placeholder:text-gray-400 dark:placeholder:text-white/40"
            />
          </div>

          {/* Testimonial */}
          <div className="mb-5">
            <label className="text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block transition-colors duration-300">
              Testimonial Content *
            </label>
            <textarea
              value={formData.testimonial}
              onChange={(e) => handleInputChange("testimonial", e.target.value)}
              rows={5}
              placeholder="Enter the testimonial content..."
              required
              className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-700 rounded text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary-50 bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors duration-300 placeholder:text-gray-400 dark:placeholder:text-white/40"
            />
          </div>

          {/* Rating and Avatar Row */}
          <TestimonialVideoFields
            videoType={formData.videoType}
            videoUrl={formData.videoUrl}
            persistedVideoUrl={persistedVideoUrl}
            onChange={({ videoType, videoUrl }) =>
              setFormData((current) => ({
                ...current,
                videoType,
                videoUrl,
              }))
            }
          />

          {/* Rating and Avatar Row */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            {/* Rating */}
            <div>
              <ApnaSelect
                title="Rating"
                options={[
                  { value: 1, label: "1 Star" },
                  { value: 2, label: "2 Stars" },
                  { value: 3, label: "3 Stars" },
                  { value: 4, label: "4 Stars" },
                  { value: 5, label: "5 Stars" },
                ]}
                value={formData.rating}
                onChange={(value) =>
                  handleInputChange("rating", parseInt(value))
                }
                placeholder="Choose rating"
                searchable={true}
                required={true}
              />
            </div>

            {/* Avatar */}
            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block transition-colors duration-300">
                Avatar Initials *
              </label>
              <input
                type="text"
                value={formData.avatar}
                onChange={(e) =>
                  handleInputChange("avatar", e.target.value.toUpperCase())
                }
                placeholder="e.g., PS, RK"
                maxLength={10}
                required
                className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-700 rounded text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary-50 bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors duration-300 placeholder:text-gray-400 dark:placeholder:text-white/40"
              />
            </div>
          </div>

          {/* Status */}
          <div className="mb-5">
            <ApnaSelect
              title="Status"
              options={[
                { value: "draft", label: "Draft" },
                { value: "published", label: "Published" },
                { value: "archived", label: "Archived" },
              ]}
              value={formData.status}
              onChange={(value) => handleInputChange("status", value)}
              placeholder="Choose status"
              searchable={true}
              required={true}
            />
          </div>

          {/* Featured Checkbox */}
          <div className="mb-5">
            <div className="flex items-center space-x-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isFeatured}
                  onChange={(e) =>
                    handleInputChange("isFeatured", e.target.checked)
                  }
                  className="rounded border-gray-300 dark:border-slate-700 text-primary focus:ring-primary bg-white dark:bg-slate-900 transition-colors duration-300"
                />
                <span className="ml-2 text-xs text-gray-700 dark:text-white/80 transition-colors duration-300">
                  Featured
                </span>
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2 border-t border-gray-200 dark:border-slate-800 pt-4 transition-colors duration-300">
            <Link
              href="/admin/testimonials"
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
                  <span>Updating Testimonial...</span>
                </div>
              ) : (
                "Update Testimonial"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
