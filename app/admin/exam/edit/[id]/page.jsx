"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import ImageUpload from "@/components/utils/ImageUpload";
import ApnaEditor from "@/components/utils/ApnaEditor";
import LocationSelects from "@/components/utils/LocationSelects";
import ApnaSelect from "@/components/utils/ApnaSelect";
import { showSuccess, showError } from "@/components/utils/ApnaNotify";

export default function EditExam() {
  const router = useRouter();
  const params = useParams();
  const examId = params.id;

  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [dropdownData, setDropdownData] = useState({
    streams: [],
    courses: [],
    examTypes: [],
    examLevels: [],
  });
  const [formData, setFormData] = useState({
    stream: "",
    courseName: "",
    examType: "",
    title: "",
    displayRank: "0",
    noOfApplication: "",
    purpose: "",
    applicationFee: "0",
    applicationDate: "",
    examDate: "",
    resultDate: "",
    examLevel: "",
    examDescription: "",
    eligibilityCriteria: "",
    applicationProcess: "",
    examPattern: "",
    importantDates: "",
    admitCardDetails: "",
    resultInformation: "",
    country: "",
    state: "",
    logo: null,
    pdf: null,
  });

  // Load dropdown data
  const loadDropdownData = async () => {
    try {
      // Load streams
      const streamsResponse = await fetch("/api/streams?all=true");
      const streamsData = await streamsResponse.json();
      if (streamsData.success) {
        setDropdownData((prev) => ({
          ...prev,
          streams: streamsData.data.map((stream) => ({
            value: stream._id,
            label: stream.name,
          })),
        }));
      }

      // Load courses
      const coursesResponse = await fetch("/api/courses?all=true");
      const coursesData = await coursesResponse.json();
      if (coursesData.success) {
        setDropdownData((prev) => ({
          ...prev,
          courses: coursesData.data.map((course) => ({
            value: course._id,
            label: course.name,
          })),
        }));
      }

      // Load exam types
      const examTypesResponse = await fetch("/api/master/exam-type?all=true");
      const examTypesData = await examTypesResponse.json();
      if (examTypesData.success) {
        setDropdownData((prev) => ({
          ...prev,
          examTypes: examTypesData.data.map((examType) => ({
            value: examType._id,
            label: examType.name,
          })),
        }));
      }

      // Load exam levels
      const examLevelsResponse = await fetch("/api/master/exam-level/all");
      const examLevelsData = await examLevelsResponse.json();
      if (examLevelsData.success) {
        setDropdownData((prev) => ({
          ...prev,
          examLevels: examLevelsData.data.map((examLevel) => ({
            value: examLevel._id,
            label: examLevel.name,
          })),
        }));
      }
    } catch (error) {
      console.error("Error loading dropdown data:", error);
    }
  };

  // Fetch exam data from API
  const fetchExam = async () => {
    try {
      setLoading(true);

      // Get access token
      const token = localStorage.getItem("token");
      if (!token) {
        showError("Please login again to continue");
        router.push("/admin/exam");
        return;
      }

      const response = await fetch(`/api/exams/${examId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const exam = data.data;
          setFormData({
            stream: exam.stream?._id || exam.stream || "",
            courseName: exam.courseName?._id || exam.courseName || "",
            examType: exam.examType?._id || exam.examType || "",
            title: exam.title || "",
            displayRank: exam.displayRank?.toString() || "0",
            noOfApplication: exam.noOfApplication?.toString() || "",
            purpose: exam.purpose || "",
            applicationFee: exam.applicationFee?.toString() || "0",
            applicationDate: exam.applicationDate
              ? new Date(exam.applicationDate).toISOString().split("T")[0]
              : "",
            examDate: exam.examDate
              ? new Date(exam.examDate).toISOString().split("T")[0]
              : "",
            resultDate: exam.resultDate
              ? new Date(exam.resultDate).toISOString().split("T")[0]
              : "",
            examLevel: exam.examLevel?._id || exam.examLevel || "",
            examDescription: exam.examDescription || "",
            eligibilityCriteria: exam.eligibilityCriteria || "",
            applicationProcess: exam.applicationProcess || "",
            examPattern: exam.examPattern || "",
            importantDates: exam.importantDates || "",
            admitCardDetails: exam.admitCardDetails || "",
            resultInformation: exam.resultInformation || "",
            country:
              exam.country?._id ||
              exam.country ||
              exam.state?.country?._id ||
              exam.state?.country ||
              "",
            state: exam.state?._id || exam.state || "",
            logo: exam.logo ? { preview: exam.logo } : null,
            pdf: exam.pdf ? { preview: exam.pdf } : null,
          });
        } else {
          showError("Failed to fetch exam data: " + data.error);
          router.push("/admin/exam");
        }
      } else {
        showError("Failed to fetch exam data");
        router.push("/admin/exam");
      }
    } catch (error) {
      console.error("Error fetching exam:", error);
      showError("Error fetching exam data");
      router.push("/admin/exam");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await loadDropdownData();
      if (examId) {
        await fetchExam();
      }
    };
    loadData();
  }, [examId]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLogoChange = (file, preview) => {
    setFormData((prev) => ({
      ...prev,
      logo: { file, preview },
    }));
  };

  const handleLogoRemove = () => {
    setFormData((prev) => ({
      ...prev,
      logo: null,
    }));
  };

  const handlePdfChange = (file, preview) => {
    setFormData((prev) => ({
      ...prev,
      pdf: { file, preview },
    }));
  };

  const handlePdfRemove = () => {
    setFormData((prev) => ({
      ...prev,
      pdf: null,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.stream) {
      showError("Please select a stream");
      return;
    }

    if (!formData.courseName) {
      showError("Please select a course");
      return;
    }

    if (!formData.examType) {
      showError("Please select an exam type");
      return;
    }

    if (!formData.title.trim()) {
      showError("Please enter exam title");
      return;
    }

    if (!formData.examLevel) {
      showError("Please select exam level");
      return;
    }

    if (!formData.country) {
      showError("Please select a country");
      return;
    }

    if (!formData.state) {
      showError("Please select a state");
      return;
    }

    try {
      setFormLoading(true);

      // Get access token
      const token = localStorage.getItem("token");
      if (!token) {
        showError("Please login again to continue");
        return;
      }

      // Prepare form data
      const submitData = {
        stream: formData.stream,
        courseName: formData.courseName,
        examType: formData.examType,
        title: formData.title.trim(),
        displayRank: parseInt(formData.displayRank) || 0,
        noOfApplication: parseInt(formData.noOfApplication) || 0,
        purpose: formData.purpose.trim(),
        applicationFee: parseInt(formData.applicationFee) || 0,
        applicationDate: formData.applicationDate || null,
        examDate: formData.examDate || null,
        resultDate: formData.resultDate || null,
        examLevel: formData.examLevel,
        examDescription: formData.examDescription,
        eligibilityCriteria: formData.eligibilityCriteria,
        applicationProcess: formData.applicationProcess,
        examPattern: formData.examPattern,
        importantDates: formData.importantDates,
        admitCardDetails: formData.admitCardDetails,
        resultInformation: formData.resultInformation,
        country: formData.country,
        state: formData.state,
        logo: formData.logo?.preview || null,
        pdf: formData.pdf?.preview || null,
      };

      const response = await fetch(`/api/exams/${examId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (data.success) {
        showSuccess("Exam updated successfully!");
        router.push("/admin/exam");
      } else {
        showError("Failed to update exam: " + data.error);
      }
    } catch (error) {
      console.error("Error updating exam:", error);
      showError("Error updating exam");
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full p-4 sm:p-5 md:p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
        {/* Loading State */}
        <div className="mb-4 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-28 animate-pulse"></div>
          <div className="h-6 bg-gray-200 dark:bg-slate-800 rounded w-40 animate-pulse"></div>
          <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-64 animate-pulse"></div>
        </div>

        <div className="bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800 rounded-lg p-5 shadow-sm transition-colors duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3.5 bg-gray-200 dark:bg-slate-800 rounded w-24 animate-pulse"></div>
                <div className="h-9 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3.5 bg-gray-200 dark:bg-slate-800 rounded w-28 animate-pulse"></div>
                <div className="h-9 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3.5 bg-gray-200 dark:bg-slate-800 rounded w-36 animate-pulse"></div>
                <div className="h-28 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 dark:border-slate-800 pt-4 mt-4 flex justify-end gap-2 transition-colors duration-300">
            <div className="h-8 bg-gray-200 dark:bg-slate-800 rounded w-20 animate-pulse"></div>
            <div className="h-8 bg-gray-200 dark:bg-slate-800 rounded w-28 animate-pulse"></div>
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
            href="/admin/exam"
            className="text-gray-600 dark:text-white/70 no-underline text-xs flex items-center gap-1 transition-colors duration-300 hover:text-gray-800 dark:hover:text-white"
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
            Back to Exams
          </Link>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white transition-colors duration-300 mb-0.5">
          Edit Examination
        </h1>
        <p className="text-xs text-gray-600 dark:text-white/70 transition-colors duration-300">
          Update examination details and information
        </p>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800 rounded-lg p-5 shadow-sm transition-colors duration-300">
        <form onSubmit={handleSubmit}>
          {/* Basic Information */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white transition-colors duration-300 mb-3 border-b border-gray-200 dark:border-slate-800 pb-2">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Stream */}
              <div>
                <ApnaSelect
                  options={dropdownData.streams}
                  value={formData.stream}
                  onChange={(value) => handleInputChange("stream", value)}
                  placeholder="-- Select Stream --"
                  searchable={true}
                  title="Academic Stream"
                  required={true}
                />
              </div>

              {/* Course Name */}
              <div>
                <ApnaSelect
                  options={dropdownData.courses}
                  value={formData.courseName}
                  onChange={(value) => handleInputChange("courseName", value)}
                  placeholder="-- Select Course --"
                  searchable={true}
                  title="Course Name"
                  required={false}
                />
              </div>

              {/* Exam Type */}
              <div>
                <ApnaSelect
                  options={dropdownData.examTypes}
                  value={formData.examType}
                  onChange={(value) => handleInputChange("examType", value)}
                  placeholder="-- Select Exam Type --"
                  searchable={true}
                  title="Examination Type"
                  required={true}
                />
              </div>

              {/* Exam Level */}
              <div>
                <ApnaSelect
                  options={dropdownData.examLevels}
                  value={formData.examLevel}
                  onChange={(value) => handleInputChange("examLevel", value)}
                  placeholder="-- Select Level --"
                  searchable={true}
                  title="Education Level"
                  required={true}
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
                countryLabel="Conducting Country"
                stateLabel="Conducting State"
                gridClassName="col-span-2 grid grid-cols-2 gap-4"
              />

              {/* Display Rank */}
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block transition-colors duration-300">
                  Display Priority
                </label>
                <input
                  type="number"
                  value={formData.displayRank}
                  onChange={(e) =>
                    handleInputChange("displayRank", e.target.value)
                  }
                  placeholder="0"
                  className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-700 rounded text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary-50 bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors duration-300 placeholder:text-gray-400 dark:placeholder:text-white/40"
                />
              </div>
            </div>

            {/* Title - Full Width */}
            <div className="mt-4">
              <label className="text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block transition-colors duration-300">
                Examination Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Enter complete exam title"
                className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-700 rounded text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary-50 bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors duration-300 placeholder:text-gray-400 dark:placeholder:text-white/40"
              />
            </div>

            {/* Purpose - Full Width */}
            <div className="mt-4">
              <label className="text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block transition-colors duration-300">
                Exam Purpose & Objective
              </label>
              <input
                type="text"
                value={formData.purpose}
                onChange={(e) => handleInputChange("purpose", e.target.value)}
                placeholder="Describe the main purpose and objective of this examination"
                className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-700 rounded text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary-50 bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors duration-300 placeholder:text-gray-400 dark:placeholder:text-white/40"
              />
            </div>
          </div>

          {/* Application Details */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white transition-colors duration-300 mb-3 border-b border-gray-200 dark:border-slate-800 pb-2">
              Application Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* No of Application */}
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block transition-colors duration-300">
                  Expected Applications
                </label>
                <input
                  type="number"
                  value={formData.noOfApplication}
                  onChange={(e) =>
                    handleInputChange("noOfApplication", e.target.value)
                  }
                  placeholder="Number of expected applications"
                  className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-700 rounded text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary-50 bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors duration-300 placeholder:text-gray-400 dark:placeholder:text-white/40"
                />
              </div>

              {/* Application Fee */}
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block transition-colors duration-300">
                  Application Fee (₹)
                </label>
                <input
                  type="number"
                  value={formData.applicationFee}
                  onChange={(e) =>
                    handleInputChange("applicationFee", e.target.value)
                  }
                  placeholder="0"
                  className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-700 rounded text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary-50 bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors duration-300 placeholder:text-gray-400 dark:placeholder:text-white/40"
                />
              </div>
            </div>
          </div>

          {/* Important Dates */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white transition-colors duration-300 mb-3 border-b border-gray-200 dark:border-slate-800 pb-2">
              Important Dates
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Application Date */}
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block transition-colors duration-300">
                  Application Deadline
                </label>
                <input
                  type="date"
                  value={formData.applicationDate}
                  onChange={(e) =>
                    handleInputChange("applicationDate", e.target.value)
                  }
                  className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-700 rounded text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary-50 bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors duration-300"
                />
              </div>

              {/* Exam Date */}
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block transition-colors duration-300">
                  Examination Date
                </label>
                <input
                  type="date"
                  value={formData.examDate}
                  onChange={(e) =>
                    handleInputChange("examDate", e.target.value)
                  }
                  className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-700 rounded text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary-50 bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors duration-300"
                />
              </div>

              {/* Result Date */}
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block transition-colors duration-300">
                  Result Declaration
                </label>
                <input
                  type="date"
                  value={formData.resultDate}
                  onChange={(e) =>
                    handleInputChange("resultDate", e.target.value)
                  }
                  className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-700 rounded text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary-50 bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors duration-300"
                />
              </div>
            </div>
          </div>

          {/* Detailed Information */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white transition-colors duration-300 mb-3 border-b border-gray-200 dark:border-slate-800 pb-2">
              Detailed Information
            </h3>

            {/* Exam Description */}
            <div className="mb-5">
              <label className="text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block transition-colors duration-300">
                Comprehensive Exam Description
              </label>
              <ApnaEditor
                value={formData.examDescription}
                onChange={(value) =>
                  handleInputChange("examDescription", value)
                }
                placeholder="Provide a comprehensive overview of the examination, its significance, and general information..."
                className="min-h-[180px]"
                showToolbar={true}
              />
            </div>

            {/* Eligibility Criteria */}
            <div className="mb-5">
              <label className="text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block transition-colors duration-300">
                Candidate Eligibility Requirements
              </label>
              <ApnaEditor
                value={formData.eligibilityCriteria}
                onChange={(value) =>
                  handleInputChange("eligibilityCriteria", value)
                }
                placeholder="Detail the academic qualifications, age limits, and other eligibility requirements..."
                className="min-h-[180px]"
                showToolbar={true}
              />
            </div>
          </div>

          {/* Application & Process Information */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white transition-colors duration-300 mb-3 border-b border-gray-200 dark:border-slate-800 pb-2">
              Application & Process Information
            </h3>

            {/* Application Process */}
            <div className="mb-5">
              <label className="text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block transition-colors duration-300">
                Step-by-Step Application Process
              </label>
              <ApnaEditor
                value={formData.applicationProcess}
                onChange={(value) =>
                  handleInputChange("applicationProcess", value)
                }
                placeholder="Outline the complete application procedure, required documents, and submission process..."
                className="min-h-[180px]"
                showToolbar={true}
              />
            </div>

            {/* Important Dates */}
            <div className="mb-5">
              <label className="text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block transition-colors duration-300">
                Timeline & Key Deadlines
              </label>
              <ApnaEditor
                value={formData.importantDates}
                onChange={(value) => handleInputChange("importantDates", value)}
                placeholder="List all important dates, deadlines, and timeline for the examination process..."
                className="min-h-[180px]"
                showToolbar={true}
              />
            </div>
          </div>

          {/* Examination Details */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white transition-colors duration-300 mb-3 border-b border-gray-200 dark:border-slate-800 pb-2">
              Examination Details
            </h3>

            {/* Exam Pattern */}
            <div className="mb-5">
              <label className="text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block transition-colors duration-300">
                Question Pattern & Structure
              </label>
              <ApnaEditor
                value={formData.examPattern}
                onChange={(value) => handleInputChange("examPattern", value)}
                placeholder="Describe the exam format, question types, sections, marking scheme, and duration..."
                className="min-h-[180px]"
                showToolbar={true}
              />
            </div>

            {/* Admit Card Details */}
            <div className="mb-5">
              <label className="text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block transition-colors duration-300">
                Hall Ticket Information
              </label>
              <ApnaEditor
                value={formData.admitCardDetails}
                onChange={(value) =>
                  handleInputChange("admitCardDetails", value)
                }
                placeholder="Provide details about admit card/hall ticket release, download process, and requirements..."
                className="min-h-[180px]"
                showToolbar={true}
              />
            </div>

            {/* Result Information */}
            <div className="mb-5">
              <label className="text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block transition-colors duration-300">
                Results & Score Declaration
              </label>
              <ApnaEditor
                value={formData.resultInformation}
                onChange={(value) =>
                  handleInputChange("resultInformation", value)
                }
                placeholder="Explain result announcement procedure, score checking process, and further steps..."
                className="min-h-[180px]"
                showToolbar={true}
              />
            </div>
          </div>

          {/* Document Uploads */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white transition-colors duration-300 mb-3 border-b border-gray-200 dark:border-slate-800 pb-2">
              Document Uploads
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Logo Upload */}
              <div>
                <ImageUpload
                  title="Upload Exam Logo"
                  type="image"
                  preview={formData.logo?.preview}
                  onFileChange={handleLogoChange}
                  onRemove={handleLogoRemove}
                  accept="image/*"
                  maxSize="2MB"
                  width="200px"
                  height="200px"
                  className="w-full"
                  uploadType="exams"
                  identifier="exam-logo"
                  onUploadSuccess={(fileData) => {
                    setFormData((prev) => ({
                      ...prev,
                      logo: { preview: fileData.fileUrl },
                    }));
                  }}
                  onUploadError={(error) => {
                    showError("Logo upload failed: " + error);
                  }}
                  showUploadProgress={true}
                />
                <p className="text-xs text-gray-500 dark:text-white/60 mt-1 transition-colors duration-300">
                  Upload official exam logo (PNG, JPG - Max 2MB)
                </p>
              </div>

              {/* PDF Upload */}
              <div>
                <ImageUpload
                  title="Upload Exam PDF"
                  type="file"
                  preview={formData.pdf?.preview}
                  onFileChange={handlePdfChange}
                  onRemove={handlePdfRemove}
                  accept=".pdf"
                  maxSize="10MB"
                  width="200px"
                  height="200px"
                  className="w-full"
                  uploadType="exams"
                  identifier="exam-pdf"
                  onUploadSuccess={(fileData) => {
                    setFormData((prev) => ({
                      ...prev,
                      pdf: { preview: fileData.fileUrl },
                    }));
                  }}
                  onUploadError={(error) => {
                    showError("PDF upload failed: " + error);
                  }}
                  showUploadProgress={true}
                />
                <p className="text-xs text-gray-500 dark:text-white/60 mt-1 transition-colors duration-300">
                  Upload official notification/brochure (PDF - Max 10MB)
                </p>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2 border-t border-gray-200 dark:border-slate-800 pt-4 transition-colors duration-300">
            <Link
              href="/admin/exam"
              className="px-3 py-1.5 text-xs text-gray-700 dark:text-white/80 border border-gray-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 no-underline hover:bg-gray-50 dark:hover:bg-slate-900/60 transition-colors duration-300"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={formLoading}
              className="px-3 py-1.5 text-xs text-white bg-blue-600 border-none rounded cursor-pointer font-medium hover:bg-blue-700 dark:hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-400/60 transition-colors duration-300"
            >
              {formLoading ? "Updating..." : "Update Exam"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
