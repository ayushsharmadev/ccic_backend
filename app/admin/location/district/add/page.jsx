"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LocationSelects from "@/components/utils/LocationSelects";
import ApnaSelect from "@/components/utils/ApnaSelect";
import { showSuccess, showError } from "@/components/utils/ApnaNotify";

export default function AddDistrictPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    country: "",
    state: "",
    status: "active",
  });

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      showError("Please login again to continue");
      return;
    }

    if (!formData.name.trim() || !formData.country || !formData.state) {
      showError("District name, country and state are required!");
      return;
    }

    if (submitting) {
      return;
    }

    setSubmitting(true);

    try {
      const apiData = {
        name: formData.name.trim(),
        state: formData.state,
        status: formData.status,
      };

      const response = await fetch("/api/locations/districts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(apiData),
      });

      const result = await response.json();

      if (result.success) {
        showSuccess("District added successfully!");
        setFormData({ name: "", country: "", state: "", status: "active" });
        setTimeout(() => {
          router.push("/admin/location/district");
        }, 2000);
      } else {
        showError(result.error || "Failed to add district");
      }
    } catch (error) {
      console.error("Error adding district:", error);
      showError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
        <div className="h-6 bg-gray-200 dark:bg-slate-800 rounded w-44 mb-4 animate-pulse"></div>
        <div className="bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800 rounded-lg p-5 h-40 animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="h-full p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-0.5">
          <Link
            href="/admin/location/district"
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
            Back to Districts
          </Link>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-0.5">
          Add New District
        </h1>
        <p className="text-xs text-gray-600 dark:text-white/70">
          Create a new district under country and state
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800 rounded-lg p-5 shadow-sm transition-colors duration-300">
        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block">
              District Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter district name"
              className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-700 rounded text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary-50 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
            />
          </div>

          <LocationSelects
            country={formData.country}
            state={formData.state}
            onCountryChange={(value) =>
              setFormData((prev) => ({ ...prev, country: value, state: "" }))
            }
            onStateChange={(value) =>
              setFormData((prev) => ({ ...prev, state: value }))
            }
            showDistrict={false}
            gridClassName="grid grid-cols-2 gap-4 mb-5"
            countryApiUrl="/api/locations/country-master"
          />

          <div className="grid grid-cols-2 gap-4 mb-5">
            <ApnaSelect
              title="Status"
              value={formData.status}
              onChange={(status) =>
                setFormData((prev) => ({ ...prev, status }))
              }
              options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
              required
            />
          </div>

          <div className="border-t border-gray-200 dark:border-slate-800 pt-4 flex justify-end gap-2">
            <Link
              href="/admin/location/district"
              className="px-3 py-1.5 text-xs text-gray-700 dark:text-white/80 border border-gray-300 dark:border-slate-700 rounded no-underline hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-3 py-1.5 text-xs text-white bg-primary border border-primary rounded cursor-pointer hover:bg-primary-600 transition-colors disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Add District"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
