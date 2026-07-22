"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { HiArrowLeft, HiSparkles } from "react-icons/hi2";
import ImageUpload from "@/components/utils/ImageUpload";
import ApnaEditor from "@/components/utils/ApnaEditor";
import ApnaSelect from "@/components/utils/ApnaSelect";
import { showSuccess, showError } from "@/components/utils/ApnaNotify";
import { useAuth } from "@/contexts/AuthContext";
import { aiService } from "@/lib/services/aiService";

export default function AddBlog() {
  const router = useRouter();
  const { getAccessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    category: "",
    featuredImage: null,
    tags: "",
    isFeatured: false,
    readTime: 5,
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
  });

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/blog-categories?activeOnly=true");
        const data = await response.json();
        if (data.success) {
          setCategories(data.data);
          if (data.data.length > 0 && !formData.category) {
            setFormData((prev) => ({ ...prev, category: data.data[0]._id }));
          }
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Auto-generate slug from title
    if (name === "title") {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();

      // Auto-generate canonical URL from slug
      const canonicalUrl = slug
        ? `${window.location.origin}/blogs/${slug}`
        : "";

      setFormData((prev) => ({ ...prev, slug, canonicalUrl }));
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

  const handleImageRemove = () => {
    setFormData((prev) => ({ ...prev, featuredImage: null }));
  };

  const handleImageUploadSuccess = (uploadedFile) => {
    setFormData((prev) => ({ ...prev, featuredImage: uploadedFile.fileUrl }));
    showSuccess("Featured image uploaded successfully!");
  };

  const handleImageUploadError = (error) => {
    console.error("Upload error:", error);
    showError("Failed to upload image. Please try again.");
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
        (cat) => cat._id === formData.category
      );
      const categoryName = selectedCategory?.name || "General";

      // Generate content and SEO data using AI
      const generatedData = await aiService.generateBlogContent({
        title: formData.title,
        category: categoryName,
      });

      // Update all generated fields in formData
      setFormData({
        ...formData,
        content: generatedData.content || formData.content,
        excerpt: generatedData.excerpt || formData.excerpt,
        readTime: generatedData.readTime || formData.readTime,
        tags: generatedData.tags || formData.tags,
        metaTitle: generatedData.metaTitle || formData.metaTitle,
        metaDescription:
          generatedData.metaDescription || formData.metaDescription,
        metaKeywords: generatedData.metaKeywords || formData.metaKeywords,
        focusKeyword: generatedData.focusKeyword || formData.focusKeyword,
        ogTitle: generatedData.ogTitle || formData.ogTitle,
        ogDescription: generatedData.ogDescription || formData.ogDescription,
        twitterTitle: generatedData.twitterTitle || formData.twitterTitle,
        twitterDescription:
          generatedData.twitterDescription || formData.twitterDescription,
      });

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

    // Validation
    if (!formData.title.trim()) {
      showError("Blog title is required");
      return;
    }
    if (!formData.slug.trim()) {
      showError("Blog slug is required");
      return;
    }
    if (!formData.excerpt.trim()) {
      showError("Blog short description is required");
      return;
    }
    if (!formData.content.trim()) {
      showError("Blog content is required");
      return;
    }

    try {
      setLoading(true);

      const token = getAccessToken();
      if (!token) {
        showError("Authentication required. Please log in again.");
        return;
      }

      // Convert tags string to array
      const tagsArray = formData.tags
        ? formData.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
        : [];

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
          "@type": "Article",
          headline: formData.title,
          description: formData.excerpt,
          image: getFullImageUrl(formData.featuredImage),
          datePublished: new Date().toISOString(),
          author: {
            "@type": "Person",
            name: "VidyaVidhi",
          },
          publisher: {
            "@type": "Organization",
            name: "VidyaVidhi",
            logo: {
              "@type": "ImageObject",
              url: `${window.location.origin}/mainLogo.png`,
            },
          },
          keywords: metaKeywordsArray.join(", "),
        };
        schemaMarkup = JSON.stringify(schema, null, 2);
      }

      const blogData = {
        ...formData,
        tags: tagsArray,
        metaKeywords: metaKeywordsArray,
        schemaMarkup,
      };

      const response = await fetch("/api/blogs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(blogData),
      });

      const data = await response.json();

      if (data.success) {
        showSuccess("Blog created successfully!");
        router.push("/admin/blogs");
      } else {
        showError(data.error || "Failed to create blog");
      }
    } catch (error) {
      console.error("Error creating blog:", error);
      showError("Failed to create blog. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full p-3 sm:p-5 md:p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-0.5">
          <Link
            href="/admin/blogs"
            className="text-gray-600 dark:text-white/70 no-underline text-xs flex items-center gap-1 transition-colors hover:text-gray-800 dark:hover:text-white"
          >
            <HiArrowLeft className="w-3.5 h-3.5 text-gray-500 dark:text-white/60" />
            Back to Blogs
          </Link>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white transition-colors duration-300 mb-0.5">
              Add New Blog
            </h1>
            <p className="text-xs text-gray-600 dark:text-white/70 transition-colors duration-300">
              Create a new blog article
            </p>
          </div>
          <button
            type="button"
            onClick={handleAIGenerateContent}
            disabled={!formData.title.trim() || aiGenerating}
            className="inline-flex cursor-pointer items-center justify-center gap-1.5 px-3 sm:px-4 py-2 bg-linear-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap shrink-0"
          >
            <HiSparkles className="w-4 h-4" />
            {aiGenerating ? (
              "Generating..."
            ) : (
              <>
                <span className="sm:hidden">Generate with AI</span>
                <span className="hidden sm:inline">Generate Content with AI</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800 rounded-lg p-3 sm:p-5 shadow-sm transition-colors duration-300">
          {/* Basic Information */}
          <div className="border-b border-gray-200 dark:border-slate-800 pb-4 mb-4 transition-colors duration-300">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-300 mb-4">
              Basic Information
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block transition-colors duration-300">
                  Blog Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter blog title"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-50 bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors duration-300 placeholder:text-gray-400 dark:placeholder:text-white/40"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block transition-colors duration-300">
                  Slug *
                </label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  placeholder="auto-generated-slug"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-50 bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors duration-300 placeholder:text-gray-400 dark:placeholder:text-white/40"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block transition-colors duration-300">
                  Category *
                </label>
                <ApnaSelect
                  title=""
                  options={categories.map((cat) => ({
                    value: cat._id,
                    label: cat.name,
                  }))}
                  value={formData.category}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, category: value }))
                  }
                  placeholder="-- Select Category --"
                  searchable={true}
                  required={true}
                  buttonClassName="w-full px-3 py-2 rounded text-sm text-left flex items-center justify-between outline-none transition-all duration-200 border border-gray-300 dark:border-slate-700 focus:border-primary focus:ring-2 focus:ring-primary-50 bg-white dark:bg-slate-900 text-gray-900 dark:text-white cursor-pointer"
                />
              </div>

              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block transition-colors duration-300">
                  Short Description *
                </label>
                <textarea
                  name="excerpt"
                  value={formData.excerpt}
                  onChange={handleInputChange}
                  placeholder="Short description (max 300 characters)"
                  maxLength={300}
                  rows={2}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-50 resize-none bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors duration-300 placeholder:text-gray-400 dark:placeholder:text-white/40"
                />
                <p className="text-xs text-gray-500 dark:text-white/60 mt-1 transition-colors duration-300">
                  {formData.excerpt.length}/300 characters
                </p>
              </div>

              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block transition-colors duration-300">
                  Content *
                </label>
                <ApnaEditor
                  value={formData.content}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, content: value }))
                  }
                  placeholder="Write the blog article content here..."
                  className="min-h-[200px]"
                  showToolbar={true}
                />
                <p className="text-xs text-gray-500 dark:text-white/60 mt-1 transition-colors duration-300">
                  Use the toolbar above to format your content. You can add
                  headings, lists, links, and images.
                </p>
              </div>
            </div>
          </div>

          {/* Featured Image */}
          <div className="border-b border-gray-200 dark:border-slate-800 pb-4 mb-4 transition-colors duration-300">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-300 mb-4">
              Featured Image
            </h2>
            <ImageUpload
              title="Upload Featured Image"
              type="single"
              accept="image/*"
              maxSize="5MB"
              width="100%"
              height="200px"
              preview={formData.featuredImage}
              onFileChange={handleImageUpload}
              onRemove={handleImageRemove}
              uploadType="blog"
              identifier="featured-image"
              onUploadSuccess={handleImageUploadSuccess}
              onUploadError={handleImageUploadError}
              showUploadProgress={true}
            />
          </div>

          {/* Additional Settings */}
          <div className="border-b border-gray-200 dark:border-slate-800 pb-4 mb-4 transition-colors duration-300">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-300 mb-4">
              Additional Settings
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block transition-colors duration-300">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="MBBS, Education, Career"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-50 bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors duration-300 placeholder:text-gray-400 dark:placeholder:text-white/40"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block transition-colors duration-300">
                  Read Time (minutes)
                </label>
                <input
                  type="number"
                  name="readTime"
                  value={formData.readTime}
                  onChange={handleInputChange}
                  min="1"
                  max="60"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-50 bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors duration-300"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block transition-colors duration-300">
                  Status
                </label>
                <ApnaSelect
                  title=""
                  options={[
                    { value: "draft", label: "Draft" },
                    { value: "published", label: "Published" },
                    { value: "archived", label: "Archived" },
                  ]}
                  value={formData.status}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, status: value }))
                  }
                  placeholder="Select status"
                  searchable={false}
                  required={false}
                  buttonClassName="w-full px-3 py-2 rounded text-sm text-left flex items-center justify-between outline-none transition-all duration-200 border border-gray-300 dark:border-slate-700 focus:border-primary focus:ring-2 focus:ring-primary-50 bg-white dark:bg-slate-900 text-gray-900 dark:text-white cursor-pointer"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isFeatured"
                  id="isFeatured"
                  checked={formData.isFeatured}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-primary border-gray-300 dark:border-slate-700 rounded focus:ring-primary bg-white dark:bg-slate-900 transition-colors duration-300"
                />
                <label
                  htmlFor="isFeatured"
                  className="text-sm text-gray-700 dark:text-white/80 cursor-pointer transition-colors duration-300"
                >
                  Mark as Featured Blog
                </label>
              </div>
            </div>
          </div>

          {/* SEO Settings */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-300 mb-4">
              SEO Settings
            </h2>

            <div className="space-y-4">
              {/* Basic SEO */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block transition-colors duration-300">
                    Meta Title (max 60 characters)
                  </label>
                  <input
                    type="text"
                    name="metaTitle"
                    value={formData.metaTitle}
                    onChange={handleInputChange}
                    placeholder="Leave empty to use blog title"
                    maxLength={60}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-50 bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors duration-300 placeholder:text-gray-400 dark:placeholder:text-white/40"
                  />
                  <p className="text-xs text-gray-500 dark:text-white/60 mt-1 transition-colors duration-300">
                    {formData.metaTitle.length}/60 characters
                  </p>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block transition-colors duration-300">
                    Meta Description (max 160 characters)
                  </label>
                  <textarea
                    name="metaDescription"
                    value={formData.metaDescription}
                    onChange={handleInputChange}
                    placeholder="Leave empty to use excerpt"
                    maxLength={160}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-50 resize-none bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors duration-300 placeholder:text-gray-400 dark:placeholder:text-white/40"
                  />
                  <p className="text-xs text-gray-500 dark:text-white/60 mt-1 transition-colors duration-300">
                    {formData.metaDescription.length}/160 characters
                  </p>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block transition-colors duration-300">
                    Meta Keywords (comma separated)
                  </label>
                  <input
                    type="text"
                    name="metaKeywords"
                    value={formData.metaKeywords}
                    onChange={handleInputChange}
                    placeholder="e.g., ayurveda, mbbs, medical education"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-50 bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors duration-300 placeholder:text-gray-400 dark:placeholder:text-white/40"
                  />
                  <p className="text-xs text-gray-500 dark:text-white/60 mt-1 transition-colors duration-300">
                    Separate keywords with commas
                  </p>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block transition-colors duration-300">
                    Focus Keyword
                  </label>
                  <input
                    type="text"
                    name="focusKeyword"
                    value={formData.focusKeyword}
                    onChange={handleInputChange}
                    placeholder="Main SEO keyword for this blog"
                    maxLength={100}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-50 bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors duration-300 placeholder:text-gray-400 dark:placeholder:text-white/40"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block transition-colors duration-300">
                    Canonical URL (Auto-generated)
                  </label>
                  <input
                    type="text"
                    name="canonicalUrl"
                    value={formData.canonicalUrl}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded text-sm bg-gray-50 dark:bg-slate-900/50 text-gray-900 dark:text-white cursor-not-allowed transition-colors duration-300"
                  />
                  <p className="text-xs text-gray-500 dark:text-white/60 mt-1 transition-colors duration-300">
                    Automatically generated from blog slug
                  </p>
                </div>
              </div>

              {/* Open Graph (Facebook, LinkedIn) */}
              <div className="border-t border-gray-200 dark:border-slate-800 pt-4 mt-4 transition-colors duration-300">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white transition-colors duration-300 mb-3">
                  Open Graph / Social Media
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block transition-colors duration-300">
                      OG Title (max 60 characters)
                    </label>
                    <input
                      type="text"
                      name="ogTitle"
                      value={formData.ogTitle}
                      onChange={handleInputChange}
                      placeholder="Leave empty to use meta title"
                      maxLength={60}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-50 bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors duration-300 placeholder:text-gray-400 dark:placeholder:text-white/40"
                    />
                    <p className="text-xs text-gray-500 dark:text-white/60 mt-1 transition-colors duration-300">
                      {formData.ogTitle.length}/60 characters
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block transition-colors duration-300">
                      OG Description (max 160 characters)
                    </label>
                    <textarea
                      name="ogDescription"
                      value={formData.ogDescription}
                      onChange={handleInputChange}
                      placeholder="Leave empty to use meta description"
                      maxLength={160}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-50 resize-none bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors duration-300 placeholder:text-gray-400 dark:placeholder:text-white/40"
                    />
                    <p className="text-xs text-gray-500 dark:text-white/60 mt-1 transition-colors duration-300">
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
                      uploadType="blog"
                      identifier="og-image"
                      showUploadProgress={true}
                    />
                    <p className="text-xs text-gray-500 dark:text-white/60 mt-1 transition-colors duration-300">
                      Leave empty to automatically use featured image for social
                      sharing
                    </p>
                  </div>
                </div>
              </div>

              {/* Twitter Card */}
              <div className="border-t border-gray-200 dark:border-slate-800 pt-4 mt-4 transition-colors duration-300">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white transition-colors duration-300 mb-3">
                  Twitter Card
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block transition-colors duration-300">
                      Twitter Title (max 60 characters)
                    </label>
                    <input
                      type="text"
                      name="twitterTitle"
                      value={formData.twitterTitle}
                      onChange={handleInputChange}
                      placeholder="Leave empty to use OG title"
                      maxLength={60}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-50 bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors duration-300 placeholder:text-gray-400 dark:placeholder:text-white/40"
                    />
                    <p className="text-xs text-gray-500 dark:text-white/60 mt-1 transition-colors duration-300">
                      {formData.twitterTitle.length}/60 characters
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block transition-colors duration-300">
                      Twitter Description (max 160 characters)
                    </label>
                    <textarea
                      name="twitterDescription"
                      value={formData.twitterDescription}
                      onChange={handleInputChange}
                      placeholder="Leave empty to use OG description"
                      maxLength={160}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-50 resize-none bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors duration-300 placeholder:text-gray-400 dark:placeholder:text-white/40"
                    />
                    <p className="text-xs text-gray-500 dark:text-white/60 mt-1 transition-colors duration-300">
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
                      uploadType="blog"
                      identifier="twitter-image"
                      showUploadProgress={true}
                    />
                    <p className="text-xs text-gray-500 dark:text-white/60 mt-1 transition-colors duration-300">
                      Leave empty to automatically use featured image for
                      Twitter cards
                    </p>
                  </div>
                </div>
              </div>

              {/* Schema Markup */}
              <div className="border-t border-gray-200 dark:border-slate-800 pt-4 mt-4 transition-colors duration-300">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white transition-colors duration-300 mb-3">
                  Structured Data (Auto-generated)
                </h3>
                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block transition-colors duration-300">
                    Schema Markup (JSON-LD) - Optional Override
                  </label>
                  <textarea
                    name="schemaMarkup"
                    value={formData.schemaMarkup}
                    onChange={handleInputChange}
                    placeholder="Leave empty for auto-generation. Article schema will be automatically created with title, description, keywords, etc."
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-50 resize-none font-mono bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors duration-300"
                  />
                  <p className="text-xs text-green-600 dark:text-green-300 mt-1 transition-colors duration-300">
                    ✓ Auto-generates Article schema if left empty. Only add
                    custom schema if you need to override.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-3">
          <Link
            href="/admin/blogs"
            className="px-4 py-2 text-sm text-gray-700 dark:text-white/80 border border-gray-300 dark:border-slate-700 rounded hover:bg-gray-50 dark:hover:bg-slate-900/60 transition-colors no-underline"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm bg-primary text-white rounded hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            {loading ? "Creating..." : "Create Blog"}
          </button>
        </div>
      </form>
    </div>
  );
}
