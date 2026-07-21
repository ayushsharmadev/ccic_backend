"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import ImageUpload from "@/components/utils/ImageUpload";
import ApnaEditor from "@/components/utils/ApnaEditor";
import ApnaSelect from "@/components/utils/ApnaSelect";
import ApnaModalConfirmation from "@/components/utils/ApnaModalConfirmation";
import {
  showSuccess,
  showError,
  showInfo,
} from "@/components/utils/ApnaNotify";

export default function EditCourse() {
  const router = useRouter();
  const params = useParams();
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
  });
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    courseId: null,
    courseName: "",
  });

  useEffect(() => {
    // Fetch course data and streams/degrees
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

        console.log("🔍 Fetching course data and streams/degrees...");

        // Fetch course data
        const courseResponse = await fetch(`/api/courses/${params.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const courseData = await courseResponse.json();
        console.log("📊 Course response:", courseData);

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

        if (courseData.success && streamsData.success && degreesData.success) {
          console.log("✅ Setting course data:", courseData.data);
          console.log("✅ Setting streams:", streamsData.data);
          console.log("✅ Setting degrees:", degreesData.data);

          // Set form data from course
          setFormData({
            streamId: courseData.data.streamId?._id || "",
            degreeId: courseData.data.degreeId?._id || "",
            name: courseData.data.name || "",
            logo: courseData.data.logo || null,
            icon: courseData.data.icon || "",
            averageFee:
              courseData.data.averageFee !== null && courseData.data.averageFee !== undefined
                ? courseData.data.averageFee.toString()
                : "",
            averageFeeCurrency:
              courseData.data.averageFeeCurrency?._id ||
              courseData.data.averageFeeCurrency ||
              "",
            description: courseData.data.description || "",
            admissionProcess: courseData.data.admissionProcess || "",
            eligibilityCriteria: courseData.data.eligibilityCriteria || "",
            entranceExamsDetails: courseData.data.entranceExamsDetails || "",
            howToPrepare: courseData.data.howToPrepare || "",
            status: courseData.data.status || "active",
          });

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
          console.error("❌ Course success:", courseData.success);
          console.error("❌ Streams success:", streamsData.success);
          console.error("❌ Degrees success:", degreesData.success);
          showError("Failed to load course or streams/degrees data");
        }
      } catch (error) {
        console.error("❌ Error fetching data:", error);
        showError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id, router]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLogoUploadSuccess = (fileData) => {
    console.log("📸 Logo upload success, fileData:", fileData);
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
    const fileUrl = fileData?.fileUrl || fileData;
    console.log("📸 Setting icon URL:", fileUrl);
    setFormData((prev) => ({
      ...prev,
      icon: fileUrl, // ✅ Save to icon field, not iconImage
    }));
  };

  const handleIconUploadError = (error) => {
    showError(`Icon upload failed: ${error}`);
  };

  const handleIconRemove = () => {
    setFormData((prev) => ({
      ...prev,
      icon: null, // ✅ Clear icon field, not iconImage
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Debug: Log current form data
    console.log("🔍 Form submission - Current formData:", formData);

    // Validation
    if (!formData.name?.trim()) {
      showError("Please enter a course name");
      return;
    }

    if (!formData.streamId) {
      showError("Please select a stream");
      return;
    }

    if (!formData.degreeId) {
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
      };

      // Handle logo and icon image
      if (formData.logo) {
        apiData.logo = formData.logo;
      } else {
        apiData.logo = null;
      }

      if (formData.icon) {
        apiData.icon = formData.icon;
      } else {
        apiData.icon = null;
      }

      console.log("✅ Updating course with data:", apiData);

      const response = await fetch(`/api/courses/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(apiData),
      });

      const result = await response.json();

      if (result.success) {
        showSuccess("Course updated successfully!");
        router.push("/admin/master/course");
      } else {
        const errorMessage =
          result.details && result.details.length > 0
            ? result.details[0]
            : result.error || "Failed to update course";
        showError(errorMessage);
      }
    } catch (error) {
      console.error("Error updating course:", error);
      showError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = () => {
    setDeleteModal({
      isOpen: true,
      courseId: params.id,
      courseName: formData.name,
    });
  };

  const handleDeleteConfirm = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        showError("Please login again to continue");
        return;
      }

      const response = await fetch(`/api/courses/${params.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        showSuccess("Course deleted successfully!");
        router.push("/admin/master/course");
      } else {
        showError("Failed to delete course: " + data.error);
      }
    } catch (error) {
      console.error("Error deleting course:", error);
      showError("Error deleting course");
    } finally {
      setDeleteModal({ isOpen: false, courseId: null, courseName: "" });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, courseId: null, courseName: "" });
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
          Edit Course: {formData.name}
        </h1>
        <p className="text-xs text-gray-600 dark:text-white/70">
          Update course information for CCIC
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

            {/* Course Name, average fee, currency, and status */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block">Status</label>
                <ApnaSelect title="" options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }, { value: "draft", label: "Draft" }]} value={formData.status} onChange={(value) => handleInputChange("status", value)} placeholder="Choose status" searchable={false} required={true} buttonClassName="w-full px-3 py-1.5 rounded text-sm text-left flex items-center justify-between outline-none transition-all duration-200 border border-gray-300 dark:border-slate-700 focus:border-primary focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary/30 bg-white dark:bg-slate-900/70 text-gray-700 dark:text-white/80 cursor-pointer" />
              </div>
            </div>
            {/* Course Logo and Course Icon - 2 columns */}
            <div className="grid grid-cols-2 gap-4">
              {/* Course Logo */}
              <div>
                <ImageUpload
                  uploadType="courses"
                  identifier={`course-logo-${params.id}`}
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
                  identifier={`course-icon-${params.id}`}
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
          <div className="flex justify-between items-center border-t border-gray-200 dark:border-slate-800 pt-4">
            {/* Delete Button */}
            <button
              type="button"
              onClick={handleDeleteClick}
              className="px-3 py-1.5 text-xs text-secondary border border-secondary rounded bg-transparent hover:bg-secondary-50 dark:hover:bg-secondary/20 transition-colors"
            >
              Delete Course
            </button>

            {/* Update and Cancel Buttons */}
            <div className="flex gap-2">
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
                    <span>Updating Course...</span>
                  </>
                ) : (
                  "Update Course"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Delete Confirmation Modal */}
      <ApnaModalConfirmation
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Course"
        message={`Are you sure you want to delete "${deleteModal.courseName}"? This action cannot be undone.`}
        confirmText="Delete Course"
        cancelText="Cancel"
        confirmButtonColor="bg-secondary hover:bg-secondary-700"
        cancelButtonColor="bg-gray-500 hover:bg-gray-600 dark:bg-slate-700 dark:hover:bg-slate-600"
        icon="danger"
        size="md"
      />
    </div>
  );
}
