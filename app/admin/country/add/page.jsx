"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ApnaEditor from "@/components/utils/ApnaEditor";
import ImageUpload from "@/components/utils/ImageUpload";
import ApnaSelect from "@/components/utils/ApnaSelect";
import { useAuth } from "@/contexts/AuthContext";
import { showSuccess, showError } from "@/components/utils/ApnaNotify";

export default function AddCountryPage() {
  const router = useRouter();
  const { getAccessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [countryMasterOptions, setCountryMasterOptions] = useState([]);
  const [currencyOptions, setCurrencyOptions] = useState([]);
  const [newFaq, setNewFaq] = useState({ question: "", answer: "" });
  const [newSection, setNewSection] = useState({ title: "", content: "" });
  const [editingSectionIndex, setEditingSectionIndex] = useState(null);
  const [editingSection, setEditingSection] = useState({ title: "", content: "" });
  const [newQuickFact, setNewQuickFact] = useState({ label: "", value: "" });

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

  useEffect(() => {
    const loadCurrencies = async () => {
      try {
        const token = getAccessToken();
        const response = await fetch("/api/currencies?status=active&limit=200", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await response.json();
        if (result.success) {
          setCurrencyOptions(
            result.data.map((currency) => ({
              value: currency._id,
              label: `${currency.code} - ${currency.name}${currency.symbol ? ` (${currency.symbol})` : ""}`,
            })),
          );
        }
      } catch (error) {
        console.error("Error loading currencies:", error);
      }
    };

    loadCurrencies();
  }, [getAccessToken]);

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

    // Media
    logo: null,
    banner: null,
    brochure: null,
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

    faqs: [],
    sections: [],
    quickFacts: [],
    documentsRequired: "",

    status: "active",
    isFeatured: false,
    isPopular: false,
    verified: false,
    displayOrder: 0,
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAddSection = () => {
    const title = newSection.title.trim();
    const content = newSection.content?.trim() || "";

    if (!title || !content) {
      showError("Section title and content are required");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      sections: [
        ...prev.sections,
        {
          title,
          tabName: "Overview",
          content,
          displayOrder: prev.sections.length,
          status: "active",
        },
      ],
    }));
    setNewSection({ title: "", content: "" });
  };

  const handleEditSection = (index) => {
    const section = formData.sections[index];
    setEditingSectionIndex(index);
    setEditingSection({
      title: section?.title || "",
      content: section?.content || "",
    });
  };

  const handleSaveSection = (index) => {
    const title = editingSection.title.trim();
    const content = editingSection.content?.trim() || "";

    if (!title || !content) {
      showError("Section title and content are required");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.map((section, itemIndex) =>
        itemIndex === index
          ? {
              ...section,
              title,
              tabName: "Overview",
              content,
              displayOrder: section.displayOrder ?? index,
              status: section.status || "active",
            }
          : section
      ),
    }));
    setEditingSectionIndex(null);
    setEditingSection({ title: "", content: "" });
  };

  const handleCancelSectionEdit = () => {
    setEditingSectionIndex(null);
    setEditingSection({ title: "", content: "" });
  };

  const handleRemoveSection = (index) => {
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, itemIndex) => itemIndex !== index),
    }));
    setEditingSectionIndex((prevIndex) => {
      if (prevIndex === null) return prevIndex;
      if (prevIndex === index) {
        setEditingSection({ title: "", content: "" });
        return null;
      }
      return prevIndex > index ? prevIndex - 1 : prevIndex;
    });
  };

  const handleAddFaq = () => {
    const question = newFaq.question.trim();
    const answer = newFaq.answer.trim();

    if (!question || !answer) {
      showError("FAQ question and answer are required");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      faqs: [...prev.faqs, { question, answer }],
    }));
    setNewFaq({ question: "", answer: "" });
  };

  const handleRemoveFaq = (index) => {
    setFormData((prev) => ({
      ...prev,
      faqs: prev.faqs.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const handleAddQuickFact = () => {
    if (!newQuickFact.label.trim() || !newQuickFact.value.trim()) {
      showError("Quick Fact Label and Value are required");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      quickFacts: [...prev.quickFacts, newQuickFact],
    }));
    setNewQuickFact({ label: "", value: "" });
  };

  const handleNewQuickFactChange = (field, value) => {
    setNewQuickFact((prev) => ({ ...prev, [field]: value }));
  };

  const handleRemoveQuickFact = (index) => {
    const updated = [...formData.quickFacts];
    updated.splice(index, 1);
    setFormData((prev) => ({ ...prev, quickFacts: updated }));
  };

  const handleEditorChange = (name, content) => {
    setFormData((prev) => ({ ...prev, [name]: content }));
  };

  const handleImageUpload = (name, url) => {
    setFormData((prev) => ({ ...prev, [name]: url }));
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

  const isBlank = (value) => String(value ?? "").trim() === "";

  const isBlankRichText = (value) => {
    const text = String(value || "")
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim();
    return text === "";
  };

  const validateForm = () => {
    const requiredTextFields = [
      ["Country Name", formData.name],
      ["Short Name", formData.shortName],
      ["Country Code", formData.code],
      ["Capital City", formData.capital],
      ["Currency", formData.currency],
      ["Language", formData.language],
      ["Population", formData.population],
      ["Time Zone", formData.timeZone],
      ["Calling Code", formData.callingCode],
      ["Short Description", formData.shortDescription],
      ["Status", formData.status],
    ];

    for (const [label, value] of requiredTextFields) {
      if (isBlank(value)) {
        showError(`${label} is required`);
        return false;
      }
    }

    if (isBlank(formData.displayOrder) || Number.isNaN(Number(formData.displayOrder))) {
      showError("Display Order is required");
      return false;
    }

    if (!formData.logo) {
      showError("Country Logo is required");
      return false;
    }

    if (!formData.banner) {
      showError("Country Banner is required");
      return false;
    }

    if (!formData.countryGallery.length) {
      showError("At least one country gallery image is required");
      return false;
    }

    if (!formData.quickFacts.length) {
      showError("At least one quick fact is required");
      return false;
    }

    if (isBlankRichText(formData.longDescription)) {
      showError("Long Description is required");
      return false;
    }

    if (isBlankRichText(formData.documentsRequired)) {
      showError("Documents Required is required");
      return false;
    }

    if (!formData.faqs.length) {
      showError("At least one FAQ is required");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!validateForm()) {
        setLoading(false);
        return;
      }

      const token = getAccessToken();
      if (!token) {
        showError("Authentication required.");
        setLoading(false);
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
        countryGallery: formData.countryGallery,
        shortDescription: formData.shortDescription,
        longDescription: formData.longDescription,
        metaTitle: formData.metaTitle,
        metaDescription: formData.metaDescription,
        focusKeyword: formData.focusKeyword,
        metaKeywords: formData.metaKeywords.split(",").map(k => k.trim()).filter(Boolean),
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
        verified: formData.verified,
        displayOrder: Number(formData.displayOrder) || 0,

        

        faqs: formData.faqs,
        sections: formData.sections,
        quickFacts: formData.quickFacts,
        documentsRequired: formData.documentsRequired,
      };

      const response = await fetch("/api/countries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        showSuccess("Country created successfully!");
        router.push("/admin/country");
      } else {
        const errorMsg = data.details ? `${data.error}: ${data.details.join(", ")}` : data.error;
        showError("Failed to create country: " + errorMsg);
      }
    } catch (error) {
      console.error("Submit Error:", error);
      showError("An error occurred while creating the country");
    } finally {
      setLoading(false);
    }
  };

  // Common UI Classes
  const labelClassName =
    "text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block transition-colors";
  const inputClassName =
    "w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary/30 bg-white dark:bg-slate-900/70 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/50 transition-colors";
  const selectButtonClassName =
    "w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded text-sm text-left flex items-center justify-between outline-none focus:border-primary focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary/30 bg-white dark:bg-slate-900/70 text-gray-900 dark:text-white transition-colors cursor-pointer";
  const sectionHeadingClassName =
    "text-lg font-semibold text-gray-900 dark:text-white transition-colors";
  const optionalText = (
    <span className="ml-1 whitespace-nowrap text-[10px] font-normal text-gray-500 dark:text-white/45">
      (Optional)
    </span>
  );

  const checkboxClassName =
    "w-4 h-4 text-primary border-gray-300 dark:border-slate-700 rounded focus:ring-primary dark:bg-slate-900/70";
  const secondaryActionClassName =
    "px-4 py-2 text-sm text-gray-700 dark:text-white/80 border border-gray-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900/70 no-underline hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors";
  const primaryActionClassName =
    "px-4 py-2 text-sm text-white bg-primary border-none rounded cursor-pointer font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

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
          Add New Country
        </h1>
        <p className="text-xs text-gray-600 dark:text-white/70">
          Create a new study destination
        </p>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800 rounded-lg p-4 sm:p-5 shadow-sm transition-colors">
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
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className={labelClassName}>Country Name <span className="text-secondary">*</span></label>
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
                  Country Code (e.g. IND) <span className="text-secondary">*</span>
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
                <ApnaSelect
                  title=""
                  options={currencyOptions}
                  value={formData.currency}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, currency: value }))
                  }
                  placeholder="Search & select currency..."
                  searchable={true}
                  required
                  buttonClassName={selectButtonClassName}
                />
              </div>
              <div>
                <label className={labelClassName}>Language</label>
                <input
                  type="text"
                  name="language"
                  value={formData.language}
                  onChange={handleInputChange}
                  placeholder="e.g. English, Mandarin"
                  className={inputClassName}
                />
              </div>
              <div>
                <label className={labelClassName}>Population</label>
                <input
                  type="text"
                  name="population"
                  value={formData.population}
                  onChange={handleInputChange}
                  placeholder="e.g. 1.4 Billion"
                  className={inputClassName}
                />
              </div>
              <div>
                <label className={labelClassName}>Time Zone</label>
                <input
                  type="text"
                  name="timeZone"
                  value={formData.timeZone}
                  onChange={handleInputChange}
                  placeholder="e.g. UTC+8"
                  className={inputClassName}
                />
              </div>
              <div>
                <label className={labelClassName}>Calling Code</label>
                <input
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
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
              <div>
                <ImageUpload
                  title="Country Brochure (Optional)"
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
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Country Gallery</h3>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-4">
                {formData.countryGallery && formData.countryGallery.map((item, idx) => (
                  <div key={idx} className="relative aspect-square border rounded-lg overflow-hidden group border-gray-200 dark:border-slate-700">
                    <img src={item.url} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => handleRemoveGalleryImage(idx)} className="absolute top-1 right-1 bg-red-500/90 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      ✕
                    </button>
                  </div>
                ))}
                <div className="aspect-square">
                  <ImageUpload
                    title="Add Image"
                    type="image"
                    onUploadSuccess={handleAddGalleryImage}
                    accept="image/*"
                    maxSize="5MB"
                    width="100%"
                    height="100%"
                    className="w-full h-full"
                    uploadType="countries"
                    identifier={`gallery-${Date.now()}`}
                    hidePreview={true}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Facts */}
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
              <h2 className={sectionHeadingClassName}>Quick Facts</h2>
            </div>
            
            <div className="mb-6 p-4 border border-primary-200 dark:border-primary/30 rounded-lg bg-primary-50/30 dark:bg-primary/5">
              <h4 className="text-sm font-semibold mb-4 text-gray-900 dark:text-white">Add New Quick Fact</h4>
              <div className="grid grid-cols-1 gap-4 mb-3">
                <div>
                  <label className={labelClassName}>Label (e.g. Duration)</label>
                  <input type="text" value={newQuickFact.label} onChange={(e) => handleNewQuickFactChange("label", e.target.value)} className={inputClassName} placeholder="Enter label..." />
                </div>
                <div>
                  <label className={labelClassName}>Value (e.g. 5 Years)</label>
                  <input type="text" value={newQuickFact.value} onChange={(e) => handleNewQuickFactChange("value", e.target.value)} className={inputClassName} placeholder="Enter value..." />
                </div>
              </div>
              <div className="flex justify-end mt-2">
                <button type="button" onClick={handleAddQuickFact} className="bg-primary text-white px-4 py-2 text-sm rounded hover:bg-primary-700 transition-colors shadow-sm">
                  + Add to List
                </button>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              {formData.quickFacts.map((fact, index) => (
                <div key={index} className="relative flex flex-col items-stretch p-4 sm:flex-row sm:items-center sm:justify-between border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800/50 hover:shadow-sm transition-shadow">
                  <div className="min-w-0 flex-1 pr-24 sm:pr-4">
                    <div className="flex min-w-0 flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-3">
                      <h4 className="font-semibold text-sm text-gray-900 dark:text-white truncate" title={fact.label}>{fact.label}</h4>
                      <span className="hidden h-1.5 w-1.5 shrink-0 rounded-full bg-gray-300 dark:bg-gray-600 sm:block"></span>
                      <p className="max-w-full break-words text-xs font-medium text-primary sm:whitespace-nowrap">{fact.value}</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => handleRemoveQuickFact(index)} className="absolute right-4 top-4 shrink-0 text-xs bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded transition-colors dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 sm:static">
                    Remove
                  </button>
                </div>
              ))}
              {formData.quickFacts.length === 0 && (
                <div className="text-center py-6 text-sm text-gray-500 border border-dashed border-gray-300 dark:border-slate-700 rounded-lg">No quick facts added yet.</div>
              )}
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
                <div className="min-h-[300px] max-w-full border border-gray-200 dark:border-slate-700 rounded overflow-hidden">
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

          {/* Documents Required */}
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
              <h2 className={sectionHeadingClassName}>Documents Required</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className={labelClassName}>List of Documents (HTML via Editor)</label>
                <div className="min-h-[200px] max-w-full border border-gray-200 dark:border-slate-700 rounded overflow-hidden">
                  <ApnaEditor
                    value={formData.documentsRequired}
                    onChange={(content) =>
                      handleEditorChange("documentsRequired", content)
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          
          {/* Dynamic Overview Sections */}
          <div className="border-b border-gray-200 dark:border-slate-800 pb-4">
            <h2 className={sectionHeadingClassName}>Dynamic Overview Sections{optionalText}</h2>
            <div className="mb-6 p-4 border border-primary-200 dark:border-primary/30 rounded-lg bg-primary-50/30 dark:bg-primary/5">
              <h3 className="text-sm font-semibold mb-4 text-gray-900 dark:text-white">Add New Section</h3>
              <div className="mb-3">
                <label className={labelClassName}>Section Title</label>
                <input type="text" value={newSection.title} onChange={(e) => setNewSection({...newSection, title: e.target.value})} className={inputClassName} placeholder="e.g. Admission Timeline" />
              </div>
              <div className="mb-3">
                <label className={labelClassName}>Content</label>
                <ApnaEditor value={newSection.content} onChange={(content) => setNewSection({...newSection, content})} />
              </div>
              <div className="flex justify-end mt-2">
                <button type="button" onClick={handleAddSection} className="bg-primary text-white px-4 py-2 text-sm rounded hover:bg-primary-700 transition-colors shadow-sm">
                  + Add to List
                </button>
              </div>
            </div>
            <div className="space-y-4 mb-4">
              {formData.sections.map((sec, index) => (
                <div key={index} className="p-4 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800/50 hover:shadow-sm transition-shadow">
                  {editingSectionIndex === index ? (
                    <div className="space-y-3">
                      <div>
                        <label className={labelClassName}>Section Title</label>
                        <input
                          type="text"
                          value={editingSection.title}
                          onChange={(e) => setEditingSection({ ...editingSection, title: e.target.value })}
                          className={inputClassName}
                          placeholder="Enter section title..."
                        />
                      </div>
                      <div>
                        <label className={labelClassName}>Content</label>
                        <ApnaEditor
                          value={editingSection.content}
                          onChange={(content) => setEditingSection({ ...editingSection, content })}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={handleCancelSectionEdit} className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 px-3 py-1.5 rounded transition-colors dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-slate-600">
                          Cancel
                        </button>
                        <button type="button" onClick={() => handleSaveSection(index)} className="text-xs bg-primary text-white hover:bg-primary-700 px-3 py-1.5 rounded transition-colors">
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <p className="font-medium text-sm text-gray-900 dark:text-white">{sec.title}</p>
                        <div className="flex shrink-0 gap-2">
                          <button type="button" onClick={() => handleEditSection(index)} className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 px-3 py-1.5 rounded transition-colors dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-slate-600">
                            Edit
                          </button>
                          <button type="button" onClick={() => handleRemoveSection(index)} className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded transition-colors dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40">
                            Remove
                          </button>
                        </div>
                      </div>
                      <div className="text-sm prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: sec.content }} />
                    </>
                  )}
                </div>
              ))}
              {formData.sections.length === 0 && (
                <div className="text-center py-6 text-sm text-gray-500 border border-dashed border-gray-300 dark:border-slate-700 rounded-lg">No dynamic overview sections added yet.</div>
              )}
            </div>
          </div>

          {/* Structured FAQs */}
          <div className="border-b border-gray-200 dark:border-slate-800 pb-4">
            <h2 className={sectionHeadingClassName}>FAQs (Accordion)</h2>
            <div className="mb-6 p-4 border border-primary-200 dark:border-primary/30 rounded-lg bg-primary-50/30 dark:bg-primary/5">
              <h3 className="text-sm font-semibold mb-4 text-gray-900 dark:text-white">Add New FAQ</h3>
              <div className="grid grid-cols-1 gap-4 mb-3">
                <div>
                  <label className={labelClassName}>Question</label>
                  <input type="text" value={newFaq.question} onChange={(e) => setNewFaq({...newFaq, question: e.target.value})} className={inputClassName} placeholder="Enter question..." />
                </div>
                <div>
                  <label className={labelClassName}>Answer</label>
                  <input type="text" value={newFaq.answer} onChange={(e) => setNewFaq({...newFaq, answer: e.target.value})} className={inputClassName} placeholder="Enter answer..." />
                </div>
              </div>
              <div className="flex justify-end mt-2">
                <button type="button" onClick={handleAddFaq} className="bg-primary text-white px-4 py-2 text-sm rounded hover:bg-primary-700 transition-colors shadow-sm">
                  + Add to List
                </button>
              </div>
            </div>
            <div className="space-y-3 mb-4">
              {formData.faqs.map((faq, index) => (
                <div key={index} className="flex flex-col items-stretch gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800/50 hover:shadow-sm transition-shadow">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">Q: {faq.question}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">A: {faq.answer}</p>
                  </div>
                  <button type="button" onClick={() => handleRemoveFaq(index)} className="shrink-0 self-end text-xs bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded transition-colors dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 sm:self-auto">
                    Remove
                  </button>
                </div>
              ))}
              {formData.faqs.length === 0 && (
                <div className="text-center py-6 text-sm text-gray-500 border border-dashed border-gray-300 dark:border-slate-700 rounded-lg">No FAQs added yet.</div>
              )}
            </div>
          </div>
  
          {/* SEO Information */}
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
                  d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                />
              </svg>
              <h2 className={sectionHeadingClassName}>SEO Information{optionalText}</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClassName}>Meta Title{optionalText}</label>
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
                <label className={labelClassName}>Focus Keyword{optionalText}</label>
                <input
                  type="text"
                  name="focusKeyword"
                  value={formData.focusKeyword}
                  onChange={handleInputChange}
                  placeholder="Enter focus keyword"
                  className={inputClassName}
                />
              </div>
              <div className="col-span-full">
                <label className={labelClassName}>Meta Description{optionalText}</label>
                <textarea
                  name="metaDescription"
                  value={formData.metaDescription}
                  onChange={handleInputChange}
                  rows={2}
                  className={inputClassName}
                  placeholder="Enter meta description"
                />
              </div>
              <div className="col-span-full mt-4 pt-4 border-t border-gray-200 dark:border-slate-800">
                <h3 className="text-sm font-medium mb-3 text-gray-900 dark:text-white">Advanced SEO & Open Graph</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClassName}>Meta Keywords{optionalText}</label>
                    <input type="text" name="metaKeywords" value={formData.metaKeywords} onChange={handleInputChange} placeholder="e.g. mbbs in china, study abroad" className={inputClassName} />
                  </div>
                  <div>
                    <label className={labelClassName}>Canonical URL{optionalText}</label>
                    <input type="text" name="canonicalUrl" value={formData.canonicalUrl} onChange={handleInputChange} placeholder="https://example.com/country/china" className={inputClassName} />
                  </div>
                  <div>
                    <label className={labelClassName}>OG Title{optionalText}</label>
                    <input type="text" name="ogTitle" value={formData.ogTitle} onChange={handleInputChange} className={inputClassName} />
                  </div>
                  <div>
                    <label className={labelClassName}>OG Description{optionalText}</label>
                    <textarea name="ogDescription" value={formData.ogDescription} onChange={handleInputChange} rows={2} className={inputClassName} />
                  </div>
                  <div className="col-span-full">
                    <label className={labelClassName}>OG Image URL{optionalText}</label>
                    <input type="text" name="ogImage" value={formData.ogImage} onChange={handleInputChange} className={inputClassName} />
                  </div>
                  <div>
                    <label className={labelClassName}>Twitter Title{optionalText}</label>
                    <input type="text" name="twitterTitle" value={formData.twitterTitle} onChange={handleInputChange} className={inputClassName} />
                  </div>
                  <div>
                    <label className={labelClassName}>Twitter Description{optionalText}</label>
                    <textarea name="twitterDescription" value={formData.twitterDescription} onChange={handleInputChange} rows={2} className={inputClassName} />
                  </div>
                  <div className="col-span-full">
                    <label className={labelClassName}>Twitter Image URL{optionalText}</label>
                    <input type="text" name="twitterImage" value={formData.twitterImage} onChange={handleInputChange} className={inputClassName} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Status & Metadata */}
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h2 className={sectionHeadingClassName}>Status & Metadata</h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
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
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
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
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-white/80 cursor-pointer">
                <input
                  type="checkbox"
                  name="verified"
                  checked={formData.verified}
                  onChange={handleInputChange}
                  className={checkboxClassName}
                />
                Mark as verified
              </label>
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
              disabled={loading}
              className={primaryActionClassName}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </div>
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
