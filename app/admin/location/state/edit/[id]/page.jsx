"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import ImageUpload from "@/components/utils/ImageUpload";
import ApnaSelect from "@/components/utils/ApnaSelect";
import {
  showSuccess,
  showError,
  showInfo,
} from "@/components/utils/ApnaNotify";

export default function EditStatePage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [countries, setCountries] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    country: "",
    logo: null,
    map: null,
  });
  const [logoPreview, setLogoPreview] = useState(null);
  const [mapPreview, setMapPreview] = useState(null);

  useEffect(() => {
    // Fetch state data from API
    const fetchStateData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          showError("Please login again to continue");
          return;
        }

        const [stateResponse, countriesResponse] = await Promise.all([
          fetch(`/api/locations/states/${params.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/locations/country-master?all=true"),
        ]);

        const result = await stateResponse.json();
        const countriesResult = await countriesResponse.json();

        if (countriesResult.success) {
          setCountries(
            countriesResult.data.map((country) => ({
              value: country._id,
              label: country.name,
            }))
          );
        }

        if (result.success) {
          const stateData = result.data;
          setFormData({
            name: stateData.name || "",
            code: stateData.code || "",
            country: stateData.country?._id || stateData.country || "",
            logo: stateData.logo || null,
            map: stateData.map || null,
          });

          // Set existing images as previews
          if (stateData.logo) {
            setLogoPreview(stateData.logo);
          }
          if (stateData.map) {
            setMapPreview(stateData.map);
          }
        } else {
          showError(result.error || "Failed to fetch state data");
        }
      } catch (error) {
        console.error("Error fetching state:", error);
        showError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchStateData();
  }, [params.id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (file, preview) => {
    setFormData((prev) => ({ ...prev, logo: file }));
    setLogoPreview(preview);
  };

  const handleMapChange = (file, preview) => {
    setFormData((prev) => ({ ...prev, map: file }));
    setMapPreview(preview);
  };

  // Handle direct upload success
  const handleLogoUploadSuccess = (file) => {
    console.log("🎯 Logo upload success:", file);
    setFormData((prev) => ({ ...prev, logo: file.fileUrl }));
    console.log("📝 Form data updated with logo:", file.fileUrl);
  };

  const handleMapUploadSuccess = (file) => {
    console.log("🎯 Map upload success:", file);
    setFormData((prev) => ({ ...prev, map: file.fileUrl }));
    console.log("📝 Form data updated with map:", file.fileUrl);
  };

  const handleLogoRemove = () => {
    console.log("🗑️ Logo removed");
    setFormData((prev) => ({ ...prev, logo: null }));
    setLogoPreview(null);
  };

  const handleMapRemove = () => {
    console.log("🗑️ Map removed");
    setFormData((prev) => ({ ...prev, map: null }));
    setMapPreview(null);
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

    if (!formData.name.trim() || !formData.code.trim()) {
      showError("State name and code are required!");
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
        code: formData.code.trim().toUpperCase(),
        status: "active",
      };

      // Add logo if exists (already uploaded or file)
      if (formData.logo) {
        if (typeof formData.logo === "string") {
          // Already uploaded URL
          apiData.logo = formData.logo;
          console.log("✅ Logo URL added:", apiData.logo);
        } else if (formData.logo instanceof File) {
          // File object, need to upload
          try {
            console.log("📤 Uploading logo file...");
            const logoFormData = new FormData();
            logoFormData.append("file", formData.logo);
            logoFormData.append("type", "states");
            logoFormData.append("identifier", "state-logo");

            const logoResponse = await fetch("/api/upload", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
              },
              body: logoFormData,
            });

            const logoResult = await logoResponse.json();
            if (logoResult.success) {
              apiData.logo = logoResult.file.fileUrl;
              console.log("✅ Logo uploaded successfully:", apiData.logo);
            } else {
              console.error("❌ Logo upload failed:", logoResult.error);
            }
          } catch (uploadError) {
            console.error("❌ Logo upload error:", uploadError);
            // Continue without logo
          }
        }
      } else {
        // Logo was removed, explicitly set to null to clear it from database
        apiData.logo = null;
        console.log("🗑️ Logo explicitly set to null (removed)");
      }

      // Add map if exists (already uploaded or file)
      if (formData.map) {
        if (typeof formData.map === "string") {
          // Already uploaded URL
          apiData.map = formData.map;
          console.log("✅ Map URL added:", apiData.map);
        } else if (formData.map instanceof File) {
          // File object, need to upload
          try {
            console.log("📤 Uploading map file...");
            const mapFormData = new FormData();
            mapFormData.append("file", formData.map);
            mapFormData.append("type", "states");
            mapFormData.append("identifier", "state-map");

            const mapResponse = await fetch("/api/upload", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
              },
              body: mapFormData,
            });

            const mapResult = await mapResponse.json();
            if (mapResult.success) {
              apiData.map = mapResult.file.fileUrl;
              console.log(
                "✅ Map uploaded successfully:",
                mapResult.file.fileUrl
              );
            } else {
              console.error("❌ Map upload failed:", mapResult.error);
            }
          } catch (uploadError) {
            console.error("❌ Map upload error:", uploadError);
            // Continue without map
          }
        }
      } else {
        // Map was removed, explicitly set to null to clear it from database
        apiData.map = null;
        console.log("🗑️ Map explicitly set to null (removed)");
      }

      console.log("📤 Final API data:", apiData);

      // Make API call to update state
      const response = await fetch(`/api/locations/states/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(apiData),
      });

      const result = await response.json();

      if (result.success) {
        showSuccess("State updated successfully!");

        // Redirect after success
        setTimeout(() => {
          router.push("/admin/location/state");
        }, 2000);
      } else {
        showError(result.error || "Failed to update state");
      }
    } catch (error) {
      console.error("Error updating state:", error);
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
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="h-30 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
            <div className="h-30 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
          </div>
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
            href="/admin/location/state"
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
            Back to States
          </Link>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-0.5">
          Edit State - {formData.name}
        </h1>
        <p className="text-xs text-gray-600 dark:text-white/70">
          Update state information for CCIC colleges
        </p>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800 rounded-lg p-5 shadow-sm transition-colors duration-300">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block">
                Country *
              </label>
              <ApnaSelect
                title=""
                options={countries}
                value={formData.country}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, country: value }))
                }
                placeholder="-- Select Country --"
                searchable={true}
              />
            </div>

            {/* State Name */}
            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block">
                State Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter state name"
                required
                className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-700 rounded text-xs outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-primary/30 bg-white dark:bg-slate-900/70 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/50"
              />
            </div>

            {/* State Code */}
            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block">
                State Code *
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                placeholder="e.g., MH, GJ, KA"
                maxLength="2"
                required
                className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-700 rounded text-xs outline-none uppercase focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-primary/30 bg-white dark:bg-slate-900/70 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/50"
              />
            </div>
          </div>

          {/* Image Upload Areas */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <ImageUpload
              title="State Logo"
              type="logo"
              preview={logoPreview}
              onFileChange={handleLogoChange}
              onRemove={handleLogoRemove}
              maxSize="2"
              uploadType="states"
              identifier="state-logo"
              onUploadSuccess={handleLogoUploadSuccess}
              showUploadProgress={true}
              onUploadError={(error) =>
                showError(`Logo upload failed: ${error}`)
              }
            />
            <ImageUpload
              title="State Map"
              type="map"
              preview={mapPreview}
              onFileChange={handleMapChange}
              onRemove={handleMapRemove}
              maxSize="2"
              uploadType="states"
              identifier="state-map"
              onUploadSuccess={handleMapUploadSuccess}
              showUploadProgress={true}
              onUploadError={(error) =>
                showError(`Map upload failed: ${error}`)
              }
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2 border-t border-gray-200 dark:border-slate-800 pt-4">
            <Link
              href="/admin/location/state"
              className="px-3 py-1.5 text-xs text-gray-700 dark:text-white/80 border border-gray-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900/70 no-underline hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className={`px-3 py-1.5 text-xs text-white border-none rounded font-medium transition-all duration-200 ${
                submitting
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-primary hover:bg-primary-700 cursor-pointer"
              }`}
            >
              {submitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Updating State...</span>
                </div>
              ) : (
                "Update State"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
