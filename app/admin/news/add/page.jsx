"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ApnaSelect from "@/components/utils/ApnaSelect";
import ApnaEditor from "@/components/utils/ApnaEditor";
import ImageUpload from "@/components/utils/ImageUpload";
import { showSuccess, showError } from "@/components/utils/ApnaNotify";
import { aiService } from "@/lib/services/aiService";
import { HiSparkles } from "react-icons/hi";

export default function AddNews() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [categories, setCategories] = useState([]);
  const initialFormState = {
    title: "",
    slug: "",
    shortDescription: "",
    content: "",
    category: "",
    featuredImage: null,
    tags: [],
    isFeatured: false,
    status: "draft",
    // SEO Fields
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    focusKeyword: "",
    canonicalUrl: "",
    ogTitle: "",
    ogDescription: "",
    ogImage: "",
    twitterTitle: "",
    twitterDescription: "",
    twitterImage: "",
    schemaMarkup: "",
  };
  const [formData, setFormData] = useState({
    ...initialFormState,
  });

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Fetch categories for dropdown
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await fetch("/api/news-categories", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        if (data.success) {
          setCategories(data.data);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Auto-generate slug when title changes (only if slug is empty or matches previous auto-generated slug)
    if (field === "title") {
      const autoSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim("-");

      // Auto-generate canonical URL from slug
      const canonicalUrl = autoSlug
        ? `${window.location.origin}/news/${autoSlug}`
        : "";

      // Only auto-update slug if it's empty or if it looks like it was auto-generated
      const currentSlug = formData.slug;
      if (
        !currentSlug ||
        currentSlug ===
          formData.title
            ?.toLowerCase()
            .replace(/[^a-z0-9 -]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .trim("-")
      ) {
        setFormData((prev) => ({
          ...prev,
          slug: autoSlug,
          canonicalUrl,
        }));
      }
    }
  };

  const handleImageUpload = (file, preview) => {
    setFormData((prev) => {
      // Auto-populate OG and Twitter images ONLY if they are empty
      const updates = {
        featuredImage: preview,
      };

      // Only set if not manually uploaded
      if (!prev.ogImage) {
        updates.ogImage = preview;
      }
      if (!prev.twitterImage) {
        updates.twitterImage = preview;
      }

      return { ...prev, ...updates };
    });
  };

  // Generate content using AI
  const handleAIGenerateContent = async () => {
    try {
      if (!formData.title.trim()) {
        showError("Please enter a title first");
        return;
      }

      setAiGenerating(true);

      // Get category name for context
      const selectedCategory = categories.find(
        (cat) => cat.value === formData.category
      );
      const categoryName = selectedCategory?.label || "General";

      // Generate content and SEO data using AI
      const generatedData = await aiService.generateNewsContent({
        title: formData.title,
        category: categoryName,
      });

      // Update all generated fields in formData
      setFormData((prev) => ({
        ...prev,
        content: generatedData.content || prev.content,
        shortDescription:
          generatedData.shortDescription || prev.shortDescription,
        metaTitle: generatedData.metaTitle || prev.metaTitle,
        metaDescription: generatedData.metaDescription || prev.metaDescription,
        metaKeywords: generatedData.metaKeywords || prev.metaKeywords,
        focusKeyword: generatedData.focusKeyword || prev.focusKeyword,
        ogTitle: generatedData.ogTitle || prev.ogTitle,
        ogDescription: generatedData.ogDescription || prev.ogDescription,
        twitterTitle: generatedData.twitterTitle || prev.twitterTitle,
        twitterDescription:
          generatedData.twitterDescription || prev.twitterDescription,
      }));

      showSuccess(
        "Content and SEO data generated successfully! Review and edit as needed."
      );
    } catch (error) {
      console.error("AI Generation Error:", error);
      showError(error.message || "Failed to generate content using AI");
    } finally {
      setAiGenerating(false);
    }
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

    if (!formData.title.trim()) {
      showError("Please enter a news title");
      return;
    }

    if (!formData.slug.trim()) {
      showError("Please enter a URL slug");
      return;
    }

    if (!formData.shortDescription.trim()) {
      showError("Please enter a short description");
      return;
    }

    if (!formData.content.trim()) {
      showError("Please enter news content");
      return;
    }

    if (!formData.category) {
      showError("Please select a category");
      return;
    }

    // Prevent multiple submissions
    if (submitting) {
      return;
    }

    setSubmitting(true);

    try {
      // Convert metaKeywords string to array
      const metaKeywordsArray = formData.metaKeywords
        ? formData.metaKeywords
            .split(",")
            .map((kw) => kw.trim())
            .filter(Boolean)
        : [];

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

        const schema = {
          "@context": "https://schema.org",
          "@type": "NewsArticle",
          headline: formData.title,
          description: formData.shortDescription,
          image: getFullImageUrl(formData.featuredImage),
          datePublished: new Date().toISOString(),
          author: {
            "@type": "Person",
            name: "CCIC",
          },
          publisher: {
            "@type": "Organization",
            name: "CCIC",
            logo: {
              "@type": "ImageObject",
              url: `${window.location.origin}/mainLogo.png`,
            },
          },
          keywords: metaKeywordsArray.join(", "),
        };
        schemaMarkup = JSON.stringify(schema, null, 2);
      }

      // Prepare data for API
      const apiData = {
        title: formData.title.trim(),
        slug: formData.slug.trim(),
        shortDescription: formData.shortDescription.trim(),
        content: formData.content.trim(),
        category: formData.category,
        featuredImage: formData.featuredImage || null,
        tags: formData.tags,
        isFeatured: formData.isFeatured,
        status: formData.status,
        // SEO Fields
        metaTitle: formData.metaTitle || formData.title,
        metaDescription: formData.metaDescription || formData.shortDescription,
        metaKeywords: metaKeywordsArray,
        focusKeyword: formData.focusKeyword,
        canonicalUrl: formData.canonicalUrl,
        ogTitle: formData.ogTitle,
        ogDescription: formData.ogDescription,
        ogImage: formData.ogImage,
        twitterTitle: formData.twitterTitle,
        twitterDescription: formData.twitterDescription,
        twitterImage: formData.twitterImage,
        schemaMarkup,
      };

      console.log("📤 Final API data:", apiData);

      // Make API call to create news
      const response = await fetch("/api/news", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(apiData),
      });

      const result = await response.json();

      if (result.success) {
        showSuccess("News article added successfully!");

        // Reset form
        setFormData({
          ...initialFormState,
        });

        // Redirect after success
        setTimeout(() => {
          router.push("/admin/news");
        }, 2000);
      } else {
        showError(result.error || "Failed to add news article");
      }
    } catch (error) {
      console.error("Error adding news article:", error);
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

        <div className="bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800 rounded-lg p-5 shadow-sm transition-colors">
          {/* Title and Slug Row */}
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

          {/* Short Description Row */}
          <div className="mb-5">
            <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-32 mb-2 animate-pulse"></div>
            <div className="h-16 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
          </div>

          {/* Category and Status Row */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-20 mb-2 animate-pulse"></div>
              <div className="h-7 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
            </div>
            <div>
              <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-16 mb-2 animate-pulse"></div>
              <div className="h-7 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
            </div>
          </div>

          {/* Content Field */}
          <div className="mb-5">
            <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-20 mb-2 animate-pulse"></div>
            <div className="h-32 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
          </div>

          {/* Form Actions */}
          <div className="border-t border-gray-200 dark:border-slate-800 pt-4 flex justify-end gap-2">
            <div className="h-7 bg-gray-200 dark:bg-slate-800 rounded w-15 animate-pulse"></div>
            <div className="h-7 bg-gray-200 dark:bg-slate-800 rounded w-25 animate-pulse"></div>
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
    "flex shrink-0 self-end items-center gap-2 whitespace-nowrap px-4 py-2 bg-primary sm:self-auto text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary/30";
  const cardClass =
    "bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800 rounded-lg p-5 shadow-sm transition-colors";
  const labelClassName =
    "text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block transition-colors";
  const inputClassName =
    "w-full px-2 py-1.5 border border-gray-300 dark:border-slate-700 rounded text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary/30 bg-white dark:bg-slate-900/70 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/50 transition-colors";
  const textareaClassName = `${inputClassName} resize-none`;
  const helperTextClassName =
    "text-xs text-gray-500 dark:text-white/60 mt-1 transition-colors";
  const checkboxClassName =
    "w-4 h-4 text-primary bg-gray-100 dark:bg-slate-900/70 border-gray-300 dark:border-slate-700 rounded focus:ring-primary focus:ring-2 dark:focus:ring-primary/30";
  const checkboxLabelClass =
    "ml-2 text-xs text-gray-700 dark:text-white/80 transition-colors";
  const sectionHeadingClass =
    "text-lg font-semibold text-gray-900 dark:text-white mb-4 transition-colors";
  const infoTextClassName =
    "text-xs text-gray-500 dark:text-white/60 mt-1 transition-colors";
  const selectButtonClassName =
    "!w-full !justify-between !px-2 !py-1.5 !text-xs border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900/70 text-gray-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary/30";
  const selectDropdownClassName =
    "bg-white dark:bg-slate-900/90 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white";
  const selectOptionClassName =
    "hover:bg-primary-50 dark:hover:bg-primary/20 text-gray-900 dark:text-white";
  const actionLinkClass =
    "px-3 py-1.5 text-xs text-gray-700 dark:text-white/80 border border-gray-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900/70 no-underline hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors";
  const submitButtonClass =
    "px-3 py-1.5 text-xs text-white border-none rounded font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary/30";

  return (
    <div className={pageWrapperClass}>
      {/* Page Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-0.5">
          <Link href="/admin/news" className={headerLinkClass}>
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
            Back to News
          </Link>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className={headerTitleClass}>Add New News Article</h1>
            <p className={headerSubtitleClass}>
              Create a new news article for CCIC
            </p>
          </div>
          <button
            type="button"
            onClick={handleAIGenerateContent}
            disabled={!formData.title.trim() || aiGenerating}
            className={aiButtonClass}
          >
            <HiSparkles className="w-4 h-4" />
            {aiGenerating ? "Generating..." : "Generate Content with AI"}
          </button>
        </div>
      </div>

      {/* Form */}
      <div className={cardClass}>
        <form onSubmit={handleSubmit}>
          {/* Title and Slug */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            {/* Title */}
            <div>
              <label className={labelClassName}>News Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Enter news title"
                required
                className={inputClassName}
              />
            </div>

            {/* Slug */}
            <div>
              <label className={labelClassName}>URL Slug *</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => handleInputChange("slug", e.target.value)}
                placeholder="url-friendly-slug"
                required
                className={inputClassName}
              />
            </div>
          </div>

          {/* Short Description */}
          <div className="mb-5">
            <label className={labelClassName}>Short Description *</label>
            <textarea
              value={formData.shortDescription}
              onChange={(e) =>
                handleInputChange("shortDescription", e.target.value)
              }
              rows={3}
              placeholder="Brief description of the news article"
              maxLength={300}
              className={textareaClassName}
            />
            <p className={helperTextClassName}>
              {formData.shortDescription.length}/300 characters
            </p>
          </div>

          {/* Category and Status */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            {/* Category */}
            <div>
              <label className={labelClassName}>Category *</label>
              <ApnaSelect
                title=""
                options={categories.map((cat) => ({
                  value: cat._id,
                  label: cat.name,
                }))}
                value={formData.category}
                onChange={(value) => handleInputChange("category", value)}
                placeholder="Choose category"
                searchable={true}
                required={true}
              />
            </div>

            {/* Status */}
            <div>
              <label className={labelClassName}>Status</label>
              <ApnaSelect
                title=""
                options={[
                  { value: "draft", label: "Draft" },
                  { value: "published", label: "Published" },
                ]}
                value={formData.status}
                onChange={(value) => handleInputChange("status", value)}
                placeholder="Choose status"
                searchable={true}
                required={true}
              />
            </div>
          </div>

          {/* Content */}
          <div className="mb-5">
            <label className={labelClassName}>Content *</label>
            <ApnaEditor
              value={formData.content}
              onChange={(value) => handleInputChange("content", value)}
              placeholder="Write the news article content here..."
              className="min-h-[200px]"
              showToolbar={true}
            />
            <p className={helperTextClassName}>
              Use the toolbar above to format your content. You can add
              headings, lists, links, and images.
            </p>
          </div>

          {/* Featured Image */}
          <div className="border-b border-gray-200 dark:border-slate-800 pb-5 mb-5">
            <h2 className={sectionHeadingClass}>Featured Image</h2>
            <ImageUpload
              title="Upload Featured Image"
              type="single"
              accept="image/*"
              maxSize="5MB"
              width="100%"
              height="200px"
              preview={formData.featuredImage}
              onFileChange={handleImageUpload}
              onRemove={() =>
                setFormData((prev) => ({ ...prev, featuredImage: null }))
              }
              uploadType="news"
              identifier="featured-image"
              showUploadProgress={true}
            />
          </div>

          {/* Checkbox */}
          <div className="grid grid-cols-1 gap-4 mb-5">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isFeatured"
                checked={formData.isFeatured}
                onChange={(e) =>
                  handleInputChange("isFeatured", e.target.checked)
                }
                className={checkboxClassName}
              />
              <label htmlFor="isFeatured" className={checkboxLabelClass}>
                Featured article
              </label>
            </div>
          </div>

          {/* SEO Settings */}
          <div className="border-t border-gray-200 dark:border-slate-800 pt-6 mt-6">
            <h2 className={sectionHeadingClass}>SEO Settings</h2>

            <div className="space-y-4">
              {/* Basic SEO */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className={labelClassName}>
                    Meta Title (max 60 characters)
                  </label>
                  <input
                    type="text"
                    value={formData.metaTitle}
                    onChange={(e) =>
                      handleInputChange("metaTitle", e.target.value)
                    }
                    placeholder="Leave empty to use article title"
                    maxLength={60}
                    className={inputClassName}
                  />
                  <p className={helperTextClassName}>
                    {formData.metaTitle.length}/60 characters
                  </p>
                </div>

                <div>
                  <label className={labelClassName}>
                    Meta Description (max 160 characters)
                  </label>
                  <textarea
                    value={formData.metaDescription}
                    onChange={(e) =>
                      handleInputChange("metaDescription", e.target.value)
                    }
                    placeholder="Leave empty to use short description"
                    maxLength={160}
                    rows={2}
                    className={textareaClassName}
                  />
                  <p className={helperTextClassName}>
                    {formData.metaDescription.length}/160 characters
                  </p>
                </div>

                <div>
                  <label className={labelClassName}>
                    Meta Keywords (comma separated)
                  </label>
                  <input
                    type="text"
                    value={formData.metaKeywords}
                    onChange={(e) =>
                      handleInputChange("metaKeywords", e.target.value)
                    }
                    placeholder="e.g., study abroad, admissions, visa updates"
                    className={inputClassName}
                  />
                  <p className={helperTextClassName}>
                    Separate keywords with commas
                  </p>
                </div>

                <div>
                  <label className={labelClassName}>Focus Keyword</label>
                  <input
                    type="text"
                    value={formData.focusKeyword}
                    onChange={(e) =>
                      handleInputChange("focusKeyword", e.target.value)
                    }
                    placeholder="Main SEO keyword for this news"
                    maxLength={100}
                    className={inputClassName}
                  />
                </div>

                <div>
                  <label className={labelClassName}>
                    Canonical URL (Auto-generated)
                  </label>
                  <input
                    type="text"
                    value={formData.canonicalUrl}
                    readOnly
                    className={`${inputClassName} bg-gray-50 dark:bg-slate-900/40 text-gray-600 dark:text-white/60 cursor-not-allowed`}
                  />
                  <p className={helperTextClassName}>
                    Automatically generated from article slug
                  </p>
                </div>
              </div>

              {/* Open Graph */}
              <div className="border-t border-gray-200 dark:border-slate-800 pt-4 mt-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 transition-colors">
                  Open Graph / Social Media
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className={labelClassName}>
                      OG Title (max 60 characters)
                    </label>
                    <input
                      type="text"
                      value={formData.ogTitle}
                      onChange={(e) =>
                        handleInputChange("ogTitle", e.target.value)
                      }
                      placeholder="Leave empty to use meta title"
                      maxLength={60}
                      className={inputClassName}
                    />
                    <p className={helperTextClassName}>
                      {formData.ogTitle.length}/60 characters
                    </p>
                  </div>

                  <div>
                    <label className={labelClassName}>
                      OG Description (max 160 characters)
                    </label>
                    <textarea
                      value={formData.ogDescription}
                      onChange={(e) =>
                        handleInputChange("ogDescription", e.target.value)
                      }
                      placeholder="Leave empty to use meta description"
                      maxLength={160}
                      rows={2}
                      className={textareaClassName}
                    />
                    <p className={helperTextClassName}>
                      {formData.ogDescription.length}/160 characters
                    </p>
                  </div>

                  <div>
                    <ImageUpload
                      title="OG Image (Optional)"
                      type="single"
                      accept="image/*"
                      maxSize="2MB"
                      width="100%"
                      height="150px"
                      preview={formData.ogImage}
                      onFileChange={(file, preview) => {
                        setFormData((prev) => ({ ...prev, ogImage: preview }));
                      }}
                      onRemove={() => {
                        setFormData((prev) => ({ ...prev, ogImage: "" }));
                      }}
                      uploadType="news"
                      identifier="og-image"
                      showUploadProgress={true}
                    />
                    <p className={helperTextClassName}>
                      Leave empty to automatically use featured image for social
                      sharing
                    </p>
                  </div>
                </div>
              </div>

              {/* Twitter Card */}
              <div className="border-t border-gray-200 dark:border-slate-800 pt-4 mt-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 transition-colors">
                  Twitter Card
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className={labelClassName}>
                      Twitter Title (max 60 characters)
                    </label>
                    <input
                      type="text"
                      value={formData.twitterTitle}
                      onChange={(e) =>
                        handleInputChange("twitterTitle", e.target.value)
                      }
                      placeholder="Leave empty to use OG title"
                      maxLength={60}
                      className={inputClassName}
                    />
                    <p className={helperTextClassName}>
                      {formData.twitterTitle.length}/60 characters
                    </p>
                  </div>

                  <div>
                    <label className={labelClassName}>
                      Twitter Description (max 160 characters)
                    </label>
                    <textarea
                      value={formData.twitterDescription}
                      onChange={(e) =>
                        handleInputChange("twitterDescription", e.target.value)
                      }
                      placeholder="Leave empty to use OG description"
                      maxLength={160}
                      rows={2}
                      className={textareaClassName}
                    />
                    <p className={helperTextClassName}>
                      {formData.twitterDescription.length}/160 characters
                    </p>
                  </div>

                  <div>
                    <ImageUpload
                      title="Twitter Image (Optional)"
                      type="single"
                      accept="image/*"
                      maxSize="2MB"
                      width="100%"
                      height="150px"
                      preview={formData.twitterImage}
                      onFileChange={(file, preview) => {
                        setFormData((prev) => ({
                          ...prev,
                          twitterImage: preview,
                        }));
                      }}
                      onRemove={() => {
                        setFormData((prev) => ({ ...prev, twitterImage: "" }));
                      }}
                      uploadType="news"
                      identifier="twitter-image"
                      showUploadProgress={true}
                    />
                    <p className={helperTextClassName}>
                      Leave empty to automatically use featured image for
                      Twitter cards
                    </p>
                  </div>
                </div>
              </div>

              {/* Schema Markup */}
              <div className="border-t border-gray-200 dark:border-slate-800 pt-4 mt-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 transition-colors">
                  Structured Data (Auto-generated)
                </h3>
                <div>
                  <label className={labelClassName}>
                    Schema Markup (JSON-LD) - Optional Override
                  </label>
                  <textarea
                    value={formData.schemaMarkup}
                    onChange={(e) =>
                      handleInputChange("schemaMarkup", e.target.value)
                    }
                    placeholder="Leave empty for auto-generation. NewsArticle schema will be automatically created with title, description, keywords, etc."
                    rows={6}
                    className={`${textareaClassName} font-mono`}
                  />
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1 transition-colors">
                    ✓ Auto-generates NewsArticle schema if left empty. Only add
                    custom schema if you need to override.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2 border-t border-gray-200 dark:border-slate-800 pt-4 mt-6">
            <Link href="/admin/news" className={actionLinkClass}>
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className={`${submitButtonClass} ${
                submitting
                  ? "bg-gray-400 dark:bg-slate-700 cursor-not-allowed"
                  : "bg-primary hover:bg-primary-700 cursor-pointer"
              }`}
            >
              {submitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating Article...</span>
                </div>
              ) : (
                "Add News Article"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
