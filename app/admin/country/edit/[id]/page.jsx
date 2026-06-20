"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import ApnaEditor from "@/components/utils/ApnaEditor";
import ImageUpload from "@/components/utils/ImageUpload";
import ApnaSelect from "@/components/utils/ApnaSelect";
import { useAuth } from "@/contexts/AuthContext";
import { showSuccess, showError } from "@/components/utils/ApnaNotify";

export default function EditCountryPage() {
  const params = useParams();
  const router = useRouter();
  const countryId = params.id;

  const { getAccessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [countryMasterOptions, setCountryMasterOptions] = useState([]);
  const [newPathway, setNewPathway] = useState({ title: "", duration: "", description: "" });

  // Fetch CountryMaster list for name/code dropdown
  useEffect(() => {
    fetch("/api/locations/country-master?all=true")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setCountryMasterOptions(
            res.data.map((c) => ({ value: c._id, label: c.name, code: c.code }))
          );
        }
      })
      .catch(() => {});
  }, []);

  const [formData, setFormData] = useState({
    name: "",
    shortName: "",
    code: "",
    capital: "",
    currency: "",
    language: "",
    population: "",
    timeZone: "",
    callingCode: "",

    // Study Metrics
    tuitionFeeMin: "",
    tuitionFeeMax: "",
    livingCostMin: "",
    livingCostMax: "",
    courseDuration: "",
    mediumOfTeaching: "",

    // Admission Details
    timeline: "",
    eligibility: "",
    visaType: "",

    // Media
    logo: null,
    banner: null,
    brochure: null,

    // Study Pathways & Gallery
    studyPathways: [],
    countryGallery: [],

    // Descriptions
    shortDescription: "",
    longDescription: "",

    // SEO
    metaTitle: "",
    metaDescription: "",
    focusKeyword: "",
    metaKeywords: "",
    canonicalUrl: "",
    ogTitle: "",
    ogDescription: "",
    ogImage: "",
    twitterTitle: "",
    twitterDescription: "",
    twitterImage: "",

    status: "active",
    isFeatured: false,
    isPopular: false,
    displayOrder: 0,
  });
  // Helper function for authenticated API calls
  const makeAuthenticatedRequest = async (url, options = {}) => {
    const token = getAccessToken();
    if (!token) {
      showError("Authentication required. Please log in again.");
      return { success: false, error: "No access token" };
    }

    const defaultOptions = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    };

    const response = await fetch(url, { ...defaultOptions, ...options });
    const data = await response.json();
    return data;
  };

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        console.log("🔄 Loading country data...");
        const countryResponse = await makeAuthenticatedRequest(
          `/api/countries/${countryId}`,
        );

        if (!isMounted) return;
        console.log("countryResponse ", countryResponse.data)
        if (countryResponse.success) {
          const country = countryResponse.data;
          setFormData({
            name: country.name || "",
            shortName: country.shortName || "",
            code: country.code || "",
            capital: country.capital || "",
            currency: country.currency || "",
            language: country.language || "",
            population: country.population || "",
            timeZone: country.timeZone || "",
            callingCode: country.callingCode || "",

            tuitionFeeMin: country.studyMetrics?.tuitionFeeMin || "",
            tuitionFeeMax: country.studyMetrics?.tuitionFeeMax || "",
            livingCostMin: country.studyMetrics?.livingCostMin || "",
            livingCostMax: country.studyMetrics?.livingCostMax || "",
            courseDuration: country.studyMetrics?.courseDuration || "",
            mediumOfTeaching: country.studyMetrics?.mediumOfTeaching || "",

            timeline: country.admissionDetails?.timeline || "",
            eligibility: country.admissionDetails?.eligibility || "",
            visaType: country.admissionDetails?.visaType || "",

            logo: country.logo || null,
            banner: country.banner || null,
            brochure: country.brochure || null,

            studyPathways: country.studyPathways || [],
            countryGallery: country.countryGallery || [],

            shortDescription: country.shortDescription || "",
            longDescription: country.longDescription || "",

            metaTitle: country.metaTitle || "",
            metaDescription: country.metaDescription || "",
            focusKeyword: country.focusKeyword || "",
            metaKeywords: country.metaKeywords && Array.isArray(country.metaKeywords) ? country.metaKeywords.join(", ") : "",
            canonicalUrl: country.canonicalUrl || "",
            ogTitle: country.ogTitle || "",
            ogDescription: country.ogDescription || "",
            ogImage: country.ogImage || "",
            twitterTitle: country.twitterTitle || "",
            twitterDescription: country.twitterDescription || "",
            twitterImage: country.twitterImage || "",

            status: country.status || "active",
            isFeatured: country.isFeatured || false,
            isPopular: country.isPopular || false,
            displayOrder: country.displayOrder || 0,
          });
        } else {
          showError("Failed to load country data: " + countryResponse.error);
          router.push("/admin/country");
          return;
        }
      } catch (error) {
        console.error("❌ Error loading country data:", error);
        showError("Failed to load data. Please refresh the page.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (countryId) {
      loadData();
    }

    return () => {
      isMounted = false;
    };
  }, [countryId, getAccessToken, router]);

  const handleAddPathway = () => {
    if (!newPathway.title.trim() || !newPathway.duration.trim()) {
      showError("Pathway Title and Duration are required");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      studyPathways: [...prev.studyPathways, newPathway],
    }));
    setNewPathway({ title: "", duration: "", description: "" });
  };

  const handleNewPathwayChange = (field, value) => {
    setNewPathway((prev) => ({ ...prev, [field]: value }));
  };

  const handlePathwayChange = (index, field, value) => {
    const updated = [...formData.studyPathways];
    updated[index] = { ...updated[index], [field]: value };
    setFormData((prev) => ({ ...prev, studyPathways: updated }));
  };

  const handleRemovePathway = (index) => {
    const updated = [...formData.studyPathways];
    updated.splice(index, 1);
    setFormData((prev) => ({ ...prev, studyPathways: updated }));
  };

  const handleAddGalleryImage = (fileData) => {
    setFormData((prev) => ({
      ...prev,
      countryGallery: [...prev.countryGallery, { url: fileData.fileUrl, type: "image" }],
    }));
  };

  const handleRemoveGalleryImage = (index) => {
    const updated = [...formData.countryGallery];
    updated.splice(index, 1);
    setFormData((prev) => ({ ...prev, countryGallery: updated }));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleEditorChange = (name, content) => {
    setFormData((prev) => ({ ...prev, [name]: content }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);

    try {
      const token = getAccessToken();
      if (!token) {
        showError("Authentication required.");
        setSubmitLoading(false);
        return;
      }

      // Format payload to match schema
      const payload = {
        name: formData.name,
        shortName: formData.shortName,
        code: formData.code,
        capital: formData.capital,
        currency: formData.currency,
        language: formData.language,
        population: formData.population,
        timeZone: formData.timeZone,
        callingCode: formData.callingCode,
        logo: formData.logo,
        banner: formData.banner,
        brochure: formData.brochure,
        studyPathways: formData.studyPathways,
        countryGallery: formData.countryGallery,
        shortDescription: formData.shortDescription,
        longDescription: formData.longDescription,
        metaTitle: formData.metaTitle,
        metaDescription: formData.metaDescription,
        focusKeyword: formData.focusKeyword,
        metaKeywords: formData.metaKeywords ? formData.metaKeywords.split(",").map(k => k.trim()).filter(Boolean) : [],
        canonicalUrl: formData.canonicalUrl,
        ogTitle: formData.ogTitle,
        ogDescription: formData.ogDescription,
        ogImage: formData.ogImage,
        twitterTitle: formData.twitterTitle,
        twitterDescription: formData.twitterDescription,
        twitterImage: formData.twitterImage,
        status: formData.status,
        isFeatured: formData.isFeatured,
        isPopular: formData.isPopular,
        displayOrder: Number(formData.displayOrder) || 0,

        studyMetrics: {
          tuitionFeeMin: Number(formData.tuitionFeeMin) || 0,
          tuitionFeeMax: Number(formData.tuitionFeeMax) || 0,
          livingCostMin: Number(formData.livingCostMin) || 0,
          livingCostMax: Number(formData.livingCostMax) || 0,
          courseDuration: formData.courseDuration,
          mediumOfTeaching: formData.mediumOfTeaching,
        },

        admissionDetails: {
          timeline: formData.timeline,
          eligibility: formData.eligibility,
          visaType: formData.visaType,
        },
      };

      const response = await makeAuthenticatedRequest(
        `/api/countries/${countryId}`,
        {
          method: "PUT",
          body: JSON.stringify(payload),
        },
      );

      if (response.success) {
        showSuccess("Country updated successfully!");
        router.push("/admin/country");
      } else {
        const errorMsg = response.details ? `${response.error}: ${response.details.join(", ")}` : response.error;
        showError("Failed to update country: " + errorMsg);
      }
    } catch (error) {
      console.error("Submit Error:", error);
      showError("An error occurred while updating the country");
    } finally {
      setSubmitLoading(false);
    }
  };

  
  const canAddPathway =
    formData.studyPathways.length === 0 ||
    (formData.studyPathways[formData.studyPathways.length - 1]?.title?.trim() !== "" &&
     formData.studyPathways[formData.studyPathways.length - 1]?.duration?.trim() !== "");

  // Common UI Classes
  const labelClassName =
    "text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block transition-colors";
  const inputClassName =
    "w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary/30 bg-white dark:bg-slate-900/70 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/50 transition-colors";
  const selectButtonClassName =
    "w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded text-sm text-left flex items-center justify-between outline-none focus:border-primary focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary/30 bg-white dark:bg-slate-900/70 text-gray-900 dark:text-white transition-colors cursor-pointer";
  const sectionHeadingClassName =
    "text-lg font-semibold text-gray-900 dark:text-white transition-colors";
  const checkboxClassName =
    "w-4 h-4 text-primary border-gray-300 dark:border-slate-700 rounded focus:ring-primary dark:bg-slate-900/70";
  const secondaryActionClassName =
    "px-4 py-2 text-sm text-gray-700 dark:text-white/80 border border-gray-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900/70 no-underline hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors";
  const primaryActionClassName =
    "px-4 py-2 text-sm text-white bg-primary border-none rounded cursor-pointer font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="h-full p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Page Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-0.5">
          <Link
            href="/admin/country"
            className="text-gray-600 dark:text-white/70 no-underline text-xs flex items-center gap-1 transition-colors"
          >
            <svg
              className="w-3.5 h-3.5 text-gray-500 dark:text-white/60"
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
            Back to Countries
          </Link>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-0.5">
          Edit Country
        </h1>
        <p className="text-xs text-gray-600 dark:text-white/70">
          Update study destination details
        </p>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800 rounded-lg p-5 shadow-sm transition-colors">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="border-b border-gray-200 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2 mb-4">
              <svg
                className="w-5 h-5 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h2 className={sectionHeadingClassName}>Basic Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClassName}>Country Name *</label>
                <ApnaSelect
                  title=""
                  options={countryMasterOptions}
                  value={countryMasterOptions.find((o) => o.label === formData.name)?.value || ""}
                  onChange={(val) => {
                    const selected = countryMasterOptions.find((o) => o.value === val);
                    if (selected) {
                      setFormData((prev) => ({
                        ...prev,
                        name: selected.label,
                        code: selected.code,
                      }));
                    }
                  }}
                  placeholder="Search & select country..."
                  searchable={true}
                  buttonClassName={selectButtonClassName}
                />
              </div>
              <div>
                <label className={labelClassName}>Short Name</label>
                <input
                  type="text"
                  name="shortName"
                  value={formData.shortName}
                  onChange={handleInputChange}
                  placeholder="Enter country short name"
                  className={inputClassName}
                />
              </div>
              <div>
                <label className={labelClassName}>
                  Country Code (e.g. IND) *
                </label>
                <ApnaSelect
                  title=""
                  options={countryMasterOptions.map(o => ({ value: o.code, label: o.code }))}
                  value={formData.code}
                  onChange={(val) => {
                    const selected = countryMasterOptions.find((o) => o.code === val);
                    if (selected) {
                      setFormData((prev) => ({
                        ...prev,
                        code: selected.code,
                        name: selected.label,
                      }));
                    } else {
                      setFormData((prev) => ({ ...prev, code: val }));
                    }
                  }}
                  placeholder="Select code..."
                  searchable={true}
                  buttonClassName={selectButtonClassName}
                />
              </div>
              <div>
                <label className={labelClassName}>Capital City</label>
                <input
                  type="text"
                  name="capital"
                  value={formData.capital}
                  onChange={handleInputChange}
                  placeholder="Enter capital"
                  className={inputClassName}
                />
              </div>
              <div>
                <label className={labelClassName}>Currency</label>
                <input
                  type="text"
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                  placeholder="e.g. USD, RUB"
                  className={inputClassName}
                />
              </div>
              <div>
                <label className={labelClassName}>Language *</label>
                <input
                  required
                  type="text"
                  name="language"
                  value={formData.language}
                  onChange={handleInputChange}
                  placeholder="e.g. English, Mandarin"
                  className={inputClassName}
                />
              </div>
              <div>
                <label className={labelClassName}>Population *</label>
                <input
                  required
                  type="text"
                  name="population"
                  value={formData.population}
                  onChange={handleInputChange}
                  placeholder="e.g. 1.4 Billion"
                  className={inputClassName}
                />
              </div>
              <div>
                <label className={labelClassName}>Time Zone *</label>
                <input
                  required
                  type="text"
                  name="timeZone"
                  value={formData.timeZone}
                  onChange={handleInputChange}
                  placeholder="e.g. UTC+8"
                  className={inputClassName}
                />
              </div>
              <div>
                <label className={labelClassName}>Calling Code *</label>
                <input
                  required
                  type="text"
                  name="callingCode"
                  value={formData.callingCode}
                  onChange={handleInputChange}
                  placeholder="e.g. +86"
                  className={inputClassName}
                />
              </div>
            </div>
          </div>

          {/* Study Metrics */}
          <div className="border-b border-gray-200 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2 mb-4">
              <svg
                className="w-5 h-5 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h2 className={sectionHeadingClassName}>
                Study & Financial Metrics
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className={labelClassName}>
                  Min Tuition Fee (INR) *
                </label>
                <input
                  required
                  type="number"
                  name="tuitionFeeMin"
                  value={formData.tuitionFeeMin}
                  onChange={handleInputChange}
                  placeholder="e.g. 200000"
                  className={inputClassName}
                />
              </div>
              <div>
                <label className={labelClassName}>Max Tuition Fee (INR)</label>
                <input
                  type="number"
                  name="tuitionFeeMax"
                  value={formData.tuitionFeeMax}
                  onChange={handleInputChange}
                  placeholder="e.g. 800000"
                  className={inputClassName}
                />
              </div>
              <div>
                <label className={labelClassName}>Min Living Cost (INR)</label>
                <input
                  type="number"
                  name="livingCostMin"
                  value={formData.livingCostMin}
                  onChange={handleInputChange}
                  placeholder="e.g. 15000"
                  className={inputClassName}
                />
              </div>
              <div>
                <label className={labelClassName}>Max Living Cost (INR)</label>
                <input
                  type="number"
                  name="livingCostMax"
                  value={formData.livingCostMax}
                  onChange={handleInputChange}
                  placeholder="e.g. 30000"
                  className={inputClassName}
                />
              </div>
              <div>
                <label className={labelClassName}>Course Duration *</label>
                <input
                  required
                  type="text"
                  name="courseDuration"
                  value={formData.courseDuration}
                  onChange={handleInputChange}
                  placeholder="e.g. 5 Years"
                  className={inputClassName}
                />
              </div>
              <div>
                <label className={labelClassName}>Medium of Teaching</label>
                <input
                  type="text"
                  name="mediumOfTeaching"
                  value={formData.mediumOfTeaching}
                  onChange={handleInputChange}
                  placeholder="e.g. English"
                  className={inputClassName}
                />
              </div>
            </div>
          </div>

          {/* Admission Details */}
          <div className="border-b border-gray-200 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2 mb-4">
              <svg
                className="w-5 h-5 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h2 className={sectionHeadingClassName}>Admission Details</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClassName}>Admission Timeline</label>
                <input
                  type="text"
                  name="timeline"
                  value={formData.timeline}
                  onChange={handleInputChange}
                  placeholder="e.g. September - November"
                  className={inputClassName}
                />
              </div>
              <div>
                <label className={labelClassName}>Eligibility Criteria</label>
                <input
                  type="text"
                  name="eligibility"
                  value={formData.eligibility}
                  onChange={handleInputChange}
                  placeholder="e.g. 10+2 with 50% PCB"
                  className={inputClassName}
                />
              </div>
              <div>
                <label className={labelClassName}>Visa Type</label>
                <input
                  type="text"
                  name="visaType"
                  value={formData.visaType}
                  onChange={handleInputChange}
                  placeholder="e.g. Student Visa"
                  className={inputClassName}
                />
              </div>
            </div>
          </div>

          {/* Study Pathways */}
          <div className="border-b border-gray-200 dark:border-slate-800 pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <h2 className={sectionHeadingClassName}>Study Pathways</h2>
              </div>
            </div>

            <div className="mb-6 p-4 border border-primary-200 dark:border-primary/30 rounded-lg bg-primary-50/30 dark:bg-primary/5">
              <h4 className="text-sm font-semibold mb-4 text-gray-900 dark:text-white">Add New Pathway</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <div>
                  <label className={labelClassName}>Pathway Title</label>
                  <input type="text" value={newPathway.title} onChange={(e) => handleNewPathwayChange("title", e.target.value)} className={inputClassName} placeholder="e.g. MBBS in China" />
                </div>
                <div>
                  <label className={labelClassName}>Duration</label>
                  <input type="text" value={newPathway.duration} onChange={(e) => handleNewPathwayChange("duration", e.target.value)} className={inputClassName} placeholder="e.g. 6 years" />
                </div>
              </div>
              <div className="mb-3">
                <label className={labelClassName}>Description</label>
                <textarea value={newPathway.description} onChange={(e) => handleNewPathwayChange("description", e.target.value)} rows={2} className={inputClassName} placeholder="Brief description of this pathway..." />
              </div>
              <div className="flex justify-end">
                <button type="button" onClick={handleAddPathway} className="bg-primary text-white px-4 py-2 text-sm rounded hover:bg-primary-700 transition-colors shadow-sm">
                  + Add Pathways
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              {formData.studyPathways.map((pathway, index) => (
                <div key={index} className="flex items-center justify-between p-4 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800/50 hover:shadow-sm transition-shadow">
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-semibold text-sm text-gray-900 dark:text-white truncate" title={pathway.title}>{pathway.title}</h4>
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                      <p className="text-xs text-primary font-medium whitespace-nowrap">{pathway.duration}</p>
                    </div>
                    {pathway.description ? (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2" title={pathway.description}>{pathway.description}</p>
                    ) : (
                      <span className="text-xs text-gray-400 italic">No description</span>
                    )}
                  </div>
                  <button type="button" onClick={() => handleRemovePathway(index)} className="shrink-0 text-xs bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded transition-colors dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40">
                    Remove
                  </button>
                </div>
              ))}
              {formData.studyPathways.length === 0 && (
                <div className="text-center py-6 text-sm text-gray-500 border border-dashed border-gray-300 dark:border-slate-700 rounded-lg">No pathways added yet.</div>
              )}
            </div>
          </div>

          {/* Media & Documents */}
          <div className="border-b border-gray-200 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2 mb-4">
              <svg
                className="w-5 h-5 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <h2 className={sectionHeadingClassName}>Media & Documents</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <ImageUpload
                  title="Country Logo"
                  type="image"
                  preview={formData.logo}
                  onFileChange={(file, preview) =>
                    setFormData((prev) => ({ ...prev, logo: preview }))
                  }
                  onRemove={() =>
                    setFormData((prev) => ({ ...prev, logo: null }))
                  }
                  accept="image/*"
                  maxSize="2MB"
                  width="200px"
                  height="200px"
                  className="w-full"
                  uploadType="countries"
                  identifier="country-logo"
                  onUploadSuccess={(fileData) => {
                    setFormData((prev) => ({
                      ...prev,
                      logo: fileData.fileUrl,
                    }));
                  }}
                  onUploadError={(error) => {
                    console.error("Logo upload failed:", error);
                  }}
                  showUploadProgress={true}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Upload country logo (PNG, JPG - Max 2MB)
                </p>
              </div>
              <div>
                <ImageUpload
                  title="Country Banner"
                  type="image"
                  preview={formData.banner}
                  onFileChange={(file, preview) =>
                    setFormData((prev) => ({ ...prev, banner: preview }))
                  }
                  onRemove={() =>
                    setFormData((prev) => ({ ...prev, banner: null }))
                  }
                  accept="image/*"
                  maxSize="5MB"
                  width="200px"
                  height="200px"
                  className="w-full"
                  uploadType="countries"
                  identifier="country-banner"
                  onUploadSuccess={(fileData) => {
                    setFormData((prev) => ({
                      ...prev,
                      banner: fileData.fileUrl,
                    }));
                  }}
                  onUploadError={(error) => {
                    console.error("Banner upload failed:", error);
                  }}
                  showUploadProgress={true}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Upload country banner (PNG, JPG - Max 5MB)
                </p>
              </div>
              <div className="col-span-2 md:col-span-1">
                <ImageUpload
                  title="Country Brochure"
                  type="document"
                  preview={formData.brochure}
                  onFileChange={(file, preview) => setFormData((prev) => ({ ...prev, brochure: preview }))}
                  onRemove={() => setFormData((prev) => ({ ...prev, brochure: null }))}
                  accept=".pdf"
                  maxSize="10MB"
                  width="100%"
                  height="120px"
                  className="w-full"
                  uploadType="countries"
                  identifier="country-brochure"
                  onUploadSuccess={(fileData) => setFormData((prev) => ({ ...prev, brochure: fileData.fileUrl }))}
                />
              </div>
            </div>

            {/* Country Gallery */}
            <div className="mt-6 pt-4 border-t border-dashed border-gray-200 dark:border-slate-700">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-4">
                {formData.countryGallery.map((item, idx) => (
                  <div key={idx} className="relative aspect-square border rounded-lg overflow-hidden group border-gray-200 dark:border-slate-700">
                    <img src={item.url} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => handleRemoveGalleryImage(idx)} className="absolute top-1 right-1 bg-red-500/90 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      ✕
                    </button>
                  </div>
                ))}
                <div className="aspect-square">
                  <ImageUpload
                    title="Country Gallery (Multiple)"
                    type="image"
                    preview={null}
                    onFileChange={() => {}}
                    onRemove={() => {}}
                    accept="image/*"
                    multiple={true}
                    maxSize="3MB"
                    width="100%"
                    height="100%"
                    className="w-full h-full"
                    uploadType="countries"
                    identifier="country-gallery"
                    onUploadSuccess={handleAddGalleryImage}
                    showUploadProgress={true}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="border-b border-gray-200 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2 mb-4">
              <svg
                className="w-5 h-5 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h2 className={sectionHeadingClassName}>Description</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className={labelClassName}>
                  Short Description (max 1500 characters)
                </label>
                <textarea
                  name="shortDescription"
                  value={formData.shortDescription}
                  onChange={handleInputChange}
                  rows={4}
                  maxLength={1500}
                  className={inputClassName}
                  placeholder="Enter short description..."
                />
              </div>
              <div>
                <label className={labelClassName}>Long Description</label>
                <div className="min-h-[300px] border border-gray-200 dark:border-slate-700 rounded overflow-hidden">
                  <ApnaEditor
                    value={formData.longDescription}
                    onChange={(content) =>
                      handleEditorChange("longDescription", content)
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Status & Metadata */}
          <div className="border-b border-gray-200 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2 mb-4">
              <svg
                className="w-5 h-5 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h2 className={sectionHeadingClassName}>Status & Metadata</h2>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className={labelClassName}>Capital City *</label>
                <input
                  required
                  type="text"
                  name="capital"
                  value={formData.capital}
                  onChange={handleInputChange}
                  placeholder="Enter capital"
                  className={inputClassName}
                />
              </div>
              <div>
                <label className={labelClassName}>Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className={inputClassName}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
              <div>
                <label className={labelClassName}>Display Order</label>
                <input
                  type="number"
                  name="displayOrder"
                  value={formData.displayOrder}
                  onChange={handleInputChange}
                  className={inputClassName}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-white/80 cursor-pointer">
                <input
                  type="checkbox"
                  name="isFeatured"
                  checked={formData.isFeatured}
                  onChange={handleInputChange}
                  className={checkboxClassName}
                />
                Mark as featured
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-white/80 cursor-pointer">
                <input
                  type="checkbox"
                  name="isPopular"
                  checked={formData.isPopular}
                  onChange={handleInputChange}
                  className={checkboxClassName}
                />
                Mark as popular
              </label>
            </div>
          </div>

          {/* SEO Information */}
          <div className="pb-4">
            <div className="flex items-center gap-2 mb-4">
              <svg
                className="w-5 h-5 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                />
              </svg>
              <h2 className={sectionHeadingClassName}>SEO Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClassName}>Meta Title</label>
                <input
                  type="text"
                  name="metaTitle"
                  value={formData.metaTitle}
                  onChange={handleInputChange}
                  placeholder="Enter meta title"
                  className={inputClassName}
                />
              </div>
              <div>
                <label className={labelClassName}>Focus Keyword</label>
                <input
                  type="text"
                  name="focusKeyword"
                  value={formData.focusKeyword}
                  onChange={handleInputChange}
                  placeholder="Enter focus keyword"
                  className={inputClassName}
                />
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className={labelClassName}>Meta Description</label>
                <textarea
                  name="metaDescription"
                  value={formData.metaDescription}
                  onChange={handleInputChange}
                  rows={2}
                  className={inputClassName}
                  placeholder="Enter meta description"
                />
              </div>
              <div className="col-span-1 md:col-span-2 mt-4 pt-4 border-t border-gray-200 dark:border-slate-800">
                <h3 className="text-sm font-medium mb-3 text-gray-900 dark:text-white">Advanced SEO & Open Graph</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClassName}>Meta Keywords (comma separated)</label>
                    <input type="text" name="metaKeywords" value={formData.metaKeywords} onChange={handleInputChange} placeholder="e.g. mbbs in china, study abroad" className={inputClassName} />
                  </div>
                  <div>
                    <label className={labelClassName}>Canonical URL</label>
                    <input type="text" name="canonicalUrl" value={formData.canonicalUrl} onChange={handleInputChange} placeholder="https://example.com/country/china" className={inputClassName} />
                  </div>
                  <div>
                    <label className={labelClassName}>OG Title</label>
                    <input type="text" name="ogTitle" value={formData.ogTitle} onChange={handleInputChange} className={inputClassName} />
                  </div>
                  <div>
                    <label className={labelClassName}>OG Description</label>
                    <textarea name="ogDescription" value={formData.ogDescription} onChange={handleInputChange} rows={2} className={inputClassName} />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <label className={labelClassName}>OG Image URL</label>
                    <input type="text" name="ogImage" value={formData.ogImage} onChange={handleInputChange} className={inputClassName} />
                  </div>
                  <div>
                    <label className={labelClassName}>Twitter Title</label>
                    <input type="text" name="twitterTitle" value={formData.twitterTitle} onChange={handleInputChange} className={inputClassName} />
                  </div>
                  <div>
                    <label className={labelClassName}>Twitter Description</label>
                    <textarea name="twitterDescription" value={formData.twitterDescription} onChange={handleInputChange} rows={2} className={inputClassName} />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <label className={labelClassName}>Twitter Image URL</label>
                    <input type="text" name="twitterImage" value={formData.twitterImage} onChange={handleInputChange} className={inputClassName} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="border-t border-gray-200 dark:border-slate-800 pt-4 flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={() => router.back()}
              className={secondaryActionClassName}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitLoading}
              className={primaryActionClassName}
            >
              {submitLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </div>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
