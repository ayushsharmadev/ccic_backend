"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { HiArrowLeft } from "react-icons/hi2";
import { showSuccess, showError } from "@/components/utils/ApnaNotify";
import { useAuth } from "@/contexts/AuthContext";
import ApnaSelect from "@/components/utils/ApnaSelect";
import ImageUpload from "@/components/utils/ImageUpload";

export default function AddDistanceMeter() {
  const router = useRouter();
  const { getAccessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    shortDescription: "",
    icon: null,
    status: "active",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = (file, preview) => {
    setFormData((prev) => ({
      ...prev,
      icon: preview,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      showError("Distance meter name is required");
      return;
    }

    try {
      setLoading(true);

      const token = getAccessToken();
      if (!token) {
        showError("Authentication required. Please log in again.");
        return;
      }

      const response = await fetch("/api/distance-meters", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        showSuccess("Distance meter created successfully!");
        router.push("/admin/distance-meters");
      } else {
        showError(data.error || "Failed to create distance meter");
      }
    } catch (error) {
      console.error("Error creating distance meter:", error);
      showError("Failed to create distance meter. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full p-4 sm:p-5 md:p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-300 mb-1">
              Add New Distance Meter
            </h1>
            <p className="text-sm text-gray-600 dark:text-white/70 transition-colors duration-300">
              Create a new distance meter entry
            </p>
          </div>
          <Link
            href="/admin/distance-meters"
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-white/80 border border-gray-300 dark:border-slate-700 rounded hover:bg-gray-50 dark:hover:bg-slate-900/60 transition-colors no-underline"
          >
            <HiArrowLeft className="w-4 h-4" />
            Back to Distance Meters
          </Link>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800 rounded-lg p-5 shadow-sm transition-colors duration-300">
          {/* Basic Information */}
          <div className="border-b border-gray-200 dark:border-slate-800 pb-4 mb-4 transition-colors duration-300">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-300 mb-4">
              Basic Information
            </h2>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block transition-colors duration-300">
                  Distance Meter Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter distance meter name"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-50 bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors duration-300 placeholder:text-gray-400 dark:placeholder:text-white/40"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block transition-colors duration-300">
                  Short Description
                </label>
                <textarea
                  name="shortDescription"
                  value={formData.shortDescription}
                  onChange={handleInputChange}
                  placeholder="Enter short description (max 500 characters)"
                  maxLength={500}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-50 resize-none bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors duration-300 placeholder:text-gray-400 dark:placeholder:text-white/40"
                />
                <p className="text-xs text-gray-500 dark:text-white/60 mt-1 transition-colors duration-300">
                  {formData.shortDescription.length}/500 characters
                </p>
              </div>

              <div>
                <ImageUpload
                  title="Upload Icon"
                  type="single"
                  accept="image/*"
                  maxSize="2MB"
                  width="100%"
                  height="150px"
                  preview={formData.icon}
                  onFileChange={handleImageUpload}
                  onRemove={() =>
                    setFormData((prev) => ({ ...prev, icon: null }))
                  }
                  uploadType="distance-meter"
                  identifier="icon"
                  showUploadProgress={true}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block transition-colors duration-300">
                  Status *
                </label>
                <ApnaSelect
                  title=""
                  options={[
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" },
                  ]}
                  value={formData.status}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, status: value }))
                  }
                  placeholder="Select status"
                  required={true}
                  buttonClassName="w-full px-3 py-2 rounded text-sm text-left flex items-center justify-between outline-none transition-all duration-200 border border-gray-300 dark:border-slate-700 focus:border-primary focus:ring-2 focus:ring-primary-50 bg-white dark:bg-slate-900 text-gray-900 dark:text-white cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-3">
          <Link
            href="/admin/distance-meters"
            className="px-4 py-2 text-sm text-gray-700 dark:text-white/80 border border-gray-300 dark:border-slate-700 rounded hover:bg-gray-50 dark:hover:bg-slate-900/60 transition-colors no-underline"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm bg-primary text-white rounded hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            {loading ? "Creating..." : "Create Distance Meter"}
          </button>
        </div>
      </form>
    </div>
  );
}
