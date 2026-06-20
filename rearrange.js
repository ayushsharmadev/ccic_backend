const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app', 'admin', 'country', 'edit', '[id]', 'page.jsx');
let content = fs.readFileSync(filePath, 'utf-8');

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
  let afterFormActions = content.substring(formActionsIdx);

  // We need to inject the new SEO fields before the last 3 </div> tags of seoBlock
  const newFields = `
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
`;

  // Remove the closing tags from seoBlock and append newFields
  seoBlock = seoBlock.replace(/<\\/div>\\s*<\\/div>\\s*<\\/div>\\s*$/, "");
  seoBlock = seoBlock + newFields;

  // Reorder
  content = beforeSeo + statusBlock + "\\n          " + seoBlock + "\\n          " + afterFormActions;
  
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log("Success");
} else {
  console.log("Markers not found");
}
