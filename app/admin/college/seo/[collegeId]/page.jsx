"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ImageUpload from "@/components/utils/ImageUpload";
import { showSuccess, showError } from "@/components/utils/ApnaNotify";
import { useAuth } from "@/contexts/AuthContext";
import { aiService } from "@/lib/services/aiService";
import { HiSparkles } from "react-icons/hi";

export default function CollegeSEOPage({ params }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const { getAccessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [collegeName, setCollegeName] = useState("");
  const [collegeSlug, setCollegeSlug] = useState("");
  const [collegeData, setCollegeData] = useState(null);
  const [keyword, setKeyword] = useState("");
  const [formData, setFormData] = useState({
    metaTitle: "",
    metaDescription: "",
    metaKeywords: [],
    focusKeyword: "",
    canonicalUrl: "",
    ogTitle: "",
    ogDescription: "",
    ogImage: "",
    twitterTitle: "",
    twitterDescription: "",
    twitterImage: "",
    schemaMarkup: "",
  });

  // Fetch college SEO data
  useEffect(() => {
    const fetchSEOData = async () => {
      try {
        setPageLoading(true);
        const token = getAccessToken();
        if (!token) {
          showError("Authentication required. Please log in again.");
          return;
        }

        const response = await fetch(
          `/api/colleges/${resolvedParams.collegeId}/seo`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (data.success) {
          setCollegeName(data.data.name);
          setCollegeSlug(data.data.slug);
          setFormData({
            metaTitle: data.data.metaTitle || "",
            metaDescription: data.data.metaDescription || "",
            metaKeywords: data.data.metaKeywords || [],
            focusKeyword: data.data.focusKeyword || "",
            canonicalUrl: data.data.canonicalUrl || "",
            ogTitle: data.data.ogTitle || "",
            ogDescription: data.data.ogDescription || "",
            ogImage: data.data.ogImage || "",
            twitterTitle: data.data.twitterTitle || "",
            twitterDescription: data.data.twitterDescription || "",
            twitterImage: data.data.twitterImage || "",
            schemaMarkup: data.data.schemaMarkup || "",
          });

          // Fetch full college details for AI generation
          fetchCollegeDetails();
        } else {
          // Detailed error message
          let errorMsg = data.error || "Failed to fetch SEO data";

          if (data.errorType) {
            errorMsg += ` (${data.errorType})`;
          }
          if (data.details && data.details !== data.error) {
            errorMsg += `\n\nDetails: ${data.details}`;
          }

          showError(errorMsg);
          console.error("SEO Fetch Error Details:", data);
        }
      } catch (error) {
        console.error("Error fetching SEO data:", error);

        // Detailed error message
        let errorMessage = "Error fetching SEO data";

        if (error.message) {
          errorMessage = error.message;
        }

        showError(errorMessage);
      } finally {
        setPageLoading(false);
      }
    };

    fetchSEOData();
  }, [resolvedParams.collegeId]);

  // Fetch full college details for AI
  const fetchCollegeDetails = async () => {
    try {
      const token = getAccessToken();
      if (!token) return;

      const response = await fetch(
        `/api/colleges/${resolvedParams.collegeId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setCollegeData(data.data);

        // Auto-fill canonical URL if not set
        if (!formData.canonicalUrl && data.data.slug) {
          const collegeUrl = `${window.location.origin}/colleges/${data.data.slug}`;
          setFormData((prev) => ({ ...prev, canonicalUrl: collegeUrl }));
        }

        // Auto-fill OG/Twitter images with college logo if not already set
        if (!formData.ogImage && data.data.logo) {
          setFormData((prev) => ({ ...prev, ogImage: data.data.logo }));
        }
        if (!formData.twitterImage && data.data.logo) {
          setFormData((prev) => ({ ...prev, twitterImage: data.data.logo }));
        }
      }
    } catch (error) {
      console.error("Error fetching college details:", error);
    }
  };

  // Generate SEO data using AI
  const handleAIGenerate = async () => {
    try {
      if (!collegeData) {
        showError("College data not loaded. Please refresh the page.");
        return;
      }

      setAiGenerating(true);

      // Prepare college data for AI
      const aiCollegeData = {
        name: collegeData.name,
        popularName: collegeData.popularName,
        estdYear: collegeData.estdYear,
        state: collegeData.state?.name,
        district: collegeData.district?.name,
        location: collegeData.location,
        ownership: collegeData.ownership?.name,
        affiliation: collegeData.affiliation?.name,
        shortDescription: collegeData.shortDescription,
      };

      // Generate SEO data
      const generatedSEO = await aiService.generateCollegeSEO(aiCollegeData);

      // Update form with generated data
      setFormData({
        ...formData,
        metaTitle: generatedSEO.metaTitle || formData.metaTitle,
        metaDescription:
          generatedSEO.metaDescription || formData.metaDescription,
        metaKeywords: generatedSEO.metaKeywords || formData.metaKeywords,
        focusKeyword: generatedSEO.focusKeyword || formData.focusKeyword,
        ogTitle: generatedSEO.ogTitle || formData.ogTitle,
        ogDescription: generatedSEO.ogDescription || formData.ogDescription,
        twitterTitle: generatedSEO.twitterTitle || formData.twitterTitle,
        twitterDescription:
          generatedSEO.twitterDescription || formData.twitterDescription,
      });

      showSuccess("SEO data generated successfully! Review and save.");
    } catch (error) {
      console.error("AI Generation Error:", error);
      showError(error.message || "Failed to generate SEO data using AI");
    } finally {
      setAiGenerating(false);
    }
  };

  const handleAddKeyword = () => {
    if (keyword.trim() && !formData.metaKeywords.includes(keyword.trim())) {
      setFormData({
        ...formData,
        metaKeywords: [...formData.metaKeywords, keyword.trim()],
      });
      setKeyword("");
    }
  };

  const handleRemoveKeyword = (indexToRemove) => {
    setFormData({
      ...formData,
      metaKeywords: formData.metaKeywords.filter(
        (_, index) => index !== indexToRemove
      ),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const token = getAccessToken();
      if (!token) {
        showError("Authentication required. Please log in again.");
        return;
      }

      // Auto-generate schema markup if not provided
      let schemaMarkup = formData.schemaMarkup;
      if (!schemaMarkup) {
        // Get full image URL (add origin if relative path)
        const getFullImageUrl = (imagePath) => {
          if (!imagePath) return "";
          if (
            imagePath.startsWith("http://") ||
            imagePath.startsWith("https://")
          ) {
            return imagePath;
          }
          return `${window.location.origin}${
            imagePath.startsWith("/") ? "" : "/"
          }${imagePath}`;
        };

        // Use OG image, fallback to college logo (ensure full URL)
        const imageUrl = getFullImageUrl(
          formData.ogImage || collegeData?.logo || ""
        );

        // Build address object
        const addressObj = {
          "@type": "PostalAddress",
          addressCountry: "IN",
        };

        if (collegeData?.address?.fullAddress) {
          addressObj.streetAddress = collegeData.address.fullAddress;
        } else if (collegeData?.location) {
          addressObj.streetAddress = collegeData.location;
        }

        if (collegeData?.district?.name) {
          addressObj.addressLocality = collegeData.district.name;
        }

        if (collegeData?.state?.name) {
          addressObj.addressRegion = collegeData.state.name;
        }

        if (collegeData?.address?.pinCode) {
          addressObj.postalCode = collegeData.address.pinCode;
        }

        const schema = {
          "@context": "https://schema.org",
          "@type": "EducationalOrganization",
          name: collegeName,
          url: `${window.location.origin}/colleges/${collegeSlug}`,
          description: formData.metaDescription || "",
          image: imageUrl,
          address: addressObj,
          sameAs: [],
        };

        // Add keywords if available
        if (formData.metaKeywords && formData.metaKeywords.length > 0) {
          schema.keywords = formData.metaKeywords.join(", ");
        }

        // Add email if available
        if (collegeData?.emailAddress) {
          schema.email = collegeData.emailAddress;
        }

        // Add phone if available
        if (collegeData?.phoneNumber) {
          schema.telephone = collegeData.phoneNumber;
        }

        schemaMarkup = JSON.stringify(schema, null, 2);
      }

      const response = await fetch(
        `/api/colleges/${resolvedParams.collegeId}/seo`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...formData,
            schemaMarkup,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        showSuccess("SEO data updated successfully! Redirecting...");
        // Redirect to college lists page after 1 second
        setTimeout(() => {
          router.push("/admin/college");
        }, 1000);
      } else {
        // Clean, short error message
        let errorMsg = "Failed to update SEO data";

        // Show validation errors in clean format
        if (data.validationErrors) {
          const validations = Object.entries(data.validationErrors);
          if (validations.length === 1) {
            // Single error - show field and message
            const [field, msg] = validations[0];
            errorMsg = msg.replace(/Path `.*?` /, "").replace(field + ": ", "");
          } else {
            // Multiple errors - show count
            errorMsg = `${validations.length} validation errors found. Please check all fields.`;
          }
        } else if (data.error) {
          // Use provided error message (already clean from API)
          errorMsg = data.error;
        }

        showError(errorMsg);
        // Log full details to console for debugging
        console.error("SEO Update Error:", {
          error: data.error,
          validationErrors: data.validationErrors,
          errorType: data.errorType,
          details: data.details,
        });
      }
    } catch (error) {
      console.error("Error updating SEO data:", error);

      // Clean error message
      let errorMessage = "Failed to save SEO data";

      if (error.message) {
        errorMessage = error.message;
      }

      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/admin/college");
  };

  if (pageLoading) {
    return (
      <div className="h-full p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500 dark:text-white/70">
            Loading SEO data...
          </div>
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
  const aiButtonClass =
    "flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed";
  const cardClass =
    "bg-white dark:bg-slate-900/70 rounded-lg shadow-sm border border-gray-200 dark:border-slate-800 p-6 transition-colors";
  const sectionTitleClass =
    "text-lg font-semibold text-gray-900 dark:text-white mb-4";
  const labelClassName =
    "block text-sm font-medium text-gray-700 dark:text-white/80 mb-1.5 transition-colors";
  const inputClassName =
    "w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary/30 focus:border-transparent bg-white dark:bg-slate-900/70 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/50 transition-colors";
  const textareaClassName = `${inputClassName} font-sans`;
  const helperTextClassName =
    "text-xs text-gray-500 dark:text-white/60 mt-1 transition-colors";
  const keywordBadgeClass =
    "inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-white/70 rounded-full text-sm transition-colors";
  const primaryButtonClass =
    "px-6 py-2 text-white rounded-lg bg-primary hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary/30";
  const secondaryButtonClass =
    "px-6 py-2 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-white/80 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const infoBoxClass =
    "bg-blue-50 dark:bg-slate-900/60 border border-blue-200 dark:border-slate-800 rounded-lg p-3 transition-colors";
  const smallPrimaryButtonClass =
    "px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const keywordRemoveButtonClass =
    "text-gray-500 dark:text-white/60 hover:text-red-600 transition-colors";

  return (
    <div className={pageWrapperClass}>
      {/* Page Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-0.5">
          <Link href="/admin/college" className={headerLinkClass}>
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
            Back to Colleges
          </Link>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className={headerTitleClass}>SEO Management - {collegeName}</h1>
            <p className={headerSubtitleClass}>
              Manage search engine optimization data for this college
            </p>
          </div>
          <button
            type="button"
            onClick={handleAIGenerate}
            disabled={aiGenerating || !collegeData}
            className={aiButtonClass}
          >
            <HiSparkles className="w-5 h-5" />
            {aiGenerating ? "Generating..." : "Generate with AI"}
          </button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic SEO */}
        <div className={cardClass}>
          <h2 className={sectionTitleClass}>Basic SEO</h2>
          <div className="space-y-4">
            {/* Meta Title */}
            <div>
              <label className={labelClassName}>
                Meta Title
                <span className="text-xs text-gray-500 dark:text-white/60 ml-2 transition-colors">
                  (Max 60 chars)
                </span>
              </label>
              <input
                type="text"
                value={formData.metaTitle}
                onChange={(e) =>
                  setFormData({ ...formData, metaTitle: e.target.value })
                }
                maxLength={60}
                className={inputClassName}
                placeholder="Enter meta title for search engines"
              />
              <p className={helperTextClassName}>
                {formData.metaTitle.length}/60 characters
              </p>
            </div>

            {/* Meta Description */}
            <div>
              <label className={labelClassName}>
                Meta Description
                <span className="text-xs text-gray-500 dark:text-white/60 ml-2 transition-colors">
                  (Max 160 chars)
                </span>
              </label>
              <textarea
                value={formData.metaDescription}
                onChange={(e) =>
                  setFormData({ ...formData, metaDescription: e.target.value })
                }
                maxLength={160}
                rows={3}
                className={textareaClassName}
                placeholder="Enter meta description for search engines"
              />
              <p className={helperTextClassName}>
                {formData.metaDescription.length}/160 characters
              </p>
            </div>

            {/* Focus Keyword */}
            <div>
              <label className={labelClassName}>Focus Keyword</label>
              <input
                type="text"
                value={formData.focusKeyword}
                onChange={(e) =>
                  setFormData({ ...formData, focusKeyword: e.target.value })
                }
                maxLength={100}
                className={inputClassName}
                placeholder="Enter primary focus keyword"
              />
            </div>

            {/* Meta Keywords */}
            <div>
              <label className={labelClassName}>Meta Keywords</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddKeyword();
                    }
                  }}
                  className={inputClassName}
                  placeholder="Add keyword and press Enter or click Add"
                />
                <button
                  type="button"
                  onClick={handleAddKeyword}
                  className={smallPrimaryButtonClass}
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.metaKeywords.map((kw, index) => (
                  <span key={index} className={keywordBadgeClass}>
                    {kw}
                    <button
                      type="button"
                      onClick={() => handleRemoveKeyword(index)}
                      className={keywordRemoveButtonClass}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Canonical URL */}
            <div>
              <label className={labelClassName}>Canonical URL</label>
              <input
                type="url"
                value={formData.canonicalUrl}
                readOnly
                className={`${inputClassName} bg-gray-50 dark:bg-slate-900/40 text-gray-600 dark:text-white/60 cursor-not-allowed`}
                placeholder="Auto-generated from college slug"
              />
              <p className={helperTextClassName}>
                This URL is automatically generated from the college slug
              </p>
            </div>
          </div>
        </div>

        {/* Open Graph (Facebook/LinkedIn) */}
        <div className={cardClass}>
          <h2 className={sectionTitleClass}>Open Graph (Facebook/LinkedIn)</h2>
          <div className="space-y-4">
            <div>
              <label className={labelClassName}>
                OG Title
                <span className="text-xs text-gray-500 dark:text-white/60 ml-2 transition-colors">
                  (Max 60 chars)
                </span>
              </label>
              <input
                type="text"
                value={formData.ogTitle}
                onChange={(e) =>
                  setFormData({ ...formData, ogTitle: e.target.value })
                }
                maxLength={60}
                className={inputClassName}
                placeholder="Enter Open Graph title"
              />
            </div>

            <div>
              <label className={labelClassName}>
                OG Description
                <span className="text-xs text-gray-500 dark:text-white/60 ml-2 transition-colors">
                  (Max 160 chars)
                </span>
              </label>
              <textarea
                value={formData.ogDescription}
                onChange={(e) =>
                  setFormData({ ...formData, ogDescription: e.target.value })
                }
                maxLength={160}
                rows={3}
                className={textareaClassName}
                placeholder="Enter Open Graph description"
              />
            </div>

            <div>
              <ImageUpload
                title="OG Image (Optional)"
                type="single"
                accept="image/*"
                maxSize="2MB"
                width="100%"
                height="200px"
                preview={formData.ogImage}
                onFileChange={(file, preview) => {
                  setFormData({ ...formData, ogImage: preview });
                }}
                onRemove={() => {
                  setFormData({ ...formData, ogImage: "" });
                }}
                uploadType="college-seo"
                identifier={`og-image-${resolvedParams.collegeId}`}
                showUploadProgress={true}
              />
              <p className={helperTextClassName}>
                Recommended size: 1200x630px for best results on
                Facebook/LinkedIn
              </p>
            </div>
          </div>
        </div>

        {/* Twitter Card */}
        <div className={cardClass}>
          <h2 className={sectionTitleClass}>Twitter Card</h2>
          <div className="space-y-4">
            <div>
              <label className={labelClassName}>
                Twitter Title
                <span className="text-xs text-gray-500 dark:text-white/60 ml-2 transition-colors">
                  (Max 60 chars)
                </span>
              </label>
              <input
                type="text"
                value={formData.twitterTitle}
                onChange={(e) =>
                  setFormData({ ...formData, twitterTitle: e.target.value })
                }
                maxLength={60}
                className={inputClassName}
                placeholder="Enter Twitter title"
              />
            </div>

            <div>
              <label className={labelClassName}>
                Twitter Description
                <span className="text-xs text-gray-500 dark:text-white/60 ml-2 transition-colors">
                  (Max 160 chars)
                </span>
              </label>
              <textarea
                value={formData.twitterDescription}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    twitterDescription: e.target.value,
                  })
                }
                maxLength={160}
                rows={3}
                className={textareaClassName}
                placeholder="Enter Twitter description"
              />
            </div>

            <div>
              <ImageUpload
                title="Twitter Image (Optional)"
                type="single"
                accept="image/*"
                maxSize="2MB"
                width="100%"
                height="200px"
                preview={formData.twitterImage}
                onFileChange={(file, preview) => {
                  setFormData({ ...formData, twitterImage: preview });
                }}
                onRemove={() => {
                  setFormData({ ...formData, twitterImage: "" });
                }}
                uploadType="college-seo"
                identifier={`twitter-image-${resolvedParams.collegeId}`}
                showUploadProgress={true}
              />
              <p className={helperTextClassName}>
                Recommended size: 1200x675px for Twitter cards
              </p>
            </div>
          </div>
        </div>

        {/* Structured Data */}
        <div className={cardClass}>
          <h2 className={sectionTitleClass}>Structured Data (JSON-LD)</h2>
          <div className={`${infoBoxClass} mb-4`}>
            <p className="text-sm text-blue-800 dark:text-white/70 transition-colors">
              <strong>Auto-Generate:</strong> Leave this field empty to
              automatically generate schema markup based on your college data.
              Or manually enter custom JSON-LD structured data.
            </p>
          </div>
          <div>
            <label className={labelClassName}>Schema Markup (Optional)</label>
            <textarea
              value={formData.schemaMarkup}
              onChange={(e) =>
                setFormData({ ...formData, schemaMarkup: e.target.value })
              }
              rows={10}
              className={`${textareaClassName} font-mono text-sm`}
              placeholder='Leave empty for auto-generation or enter custom JSON-LD&#10;Example:&#10;{&#10;  "@context": "https://schema.org",&#10;  "@type": "EducationalOrganization",&#10;  "name": "College Name",&#10;  ...&#10;}'
            />
            <p className={helperTextClassName}>
              Valid JSON-LD structured data markup (Leave empty to
              auto-generate)
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={handleCancel}
            className={secondaryButtonClass}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={primaryButtonClass}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save SEO Data"}
          </button>
        </div>
      </form>
    </div>
  );
}
