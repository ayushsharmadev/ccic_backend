const fs = require('fs');
const path = require('path');

const addPagePath = path.join(__dirname, '..', 'app', 'admin', 'country', 'add', 'page.jsx');
const editPagePath = path.join(__dirname, '..', 'app', 'admin', 'country', 'edit', '[id]', 'page.jsx');

function updateAddPage() {
  if (!fs.existsSync(addPagePath)) {
    console.error(`File not found: ${addPagePath}`);
    return;
  }
  let content = fs.readFileSync(addPagePath, 'utf8');

  // Replace Short Name
  content = content.replace(
    '<label className={labelClassName}>Short Name</label>',
    '<label className={labelClassName}>Short Name (Optional)</label>'
  );

  // Replace Capital City
  content = content.replace(
    `<label className={labelClassName}>Capital City *</label>
                <input
                  required
                  type="text"
                  name="capital"`,
    `<label className={labelClassName}>Capital City (Optional)</label>
                <input
                  type="text"
                  name="capital"`
  );

  // Replace Currency
  content = content.replace(
    `<label className={labelClassName}>Currency *</label>
                <input
                  required
                  type="text"
                  name="currency"`,
    `<label className={labelClassName}>Currency (Optional)</label>
                <input
                  type="text"
                  name="currency"`
  );

  // Replace Language
  content = content.replace(
    `<label className={labelClassName}>Language *</label>
                <input
                  required
                  type="text"
                  name="language"`,
    `<label className={labelClassName}>Language (Optional)</label>
                <input
                  type="text"
                  name="language"`
  );

  // Replace Population
  content = content.replace(
    `<label className={labelClassName}>Population *</label>
                <input
                  required
                  type="text"
                  name="population"`,
    `<label className={labelClassName}>Population (Optional)</label>
                <input
                  type="text"
                  name="population"`
  );

  // Replace Time Zone
  content = content.replace(
    `<label className={labelClassName}>Time Zone *</label>
                <input
                  required
                  type="text"
                  name="timeZone"`,
    `<label className={labelClassName}>Time Zone (Optional)</label>
                <input
                  type="text"
                  name="timeZone"`
  );

  // Replace Calling Code
  content = content.replace(
    `<label className={labelClassName}>Calling Code *</label>
                <input
                  required
                  type="text"
                  name="callingCode"`,
    `<label className={labelClassName}>Calling Code (Optional)</label>
                <input
                  type="text"
                  name="callingCode"`
  );

  // Image Upload Title replacements
  content = content.replace('title="Country Logo"', 'title="Country Logo (Optional)"');
  content = content.replace('title="Country Banner"', 'title="Country Banner (Optional)"');
  content = content.replace('title="Country Brochure"', 'title="Country Brochure (Optional)"');

  // Country Gallery Heading
  content = content.replace(
    '<h3 className="text-sm font-semibold text-gray-900 dark:text-white">Country Gallery</h3>',
    '<h3 className="text-sm font-semibold text-gray-900 dark:text-white">Country Gallery (Optional)</h3>'
  );

  // Quick Facts Heading
  content = content.replace(
    '<h2 className={sectionHeadingClassName}>Quick Facts</h2>',
    '<h2 className={sectionHeadingClassName}>Quick Facts (Optional)</h2>'
  );

  // Description Heading & subfields
  content = content.replace(
    '<h2 className={sectionHeadingClassName}>Description</h2>',
    '<h2 className={sectionHeadingClassName}>Description (Optional)</h2>'
  );
  content = content.replace(
    'Short Description (max 1500 characters)',
    'Short Description (Optional, max 1500 characters)'
  );
  content = content.replace(
    '<label className={labelClassName}>Long Description</label>',
    '<label className={labelClassName}>Long Description (Optional)</label>'
  );

  // Documents Required Heading & subfields
  content = content.replace(
    '<h2 className={sectionHeadingClassName}>Documents Required</h2>',
    '<h2 className={sectionHeadingClassName}>Documents Required (Optional)</h2>'
  );
  content = content.replace(
    '<label className={labelClassName}>List of Documents (HTML via Editor)</label>',
    '<label className={labelClassName}>List of Documents (Optional, HTML via Editor)</label>'
  );

  // Dynamic Overview Sections Heading
  content = content.replace(
    '<h2 className={sectionHeadingClassName}>Dynamic Overview Sections</h2>',
    '<h2 className={sectionHeadingClassName}>Dynamic Overview Sections (Optional)</h2>'
  );

  // FAQs Heading
  content = content.replace(
    '<h2 className={sectionHeadingClassName}>FAQs (Accordion)</h2>',
    '<h2 className={sectionHeadingClassName}>FAQs (Accordion - Optional)</h2>'
  );

  // SEO Information Heading & subfields
  content = content.replace(
    '<h2 className={sectionHeadingClassName}>SEO Information</h2>',
    '<h2 className={sectionHeadingClassName}>SEO Information (Optional)</h2>'
  );
  content = content.replace(
    '<label className={labelClassName}>Meta Title</label>',
    '<label className={labelClassName}>Meta Title (Optional)</label>'
  );
  content = content.replace(
    '<label className={labelClassName}>Focus Keyword</label>',
    '<label className={labelClassName}>Focus Keyword (Optional)</label>'
  );
  content = content.replace(
    '<label className={labelClassName}>Meta Description</label>',
    '<label className={labelClassName}>Meta Description (Optional)</label>'
  );

  // Display Order
  content = content.replace(
    '<label className={labelClassName}>Display Order</label>',
    '<label className={labelClassName}>Display Order (Optional)</label>'
  );

  fs.writeFileSync(addPagePath, content, 'utf8');
  console.log('Successfully updated add/page.jsx');
}

function updateEditPage() {
  if (!fs.existsSync(editPagePath)) {
    console.error(`File not found: ${editPagePath}`);
    return;
  }
  let content = fs.readFileSync(editPagePath, 'utf8');

  // Replace Short Name
  content = content.replace(
    '<label className={labelClassName}>Short Name</label>',
    '<label className={labelClassName}>Short Name (Optional)</label>'
  );

  // Replace Capital City (Basic Info)
  content = content.replace(
    `<label className={labelClassName}>Capital City</label>
                <input
                  type="text"
                  name="capital"`,
    `<label className={labelClassName}>Capital City (Optional)</label>
                <input
                  type="text"
                  name="capital"`
  );

  // Replace Currency
  content = content.replace(
    `<label className={labelClassName}>Currency</label>
                <input
                  type="text"
                  name="currency"`,
    `<label className={labelClassName}>Currency (Optional)</label>
                <input
                  type="text"
                  name="currency"`
  );

  // Replace Language
  content = content.replace(
    `<label className={labelClassName}>Language *</label>
                <input
                  required
                  type="text"
                  name="language"`,
    `<label className={labelClassName}>Language (Optional)</label>
                <input
                  type="text"
                  name="language"`
  );

  // Replace Population
  content = content.replace(
    `<label className={labelClassName}>Population *</label>
                <input
                  required
                  type="text"
                  name="population"`,
    `<label className={labelClassName}>Population (Optional)</label>
                <input
                  type="text"
                  name="population"`
  );

  // Replace Time Zone
  content = content.replace(
    `<label className={labelClassName}>Time Zone *</label>
                <input
                  required
                  type="text"
                  name="timeZone"`,
    `<label className={labelClassName}>Time Zone (Optional)</label>
                <input
                  type="text"
                  name="timeZone"`
  );

  // Replace Calling Code
  content = content.replace(
    `<label className={labelClassName}>Calling Code *</label>
                <input
                  required
                  type="text"
                  name="callingCode"`,
    `<label className={labelClassName}>Calling Code (Optional)</label>
                <input
                  type="text"
                  name="callingCode"`
  );

  // Image Upload Title replacements
  content = content.replace('title="Country Logo"', 'title="Country Logo (Optional)"');
  content = content.replace('title="Country Banner"', 'title="Country Banner (Optional)"');
  content = content.replace('title="Country Brochure"', 'title="Country Brochure (Optional)"');
  content = content.replace('title="Country Gallery (Multiple)"', 'title="Country Gallery (Multiple) (Optional)"');

  // Country Gallery Heading
  content = content.replace(
    '<h3 className="text-sm font-semibold text-gray-900 dark:text-white">Country Gallery</h3>',
    '<h3 className="text-sm font-semibold text-gray-900 dark:text-white">Country Gallery (Optional)</h3>'
  );

  // Quick Facts Heading
  content = content.replace(
    '<h2 className={sectionHeadingClassName}>Quick Facts</h2>',
    '<h2 className={sectionHeadingClassName}>Quick Facts (Optional)</h2>'
  );

  // Description Heading & subfields
  content = content.replace(
    '<h2 className={sectionHeadingClassName}>Description</h2>',
    '<h2 className={sectionHeadingClassName}>Description (Optional)</h2>'
  );
  content = content.replace(
    'Short Description (max 1500 characters)',
    'Short Description (Optional, max 1500 characters)'
  );
  content = content.replace(
    '<label className={labelClassName}>Long Description</label>',
    '<label className={labelClassName}>Long Description (Optional)</label>'
  );

  // Documents Required Heading & subfields
  content = content.replace(
    '<h2 className={sectionHeadingClassName}>Documents Required</h2>',
    '<h2 className={sectionHeadingClassName}>Documents Required (Optional)</h2>'
  );
  content = content.replace(
    '<label className={labelClassName}>List of Documents (HTML via Editor)</label>',
    '<label className={labelClassName}>List of Documents (Optional, HTML via Editor)</label>'
  );

  // Dynamic Overview Sections Heading
  content = content.replace(
    '<h2 className={sectionHeadingClassName}>Dynamic Overview Sections</h2>',
    '<h2 className={sectionHeadingClassName}>Dynamic Overview Sections (Optional)</h2>'
  );

  // FAQs Heading
  content = content.replace(
    '<h2 className={sectionHeadingClassName}>FAQs (Accordion)</h2>',
    '<h2 className={sectionHeadingClassName}>FAQs (Accordion - Optional)</h2>'
  );

  // SEO Information Heading & subfields
  content = content.replace(
    '<h2 className={sectionHeadingClassName}>SEO Information</h2>',
    '<h2 className={sectionHeadingClassName}>SEO Information (Optional)</h2>'
  );
  content = content.replace(
    '<label className={labelClassName}>Meta Title</label>',
    '<label className={labelClassName}>Meta Title (Optional)</label>'
  );
  content = content.replace(
    '<label className={labelClassName}>Focus Keyword</label>',
    '<label className={labelClassName}>Focus Keyword (Optional)</label>'
  );
  content = content.replace(
    '<label className={labelClassName}>Meta Description</label>',
    '<label className={labelClassName}>Meta Description (Optional)</label>'
  );

  // Display Order
  content = content.replace(
    '<label className={labelClassName}>Display Order</label>',
    '<label className={labelClassName}>Display Order (Optional)</label>'
  );

  // Advanced SEO fields
  content = content.replace(
    '<label className={labelClassName}>Meta Keywords (comma separated)</label>',
    '<label className={labelClassName}>Meta Keywords (Optional)</label>'
  );
  content = content.replace(
    '<label className={labelClassName}>Canonical URL</label>',
    '<label className={labelClassName}>Canonical URL (Optional)</label>'
  );
  content = content.replace(
    '<label className={labelClassName}>OG Title</label>',
    '<label className={labelClassName}>OG Title (Optional)</label>'
  );
  content = content.replace(
    '<label className={labelClassName}>OG Description</label>',
    '<label className={labelClassName}>OG Description (Optional)</label>'
  );
  content = content.replace(
    '<label className={labelClassName}>OG Image URL</label>',
    '<label className={labelClassName}>OG Image URL (Optional)</label>'
  );
  content = content.replace(
    '<label className={labelClassName}>Twitter Title</label>',
    '<label className={labelClassName}>Twitter Title (Optional)</label>'
  );
  content = content.replace(
    '<label className={labelClassName}>Twitter Description</label>',
    '<label className={labelClassName}>Twitter Description (Optional)</label>'
  );
  content = content.replace(
    '<label className={labelClassName}>Twitter Image URL</label>',
    '<label className={labelClassName}>Twitter Image URL (Optional)</label>'
  );

  // Remove the duplicate Capital City input in Status & Metadata
  const duplicateCapitalMatch = `<div className="grid grid-cols-3 gap-4 mb-4">
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
                <label className={labelClassName}>Status</label>`;
  
  content = content.replace(
    duplicateCapitalMatch,
    `<div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className={labelClassName}>Status</label>`
  );

  fs.writeFileSync(editPagePath, content, 'utf8');
  console.log('Successfully updated edit/[id]/page.jsx');
}

updateAddPage();
updateEditPage();
