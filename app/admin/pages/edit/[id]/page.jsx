"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import apiClient from "@/lib/api/axios";
import { showSuccess, showError } from "@/components/utils/ApnaNotify";
import ApnaEditor from "@/components/utils/ApnaEditor";
import ApnaSelect from "@/components/utils/ApnaSelect";
import ApnaModal from "@/components/utils/ApnaModal";
import ImageUpload from "@/components/utils/ImageUpload";
import {
  HiPlus,
  HiTrash,
  HiArrowUp,
  HiArrowDown,
  HiSparkles,
} from "react-icons/hi";
import { MdDragIndicator } from "react-icons/md";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { aiService } from "@/lib/services/aiService";

// Sortable Section Item Component
const SortableSection = ({
  section,
  index,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  totalSections,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border border-gray-200 dark:border-slate-800 rounded p-3 bg-gray-50 dark:bg-slate-900/60 transition-colors"
    >
      <div className="flex items-start gap-2">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:text-white/50 dark:hover:text-white/70 transition-colors pt-1"
        >
          <MdDragIndicator className="w-5 h-5" />
        </div>

        {/* Content */}
        <div className="flex-1">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white transition-colors">
            {section.title}
          </h4>
          <div
            className="text-xs text-gray-600 dark:text-white/70 mt-1 line-clamp-1 transition-colors"
            dangerouslySetInnerHTML={{
              __html: section.content.substring(0, 100) + "...",
            }}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            className="p-1 text-gray-400 hover:text-gray-600 dark:text-white/50 dark:hover:text-white/70 disabled:opacity-30 transition-colors"
            title="Move Up"
          >
            <HiArrowUp className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === totalSections - 1}
            className="p-1 text-gray-400 hover:text-gray-600 dark:text-white/50 dark:hover:text-white/70 disabled:opacity-30 transition-colors"
            title="Move Down"
          >
            <HiArrowDown className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="px-2 py-1 text-xs text-primary border border-primary rounded hover:bg-primary-50 dark:hover:bg-primary/20 transition-colors"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
            title="Delete"
          >
            <HiTrash className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const EditPage = ({ params }) => {
  const resolvedParams = use(params);
  const { requireAdmin } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    category: "",
    heading: "",
    coverImage: "",
    videoUrl: "",
    shortDescription: "",
    longDescription: "",
    sections: [],
    status: "draft",
    displayOrder: 0,
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
  const [showSectionEditor, setShowSectionEditor] = useState(false);
  const [currentSection, setCurrentSection] = useState({
    title: "",
    content: "",
    displayOrder: 0,
  });
  const [editingSectionIndex, setEditingSectionIndex] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
  const sectionPlaceholderClass =
    "text-xs text-gray-500 dark:text-white/60 text-center py-4 border border-dashed border-gray-300 dark:border-slate-700 rounded transition-colors";
  const summaryClassName =
    "px-3 py-2 bg-gray-50 dark:bg-slate-900/60 cursor-pointer text-sm font-medium text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors";
  const modalLabelClass =
    "text-sm font-medium text-gray-700 dark:text-white/80 mb-2 block transition-colors";
  const modalInputClass =
    "w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary/30 bg-white dark:bg-slate-900/70 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/50 transition-colors";
  const selectButtonClassName =
    "w-full px-2 py-1.5 rounded border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900/70 text-xs text-left text-gray-900 dark:text-white flex items-center justify-between outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary/30";
  const selectDropdownClassName =
    "bg-white dark:bg-slate-900/90 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white";
  const selectOptionClassName =
    "hover:bg-primary-50 dark:hover:bg-primary/20 text-gray-900 dark:text-white";
  const actionLinkClass =
    "px-3 py-1.5 text-xs text-gray-700 dark:text-white/80 border border-gray-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900/70 no-underline hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors";
  const submitButtonClass =
    "px-4 py-1.5 text-xs text-white bg-primary hover:bg-primary-700 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary/30";

  useEffect(() => {
    requireAdmin();
  }, [requireAdmin]);

  useEffect(() => {
    fetchPage();
  }, [resolvedParams.id]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(
          "/api/page-categories?limit=100&status=active"
        );
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

  // Extract video ID and generate preview
  useEffect(() => {
    if (formData.videoUrl) {
      const extractVideoId = (url) => {
        const youtubePatterns = [
          /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
          /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
        ];
        const vimeoPattern = /vimeo\.com\/(\d+)/;

        for (const pattern of youtubePatterns) {
          const match = url.match(pattern);
          if (match) {
            return {
              id: match[1],
              type: "youtube",
              embedUrl: `https://www.youtube.com/embed/${match[1]}`,
            };
          }
        }

        const vimeoMatch = url.match(vimeoPattern);
        if (vimeoMatch) {
          return {
            id: vimeoMatch[1],
            type: "vimeo",
            embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
          };
        }

        return null;
      };

      const videoInfo = extractVideoId(formData.videoUrl);
      setVideoPreview(videoInfo);
    } else {
      setVideoPreview(null);
    }
  }, [formData.videoUrl]);

  const fetchPage = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/api/pages/${resolvedParams.id}`);

      if (response.data.success) {
        const pageData = response.data.data;

        // Ensure all sections have unique IDs for drag-drop
        if (pageData.sections && Array.isArray(pageData.sections)) {
          pageData.sections = pageData.sections.map((section, i) => ({
            ...section,
            id: section._id || section.id || `temp-${Date.now()}-${i}`,
          }));
        }

        // Convert category object to ID string for dropdown
        if (pageData.category && typeof pageData.category === "object") {
          pageData.category = pageData.category._id || pageData.category.id;
        }

        setFormData(pageData);
      }
    } catch (error) {
      console.error("Error fetching page:", error);
      showError("Failed to fetch page");
      router.push("/admin/pages");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // AI Generate Content
  const handleAIGenerateContent = async () => {
    try {
      if (!formData.title.trim()) {
        showError("Please enter a title first");
        return;
      }

      setAiGenerating(true);

      const result = await aiService.generatePageContent({
        title: formData.title,
        heading: formData.heading,
      });

      setFormData((prev) => ({
        ...prev,
        shortDescription: result.shortDescription || prev.shortDescription,
        longDescription: result.longDescription || prev.longDescription,
        metaTitle: result.metaTitle || prev.metaTitle,
        metaDescription: result.metaDescription || prev.metaDescription,
        metaKeywords: result.metaKeywords || prev.metaKeywords,
        focusKeyword: result.focusKeyword || prev.focusKeyword,
        ogTitle: result.ogTitle || prev.ogTitle,
        ogDescription: result.ogDescription || prev.ogDescription,
        twitterTitle: result.twitterTitle || prev.twitterTitle,
        twitterDescription:
          result.twitterDescription || prev.twitterDescription,
      }));

      showSuccess("Content generated successfully!");
    } catch (error) {
      console.error("AI Generation Error:", error);
      showError(error.message || "Failed to generate content");
    } finally {
      setAiGenerating(false);
    }
  };

  const handleAddSection = () => {
    setCurrentSection({
      id: `temp-${Date.now()}-${Math.random()}`, // Unique ID for drag-drop
      title: "",
      content: "",
      displayOrder: formData.sections?.length || 0,
    });
    setEditingSectionIndex(null);
    setShowSectionEditor(true);
  };

  const handleEditSection = (index) => {
    setCurrentSection(formData.sections[index]);
    setEditingSectionIndex(index);
    setShowSectionEditor(true);
  };

  const handleSaveSection = () => {
    if (!currentSection.title || !currentSection.content) {
      showError("Section title and content are required");
      return;
    }

    if (editingSectionIndex !== null) {
      const updatedSections = [...formData.sections];
      updatedSections[editingSectionIndex] = {
        ...currentSection,
        // Preserve existing ID if editing
        id:
          formData.sections[editingSectionIndex].id ||
          formData.sections[editingSectionIndex]._id ||
          currentSection.id,
      };
      setFormData((prev) => ({ ...prev, sections: updatedSections }));
    } else {
      // Add new section with unique ID
      setFormData((prev) => ({
        ...prev,
        sections: [
          ...prev.sections,
          {
            ...currentSection,
            id: currentSection.id || `temp-${Date.now()}-${Math.random()}`,
          },
        ],
      }));
    }

    setShowSectionEditor(false);
    setCurrentSection({ title: "", content: "", displayOrder: 0 });
    setEditingSectionIndex(null);
  };

  const handleDeleteSection = (index) => {
    const updatedSections = formData.sections.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, sections: updatedSections }));
  };

  const handleMoveSectionUp = (index) => {
    if (index === 0) return;
    const updatedSections = [...formData.sections];
    [updatedSections[index - 1], updatedSections[index]] = [
      updatedSections[index],
      updatedSections[index - 1],
    ];
    updatedSections.forEach((section, i) => {
      section.displayOrder = i;
    });
    setFormData((prev) => ({ ...prev, sections: updatedSections }));
  };

  const handleMoveSectionDown = (index) => {
    if (index === formData.sections?.length - 1) return;
    const updatedSections = [...formData.sections];
    [updatedSections[index], updatedSections[index + 1]] = [
      updatedSections[index + 1],
      updatedSections[index],
    ];
    updatedSections.forEach((section, i) => {
      section.displayOrder = i;
    });
    setFormData((prev) => ({ ...prev, sections: updatedSections }));
  };

  // Handle drag end
  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setFormData((prev) => {
        const oldIndex = prev.sections.findIndex(
          (s) => (s.id || s._id) === active.id
        );
        const newIndex = prev.sections.findIndex(
          (s) => (s.id || s._id) === over.id
        );

        if (oldIndex === -1 || newIndex === -1) return prev;

        const updatedSections = arrayMove(prev.sections, oldIndex, newIndex);
        // Update display order
        updatedSections.forEach((section, i) => {
          section.displayOrder = i;
        });

        return { ...prev, sections: updatedSections };
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      showError("Title is required");
      return;
    }

    if (!formData.slug.trim()) {
      showError("Slug is required");
      return;
    }

    if (!formData.category || formData.category.trim() === "") {
      showError("Please select a category");
      return;
    }

    if (submitting) return;

    try {
      setSubmitting(true);

      const response = await apiClient.put(
        `/api/pages/${resolvedParams.id}`,
        formData
      );

      if (response.data.success) {
        showSuccess("Page updated successfully!");
        setTimeout(() => {
          router.push("/admin/pages");
        }, 1500);
      }
    } catch (error) {
      console.error("Error updating page:", error);
      showError(error.response?.data?.error || "Failed to update page");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
        <div className="mb-4">
          <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-30 mb-2 animate-pulse"></div>
          <div className="h-6 bg-gray-200 dark:bg-slate-800 rounded w-44 mb-1 animate-pulse"></div>
          <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-70 animate-pulse"></div>
        </div>
        <div className="bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800 rounded-lg p-5 shadow-sm transition-colors">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i}>
                <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-24 mb-2 animate-pulse"></div>
                <div className="h-7 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={pageWrapperClass}>
      {/* Page Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-0.5">
          <Link href="/admin/pages" className={headerLinkClass}>
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
            Back to Pages
          </Link>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className={headerTitleClass}>Edit Page</h1>
            <p className={headerSubtitleClass}>
              Update page details for CCIC website
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
            <div>
              <label className={labelClassName}>Page Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="e.g., Study Abroad Guidance and Counselling"
                required
                className={inputClassName}
              />
            </div>

            <div>
              <label className={labelClassName}>URL Slug *</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => handleInputChange("slug", e.target.value)}
                placeholder="study-abroad-guidance"
                required
                className={inputClassName}
              />
              <p className={helperTextClassName}>
                URL: /page/{formData.slug || "your-slug"}
              </p>
            </div>
          </div>

          {/* Category and Heading */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className={labelClassName}>Category *</label>
              <ApnaSelect
                title=""
                options={categories.map((cat) => ({
                  value: cat._id,
                  label: cat.name,
                }))}
                value={formData.category || ""}
                onChange={(value) => handleInputChange("category", value)}
                placeholder="Select Category"
                searchable={true}
                required={true}
                buttonClassName={`${inputClassName} flex items-center justify-between text-left cursor-pointer`}
              />
            </div>

            <div>
              <label className={labelClassName}>Heading</label>
              <input
                type="text"
                value={formData.heading}
                onChange={(e) => handleInputChange("heading", e.target.value)}
                placeholder="Optional subtitle or heading"
                className={inputClassName}
              />
            </div>
          </div>

          {/* Cover Image */}
          <div className="mb-5">
            <label className={labelClassName}>Cover Image</label>
            <ImageUpload
              title=""
              type="image"
              preview={formData.coverImage}
              onFileChange={(file, preview) => {
                setFormData((prev) => ({
                  ...prev,
                  coverImage: preview,
                  ...(!prev.ogImage && { ogImage: preview }),
                  ...(!prev.twitterImage && { twitterImage: preview }),
                }));
              }}
              onRemove={() =>
                setFormData((prev) => ({ ...prev, coverImage: null }))
              }
              uploadType="page"
              identifier="cover"
            />
          </div>

          {/* Video URL */}
          <div className="mb-5">
            <label className={labelClassName}>Video URL (YouTube/Vimeo)</label>
            <input
              type="url"
              value={formData.videoUrl}
              onChange={(e) => handleInputChange("videoUrl", e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className={inputClassName}
            />
            {videoPreview && (
              <div className="mt-2">
                <p className={helperTextClassName}>
                  Preview ({videoPreview.type})
                </p>
                <div
                  className="relative w-full"
                  style={{ paddingTop: "56.25%" }}
                >
                  <iframe
                    src={videoPreview.embedUrl}
                    className="absolute top-0 left-0 w-full h-full rounded border border-gray-300 dark:border-slate-700"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            )}
          </div>

          {/* Short Description */}
          <div className="mb-5">
            <label className={labelClassName}>
              Short Description (Max 500 characters)
            </label>
            <textarea
              value={formData.shortDescription}
              onChange={(e) =>
                handleInputChange("shortDescription", e.target.value)
              }
              rows={3}
              placeholder="Enter a brief summary of the page content. This will appear in search results and page previews."
              maxLength={500}
              className={textareaClassName}
            />
            <p className={helperTextClassName}>
              {formData.shortDescription?.length || 0}/500 characters
            </p>
          </div>

          {/* Status and Display Order */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className={labelClassName}>Status</label>
              <ApnaSelect
                title=""
                options={[
                  { value: "draft", label: "Draft" },
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                ]}
                value={formData.status}
                onChange={(value) => handleInputChange("status", value)}
                placeholder="Choose status"
                searchable={false}
                required={true}
                buttonClassName={selectButtonClassName}
                dropdownClassName={selectDropdownClassName}
                optionClassName={selectOptionClassName}
              />
            </div>

            <div>
              <label className={labelClassName}>Display Order</label>
              <input
                type="number"
                value={formData.displayOrder}
                onChange={(e) =>
                  handleInputChange("displayOrder", e.target.value)
                }
                className={inputClassName}
              />
            </div>
          </div>

          {/* Long Description */}
          <div className="mb-5">
            <label className={labelClassName}>Long Description</label>
            <ApnaEditor
              value={formData.longDescription}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, longDescription: value }))
              }
            />
          </div>

          {/* Dynamic Sections */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <label className={labelClassName}>Page Sections</label>
              <button
                type="button"
                onClick={handleAddSection}
                className="flex items-center gap-1 px-2 py-1 bg-primary hover:bg-primary-700 text-white rounded text-xs font-medium transition-colors"
              >
                <HiPlus className="w-3.5 h-3.5" />
                Add Section
              </button>
            </div>

            {formData.sections?.length === 0 ? (
              <p className={sectionPlaceholderClass}>
                No sections added yet. Drag to reorder.
              </p>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={formData.sections?.map((s) => s.id || s._id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {formData.sections?.map((section, index) => (
                      <SortableSection
                        key={section.id || section._id}
                        section={{
                          ...section,
                          id: section.id || section._id,
                        }}
                        index={index}
                        totalSections={formData.sections.length}
                        onEdit={() => handleEditSection(index)}
                        onDelete={() => handleDeleteSection(index)}
                        onMoveUp={() => handleMoveSectionUp(index)}
                        onMoveDown={() => handleMoveSectionDown(index)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>

          {/* SEO Section - Collapsible */}
          <details className="mb-5 border border-gray-300 dark:border-slate-800 rounded-lg transition-colors">
            <summary className={summaryClassName}>SEO Settings</summary>
            <div className="p-4 space-y-4">
              {/* Basic SEO */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClassName}>
                    Meta Title (Max 60 chars)
                  </label>
                  <input
                    type="text"
                    value={formData.metaTitle}
                    onChange={(e) =>
                      handleInputChange("metaTitle", e.target.value)
                    }
                    maxLength={60}
                    placeholder="Study Abroad Guidance | Complete Guide"
                    className={inputClassName}
                  />
                  <p className={helperTextClassName}>
                    {formData.metaTitle?.length || 0}/60
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
                    maxLength={100}
                    placeholder="Study Abroad Guidance"
                    className={inputClassName}
                  />
                </div>
              </div>

              <div>
                <label className={labelClassName}>
                  Meta Description (Max 160 chars)
                </label>
                <textarea
                  value={formData.metaDescription}
                  onChange={(e) =>
                    handleInputChange("metaDescription", e.target.value)
                  }
                  rows={2}
                  maxLength={160}
                  placeholder="Explore universities, courses, admission processes, eligibility criteria and study abroad opportunities."
                  className={textareaClassName}
                />
                <p className={helperTextClassName}>
                  {formData.metaDescription?.length || 0}/160
                </p>
              </div>

              <div>
                <label className={labelClassName}>
                  Meta Keywords (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.metaKeywords}
                  onChange={(e) =>
                    handleInputChange("metaKeywords", e.target.value)
                  }
                  placeholder="study abroad, admissions, counselling"
                  className={inputClassName}
                />
              </div>

              <div>
                <label className={labelClassName}>Canonical URL</label>
                <input
                  type="url"
                  value={formData.canonicalUrl}
                  onChange={(e) =>
                    handleInputChange("canonicalUrl", e.target.value)
                  }
                  placeholder="https://example.com/page/your-slug"
                  className={inputClassName}
                />
              </div>

              {/* Open Graph */}
              <div className="border-t border-gray-200 dark:border-slate-800 pt-3 transition-colors">
                <h3 className="text-xs font-semibold text-gray-800 dark:text-white/80 mb-3 transition-colors">
                  Open Graph (Facebook, LinkedIn)
                </h3>

                <div className="mb-3">
                  <label className={labelClassName}>
                    OG Title (Max 60 chars)
                  </label>
                  <input
                    type="text"
                    value={formData.ogTitle}
                    onChange={(e) =>
                      handleInputChange("ogTitle", e.target.value)
                    }
                    maxLength={60}
                    placeholder="Study Abroad Guide | Universities & Admission"
                    className={inputClassName}
                  />
                  <p className={helperTextClassName}>
                    {formData.ogTitle?.length || 0}/60
                  </p>
                </div>

                <div className="mb-3">
                  <label className={labelClassName}>
                    OG Description (Max 160 chars)
                  </label>
                  <textarea
                    value={formData.ogDescription}
                    onChange={(e) =>
                      handleInputChange("ogDescription", e.target.value)
                    }
                    rows={2}
                    maxLength={160}
                    placeholder="Discover universities, courses, admission requirements and study abroad opportunities."
                    className={textareaClassName}
                  />
                  <p className={helperTextClassName}>
                    {formData.ogDescription?.length || 0}/160
                  </p>
                </div>

                <div>
                  <label className={labelClassName}>OG Image</label>
                  <ImageUpload
                    title=""
                    type="image"
                    preview={formData.ogImage}
                    onFileChange={(file, preview) =>
                      setFormData((prev) => ({ ...prev, ogImage: preview }))
                    }
                    onRemove={() =>
                      setFormData((prev) => ({ ...prev, ogImage: null }))
                    }
                    uploadType="page"
                    identifier="og"
                  />
                </div>
              </div>

              {/* Twitter Card */}
              <div className="border-t border-gray-200 dark:border-slate-800 pt-3 transition-colors">
                <h3 className="text-xs font-semibold text-gray-800 dark:text-white/80 mb-3 transition-colors">
                  Twitter Card
                </h3>

                <div className="mb-3">
                  <label className={labelClassName}>
                    Twitter Title (Max 60 chars)
                  </label>
                  <input
                    type="text"
                    value={formData.twitterTitle}
                    onChange={(e) =>
                      handleInputChange("twitterTitle", e.target.value)
                    }
                    maxLength={60}
                    placeholder="Study Abroad Guide | Universities & Admission"
                    className={inputClassName}
                  />
                  <p className={helperTextClassName}>
                    {formData.twitterTitle?.length || 0}/60
                  </p>
                </div>

                <div className="mb-3">
                  <label className={labelClassName}>
                    Twitter Description (Max 160 chars)
                  </label>
                  <textarea
                    value={formData.twitterDescription}
                    onChange={(e) =>
                      handleInputChange("twitterDescription", e.target.value)
                    }
                    rows={2}
                    maxLength={160}
                    placeholder="Discover universities, courses, admission requirements and study abroad opportunities."
                    className={textareaClassName}
                  />
                  <p className={helperTextClassName}>
                    {formData.twitterDescription?.length || 0}/160
                  </p>
                </div>

                <div>
                  <label className={labelClassName}>Twitter Image</label>
                  <ImageUpload
                    title=""
                    type="image"
                    preview={formData.twitterImage}
                    onFileChange={(file, preview) =>
                      setFormData((prev) => ({
                        ...prev,
                        twitterImage: preview,
                      }))
                    }
                    onRemove={() =>
                      setFormData((prev) => ({ ...prev, twitterImage: null }))
                    }
                    uploadType="page"
                    identifier="twitter"
                  />
                </div>
              </div>
            </div>
          </details>

          {/* Form Actions */}
          <div className="border-t border-gray-200 dark:border-slate-800 pt-4 flex justify-end gap-2">
            <Link href="/admin/pages" className={actionLinkClass}>
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className={submitButtonClass}
            >
              {submitting ? "Updating..." : "Update Page"}
            </button>
          </div>
        </form>
      </div>

      {/* Section Editor Modal */}
      <ApnaModal
        isOpen={showSectionEditor}
        onClose={() => setShowSectionEditor(false)}
        onSubmit={handleSaveSection}
        title={`${editingSectionIndex !== null ? "Edit" : "Add"} Section`}
        size="xl"
        submitText="Save Section"
        cancelText="Cancel"
      >
        <div className="space-y-4">
          <div>
            <label className={modalLabelClass}>Section Title *</label>
            <input
              type="text"
              value={currentSection.title}
              onChange={(e) =>
                setCurrentSection((prev) => ({
                  ...prev,
                  title: e.target.value,
                }))
              }
              placeholder="e.g., Admission Process, Eligibility Criteria, Career Opportunities"
              className={modalInputClass}
            />
          </div>

          <div>
            <label className={modalLabelClass}>Section Content *</label>
            <ApnaEditor
              value={currentSection.content}
              onChange={(value) =>
                setCurrentSection((prev) => ({ ...prev, content: value }))
              }
            />
          </div>
        </div>
      </ApnaModal>
    </div>
  );
};

export default EditPage;
