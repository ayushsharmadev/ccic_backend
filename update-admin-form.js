const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app', 'admin', 'country', 'edit', '[id]', 'page.jsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Initial State
content = content.replace(
`    // Media
    logo: null,
    banner: null,

    // Descriptions
    shortDescription: "",
    longDescription: "",

    // SEO
    metaTitle: "",
    metaDescription: "",
    focusKeyword: "",`,
`    // Media
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
    twitterImage: "",`
);

// 2. loadData
content = content.replace(
`            logo: country.logo || null,
            banner: country.banner || null,

            shortDescription: country.shortDescription || "",
            longDescription: country.longDescription || "",

            metaTitle: country.metaTitle || "",
            metaDescription: country.metaDescription || "",
            focusKeyword: country.focusKeyword || "",`,
`            logo: country.logo || null,
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
            twitterImage: country.twitterImage || "",`
);

// 3. payload
content = content.replace(
`        callingCode: formData.callingCode,
        logo: formData.logo,
        banner: formData.banner,
        shortDescription: formData.shortDescription,
        longDescription: formData.longDescription,
        metaTitle: formData.metaTitle,
        metaDescription: formData.metaDescription,
        focusKeyword: formData.focusKeyword,`,
`        callingCode: formData.callingCode,
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
        twitterImage: formData.twitterImage,`
);

// 4. Handlers
content = content.replace(
`  const handleInputChange = (e) => {`,
`  const handleAddPathway = () => {
    setFormData((prev) => ({
      ...prev,
      studyPathways: [...prev.studyPathways, { title: "", duration: "", description: "" }],
    }));
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

  const handleInputChange = (e) => {`
);

// 5. Pathways UI
content = content.replace(
`            </div>
          </div>

          {/* Media & Documents */}`,
`            </div>
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
              <button type="button" onClick={handleAddPathway} className="text-sm bg-primary/10 text-primary px-3 py-1.5 rounded hover:bg-primary/20 transition-colors">
                + Add Pathway
              </button>
            </div>
            <div className="space-y-4">
              {formData.studyPathways.map((pathway, index) => (
                <div key={index} className="p-4 border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-800/50 relative">
                  <button type="button" onClick={() => handleRemovePathway(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700 p-1 bg-white dark:bg-slate-900 rounded-full shadow-sm">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className={labelClassName}>Pathway Title</label>
                      <input type="text" value={pathway.title} onChange={(e) => handlePathwayChange(index, "title", e.target.value)} className={inputClassName} placeholder="e.g. MBBS in China" />
                    </div>
                    <div>
                      <label className={labelClassName}>Duration</label>
                      <input type="text" value={pathway.duration} onChange={(e) => handlePathwayChange(index, "duration", e.target.value)} className={inputClassName} placeholder="e.g. 6 years" />
                    </div>
                  </div>
                  <div>
                    <label className={labelClassName}>Description</label>
                    <textarea value={pathway.description} onChange={(e) => handlePathwayChange(index, "description", e.target.value)} rows={2} className={inputClassName} placeholder="Brief description of this pathway..." />
                  </div>
                </div>
              ))}
              {formData.studyPathways.length === 0 && (
                <div className="text-center py-4 text-sm text-gray-500 border border-dashed border-gray-300 dark:border-slate-700 rounded">No pathways added yet.</div>
              )}
            </div>
          </div>

          {/* Media & Documents */}`
);

// 6. Media Details
content = content.replace(
`                <p className="mt-1 text-xs text-gray-500">
                  Upload country banner (PNG, JPG - Max 5MB)
                </p>
              </div>
            </div>
          </div>`,
`                <p className="mt-1 text-xs text-gray-500">
                  Upload country banner (PNG, JPG - Max 5MB)
                </p>
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className={labelClassName}>Country Brochure (PDF)</label>
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
              <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-2">Country Gallery (Multiple Images)</label>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-4">
                {formData.countryGallery.map((item, idx) => (
                  <div key={idx} className="relative aspect-square border rounded-lg overflow-hidden group border-gray-200 dark:border-slate-700">
                    <img src={item.url} alt={\`Gallery \${idx}\`} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => handleRemoveGalleryImage(idx)} className="absolute top-1 right-1 bg-red-500/90 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      ✕
                    </button>
                  </div>
                ))}
                <div className="aspect-square">
                  <ImageUpload
                    title="Add Photo"
                    type="image"
                    preview={null}
                    onFileChange={() => {}}
                    onRemove={() => {}}
                    accept="image/*"
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
          </div>`
);

// 7. Swapping SEO and Status using split
const seoMarker = '{/* SEO Information */}';
const statusMarker = '{/* Status & Metadata */}';
const formActionsMarker = '{/* Form Actions */}';

const seoIdx = content.indexOf(seoMarker);
const statusIdx = content.indexOf(statusMarker);
const formActionsIdx = content.indexOf(formActionsMarker);

if (seoIdx !== -1 && statusIdx !== -1 && formActionsIdx !== -1) {
  let beforeSeo = content.substring(0, seoIdx);
  let seoBlock = content.substring(seoIdx, statusIdx);
  let statusBlock = content.substring(statusIdx, formActionsIdx);
  let afterStatus = content.substring(formActionsIdx);

  const missingSeoFields = \`
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
                  <div>
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
                  <div>
                    <label className={labelClassName}>Twitter Image URL</label>
                    <input type="text" name="twitterImage" value={formData.twitterImage} onChange={handleInputChange} className={inputClassName} />
                  </div>
                </div>
              </div>
            </div>
          </div>
\`;

  seoBlock = seoBlock.replace(/<\\/div>\\s*<\\/div>\\s*<\\/div>\\s*$/, \`</div>\${missingSeoFields}\`);

  content = beforeSeo + statusBlock + "\\n          " + seoBlock + "\\n          " + afterStatus;
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Successfully updated admin edit form!");
