"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ImageUpload from "@/components/utils/ImageUpload";
import ApnaEditor from "@/components/utils/ApnaEditor";
import ApnaSelect from "@/components/utils/ApnaSelect";
import {
  showSuccess,
  showError,
  showInfo,
} from "@/components/utils/ApnaNotify";

export default function AddCourse() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [streams, setStreams] = useState([]);
  const [degrees, setDegrees] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [formData, setFormData] = useState({
    streamId: "",
    degreeId: "",
    name: "",
    logo: null,
    icon: "",
    averageFee: "",
    averageFeeCurrency: "",
    description: "",
    admissionProcess: "",
    eligibilityCriteria: "",
    entranceExamsDetails: "",
    howToPrepare: "",
    status: "active",
    isFeatured: false,
    displayOrder: 0,
  });

  useEffect(() => {
    // Fetch streams and degrees data
    const fetchData = async () => {
      try {
        setLoading(true);

        // Get access token
        const token = localStorage.getItem("token");
        if (!token) {
          showError("Please login again to continue");
          router.push("/login");
          return;
        }

        console.log("🔍 Fetching streams and degrees...");

        // Fetch streams
        const streamsResponse = await fetch("/api/streams?all=true", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const streamsData = await streamsResponse.json();
        console.log("📊 Streams response:", streamsData);

        // Fetch degrees
        const degreesResponse = await fetch("/api/master/degree?all=true", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const degreesData = await degreesResponse.json();
        const currenciesResponse = await fetch(
          "/api/currencies?status=active&limit=200",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const currenciesData = await currenciesResponse.json();
        console.log("📊 Degrees response:", degreesData);

        if (streamsData.success && degreesData.success && currenciesData.success) {
          console.log("✅ Setting streams:", streamsData.data);
          console.log("✅ Setting degrees:", degreesData.data);
          setStreams(streamsData.data);
          setDegrees(degreesData.data);
          setCurrencies(
            currenciesData.data.map((currency) => ({
              value: currency._id,
              label: `${currency.code} - ${currency.name}${currency.symbol ? ` (${currency.symbol})` : ""}`,
              meta: currency,
            }))
          );
        } else {
          console.error("❌ Streams success:", streamsData.success);
          console.error("❌ Degrees success:", degreesData.success);
          showError("Failed to load streams or degrees data");
        }
      } catch (error) {
        console.error("❌ Error fetching data:", error);
        showError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const clearForm = () => {
    setFormData({
      streamId: "",
      degreeId: "",
      name: "",
      logo: null,
      icon: "",
      averageFee: "",
    averageFeeCurrency: "",
      description: "",
      admissionProcess: "",
      eligibilityCriteria: "",
      entranceExamsDetails: "",
      howToPrepare: "",
      status: "active",
      isFeatured: false,
      displayOrder: 0,
    });
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLogoUploadSuccess = (fileData) => {
    console.log("📸 Logo upload success, fileData:", fileData);

    // Extract fileUrl from the fileData object
    const fileUrl = fileData?.fileUrl || fileData;

    console.log("📸 Setting logo URL:", fileUrl);

    setFormData((prev) => ({
      ...prev,
      logo: fileUrl,
    }));
  };

  const handleLogoUploadError = (error) => {
    showError(`Logo upload failed: ${error}`);
  };

  const handleLogoRemove = () => {
    setFormData((prev) => ({
      ...prev,
      logo: null,
    }));
  };

  const handleIconUploadSuccess = (fileData) => {
    console.log("📸 Icon upload success, fileData:", fileData);

    // Extract fileUrl from the fileData object
    const fileUrl = fileData?.fileUrl || fileData;

    console.log("📸 Setting icon URL:", fileUrl);

    setFormData((prev) => ({
      ...prev,
      icon: fileUrl, // Save to icon field
    }));
  };

  const handleIconUploadError = (error) => {
    showError(`Icon upload failed: ${error}`);
  };

  const handleIconRemove = () => {
    setFormData((prev) => ({
      ...prev,
      icon: null, // Clear icon field
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Debug: Log current form data
    console.log("🔍 Form submission - Current formData:", formData);
    console.log("🔍 Form validation check:");
    console.log(
      "  - name:",
      formData.name,
      "| trimmed:",
      formData.name?.trim()
    );
    console.log("  - streamId:", formData.streamId);
    console.log("  - degreeId:", formData.degreeId);
    console.log(
      "  - icon:",
      formData.icon,
      "| trimmed:",
      formData.icon?.trim()
    );
    console.log(
      "  - averageFee:",
      formData.averageFee,
      "| trimmed:",
      formData.averageFee?.trim()
    );
    console.log(
      "  - description:",
      formData.description,
      "| trimmed:",
      formData.description?.trim()
    );
    console.log(
      "  - admissionProcess:",
      formData.admissionProcess,
      "| trimmed:",
      formData.admissionProcess?.trim()
    );
    console.log(
      "  - eligibilityCriteria:",
      formData.eligibilityCriteria,
      "| trimmed:",
      formData.eligibilityCriteria?.trim()
    );
    console.log(
      "  - entranceExamsDetails:",
      formData.entranceExamsDetails,
      "| trimmed:",
      formData.entranceExamsDetails?.trim()
    );
    console.log(
      "  - howToPrepare:",
      formData.howToPrepare,
      "| trimmed:",
      formData.howToPrepare?.trim()
    );
    console.log("  - status:", formData.status);

    // Validation
    if (!formData.name?.trim()) {
      console.log("❌ Validation failed: name is empty or undefined");
      showError("Please enter a course name");
      return;
    }

    if (!formData.streamId) {
      console.log("❌ Validation failed: streamId is not selected");
      showError("Please select a stream");
      return;
    }

    if (!formData.degreeId) {
      console.log("❌ Validation failed: degreeId is not selected");
      showError("Please select a degree type");
      return;
    }

    console.log("✅ All validations passed, proceeding with API call...");

    if (formData.averageFee !== "" && !formData.averageFeeCurrency) {
      showError("Please select an average fee currency");
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
        streamId: formData.streamId,
        degreeId: formData.degreeId,
        averageFee:
          formData.averageFee === "" ? null : Number(formData.averageFee),
        averageFeeCurrency: formData.averageFeeCurrency || null,
        description: formData.description.trim(),
        admissionProcess: formData.admissionProcess.trim(),
        eligibilityCriteria: formData.eligibilityCriteria.trim(),
        entranceExamsDetails: formData.entranceExamsDetails.trim(),
        howToPrepare: formData.howToPrepare.trim(),
        status: formData.status,
        isFeatured: formData.isFeatured,
        displayOrder: formData.displayOrder,
      };

      // Handle logo
      if (formData.logo) {
        apiData.logo = formData.logo;
      }

      // Handle icon
      if (formData.icon) {
        apiData.icon = formData.icon;
      }

      console.log("✅ Creating course with data:", apiData);

      const response = await fetch("/api/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(apiData),
      });

      const result = await response.json();

      if (result.success) {
        showSuccess("Course created successfully!");
        // Redirect to courses list
        router.push("/admin/master/course");
      } else {
        // Show first validation error message if available
        const errorMessage =
          result.details && result.details.length > 0
            ? result.details[0]
            : result.error || "Failed to create course";
        showError(errorMessage);
      }
    } catch (error) {
      console.error("Error creating course:", error);
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
            {[...Array(6)].map((_, i) => (
              <div key={i}>
                <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-20 mb-2 animate-pulse"></div>
                <div className="h-7 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 pt-4 flex justify-end gap-2">
            <div className="h-7 bg-gray-200 dark:bg-slate-800 rounded w-15 animate-pulse"></div>
            <div className="h-7 bg-gray-200 dark:bg-slate-800 rounded w-25 animate-pulse"></div>
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
            href="/admin/master/course"
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
            Back to Courses
          </Link>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-0.5">
          Add New Course
        </h1>
        <p className="text-xs text-gray-600 dark:text-white/70">
          Create a new course for CCIC
        </p>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800 rounded-lg p-5 shadow-sm transition-colors duration-300">
        <form onSubmit={handleSubmit}>
          {/* Course Details Section */}
          <div className="space-y-4 mb-5">
            {/* Stream Name and Degree Type - 2 columns */}
            <div className="grid grid-cols-2 gap-4">
              {/* Stream Name */}
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block">
                  Stream Name *
                </label>
                {console.log(
                  "🔍 Rendering streams:",
                  streams,
                  "Length:",
                  streams?.length
                )}
                <ApnaSelect
                  title=""
                  options={
                    streams?.map((stream) => ({
                      value: stream._id,
                      label: stream.name,
                    })) || []
                  }
                  value={formData.streamId}
                  onChange={(value) => handleInputChange("streamId", value)}
                  placeholder="-- Select Stream --"
                  searchable={true}
                  required={true}
                  buttonClassName="w-full px-3 py-1.5 rounded text-sm text-left flex items-center justify-between outline-none transition-all duration-200 border border-gray-300 dark:border-slate-700 focus:border-primary focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary/30 bg-white dark:bg-slate-900/70 text-gray-700 dark:text-white/80 cursor-pointer"
                />
              </div>

              {/* Degree Type */}
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block">
                  Degree Type *
                </label>
                {console.log(
                  "🔍 Rendering degrees:",
                  degrees,
                  "Length:",
                  degrees?.length
                )}
                <ApnaSelect
                  title=""
                  options={
                    degrees?.map((degree) => ({
                      value: degree._id,
                      label: degree.name,
                    })) || []
                  }
                  value={formData.degreeId}
                  onChange={(value) => handleInputChange("degreeId", value)}
                  placeholder="-- Select Degree --"
                  searchable={true}
                  required={true}
                  buttonClassName="w-full px-3 py-1.5 rounded text-sm text-left flex items-center justify-between outline-none transition-all duration-200 border border-gray-300 dark:border-slate-700 focus:border-primary focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary/30 bg-white dark:bg-slate-900/70 text-gray-700 dark:text-white/80 cursor-pointer"
                />
              </div>
            </div>

            {/* Course Name and average fee */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block">
                  Course Name <span className="text-secondary">*</span>
                </label>
                <input type="text" value={formData.name} onChange={(e) => handleInputChange("name", e.target.value)} placeholder="Enter course name" required className="w-full px-2 py-2 border border-gray-300 dark:border-slate-700 rounded text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary/30 bg-white dark:bg-slate-900/70 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/50" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block">Average Fee</label>
                <input type="number" min="0" value={formData.averageFee} onChange={(e) => handleInputChange("averageFee", e.target.value)} placeholder="Leave blank if unavailable" className="w-full px-2 py-2 border border-gray-300 dark:border-slate-700 rounded text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary/30 bg-white dark:bg-slate-900/70 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/50" />
              </div>
              <div>
                <ApnaSelect title="Average Fee Currency" options={currencies} value={formData.averageFeeCurrency} onChange={(value) => handleInputChange("averageFeeCurrency", value)} placeholder="-- Select Currency --" searchable={true} required={formData.averageFee !== ""} buttonClassName="w-full px-3 py-1.5 rounded text-sm text-left flex items-center justify-between outline-none transition-all duration-200 border border-gray-300 dark:border-slate-700 focus:border-primary focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary/30 bg-white dark:bg-slate-900/70 text-gray-700 dark:text-white/80 cursor-pointer" />
              </div>
            </div>
            {/* Status, Display Order, Featured - 3 columns */}
            <div className="grid grid-cols-3 gap-4">
              {/* Status */}
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block">
                  Status
                </label>
                <ApnaSelect
                  title=""
                  options={[
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" },
                    { value: "draft", label: "Draft" },
                  ]}
                  value={formData.status}
                  onChange={(value) => handleInputChange("status", value)}
                  placeholder="-- Select Status --"
                  searchable={true}
                  buttonClassName="w-full px-3 py-1.5 rounded text-sm text-left flex items-center justify-between outline-none transition-all duration-200 border border-gray-300 dark:border-slate-700 focus:border-primary focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary/30 bg-white dark:bg-slate-900/70 text-gray-700 dark:text-white/80 cursor-pointer"
                />
              </div>

              {/* Display Order */}
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block">
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
                  placeholder="Enter display order"
                  className="w-full px-2 py-2 border border-gray-300 dark:border-slate-700 rounded text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary/30 bg-white dark:bg-slate-900/70 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/50"
                />
              </div>

              {/* Featured */}
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block">
                  Featured Course
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) =>
                      handleInputChange("isFeatured", e.target.checked)
                    }
                    className="w-4 h-4 text-primary border-gray-300 dark:border-slate-700 rounded focus:ring-primary dark:bg-slate-900"
                  />
                  <span className="text-xs text-gray-600 dark:text-white/70">
                    Mark as featured
                  </span>
                </div>
              </div>
            </div>

            {/* Course Logo and Icon - 2 columns */}
            <div className="grid grid-cols-2 gap-4">
              {/* Course Logo */}
              <div>
                <ImageUpload
                  uploadType="courses"
                  identifier="course-logo"
                  onUploadSuccess={handleLogoUploadSuccess}
                  onUploadError={handleLogoUploadError}
                  showUploadProgress={true}
                  title="Course Logo"
                  preview={formData.logo}
                  onRemove={handleLogoRemove}
                  accept="image/*"
                  maxSize="2MB"
                  width="120px"
                  height="120px"
                  className="w-full"
                />
              </div>

              {/* Course Icon */}
              <div>
                <ImageUpload
                  uploadType="courses"
                  identifier="course-icon"
                  onUploadSuccess={handleIconUploadSuccess}
                  onUploadError={handleIconUploadError}
                  showUploadProgress={true}
                  title="Course Icon"
                  preview={formData.icon}
                  onRemove={handleIconRemove}
                  accept="image/*"
                  maxSize="1MB"
                  width="120px"
                  height="120px"
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Rich Text Editor Sections */}
          <div className="space-y-5 mb-5">
            {/* Description */}
            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block">
                Description
              </label>
              <ApnaEditor
                value={formData.description}
                onChange={(value) => handleInputChange("description", value)}
                placeholder="Enter course description..."
                className="min-h-[200px]"
                showToolbar={true}
              />
            </div>

            {/* Admission Process */}
            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block">
                Admission Process
              </label>
              <ApnaEditor
                value={formData.admissionProcess}
                onChange={(value) =>
                  handleInputChange("admissionProcess", value)
                }
                placeholder="Enter admission process details..."
                className="min-h-[200px]"
                showToolbar={true}
              />
            </div>

            {/* Eligibility Criteria */}
            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block">
                Eligibility Criteria
              </label>
              <ApnaEditor
                value={formData.eligibilityCriteria}
                onChange={(value) =>
                  handleInputChange("eligibilityCriteria", value)
                }
                placeholder="Enter eligibility criteria..."
                className="min-h-[200px]"
                showToolbar={true}
              />
            </div>

            {/* Entrance Exams Details */}
            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block">
                Entrance Exams Details
              </label>
              <ApnaEditor
                value={formData.entranceExamsDetails}
                onChange={(value) =>
                  handleInputChange("entranceExamsDetails", value)
                }
                placeholder="Enter entrance exam details..."
                className="min-h-[200px]"
                showToolbar={true}
              />
            </div>

            {/* How to Prepare */}
            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block">
                How to Prepare
              </label>
              <ApnaEditor
                value={formData.howToPrepare}
                onChange={(value) => handleInputChange("howToPrepare", value)}
                placeholder="Enter preparation guidelines..."
                className="min-h-[200px]"
                showToolbar={true}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2 border-t border-gray-200 dark:border-slate-800 pt-4">
            <Link
              href="/admin/master/course"
              className="px-3 py-1.5 text-xs text-gray-700 dark:text-white/80 border border-gray-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900/70 no-underline hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className={`px-3 py-1.5 text-xs font-medium rounded cursor-pointer flex items-center gap-2 transition-colors
                bg-primary hover:bg-primary-700
                text-white
                border-none
                disabled:bg-gray-400 disabled:cursor-not-allowed
              `}
            >
              {submitting ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating Course...</span>
                </>
              ) : (
                "Submit"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
