const fs = require('fs');
const path = require('path');

function updateForm(filePath, isEdit) {
  let content = fs.readFileSync(filePath, 'utf-8');

  // 1. Remove newPathway state & Add faqs/sections state
  content = content.replace(
    /const \[newPathway, setNewPathway\].*?;/,
    `const [newFaq, setNewFaq] = useState({ question: "", answer: "" });\n  const [newSection, setNewSection] = useState({ title: "", content: "" });`
  );

  // 2. State removal of deprecated fields & add new fields
  content = content.replace(
    /(\/\/ Study Metrics[\s\S]*?mediumOfTeaching: "",\n+)(\s+\/\/ Admission Details[\s\S]*?visaType: "",\n+)/,
    ``
  );
  
  content = content.replace(
    /studyPathways: \[.*?\],/,
    `faqs: [],\n    sections: [],`
  );
  
  content = content.replace(
    /isPopular: false,/,
    `isPopular: false,\n    verified: false,`
  );

  // 3. Handlers replacing
  const pathwayHandlersRegex = /const handleAddPathway = \(\) => \{[\s\S]*?const handleRemovePathway = \(index\) => \{[\s\S]*?setFormData\(\(prev\) => \(\{ \.\.\.prev, studyPathways: updated \}\)\);\n  \};/;
  
  const newHandlers = `const handleAddFaq = () => {
    if (!newFaq.question.trim() || !newFaq.answer.trim()) return;
    setFormData((prev) => ({ ...prev, faqs: [...prev.faqs, newFaq] }));
    setNewFaq({ question: "", answer: "" });
  };
  const handleRemoveFaq = (index) => {
    const updated = [...formData.faqs];
    updated.splice(index, 1);
    setFormData((prev) => ({ ...prev, faqs: updated }));
  };
  const handleAddSection = () => {
    if (!newSection.title.trim() || !newSection.content.trim()) return;
    setFormData((prev) => ({ ...prev, sections: [...prev.sections, newSection] }));
    setNewSection({ title: "", content: "" });
  };
  const handleRemoveSection = (index) => {
    const updated = [...formData.sections];
    updated.splice(index, 1);
    setFormData((prev) => ({ ...prev, sections: updated }));
  };`;

  content = content.replace(pathwayHandlersRegex, newHandlers);

  // 4. Submit Payload Cleanup
  if (isEdit) {
      content = content.replace(/studyMetrics: \{[\s\S]*?\},/, "");
      content = content.replace(/admissionDetails: \{[\s\S]*?\},/, "");
      content = content.replace(/studyPathways: country.studyPathways \|\| \[\],/, `faqs: country.faqs || [],\n            sections: [],`);
      content = content.replace(/verified: country.verified \|\| false,/, ``); 
      content = content.replace(/isPopular: country.isPopular \|\| false,/, `isPopular: country.isPopular || false,\n            verified: country.verified || false,`);
  }
  
  content = content.replace(/studyMetrics: \{[\s\S]*?\},/, "");
  content = content.replace(/timeline: formData.timeline,\s*eligibility: formData.eligibility,\s*visaType: formData.visaType,/, "");
  content = content.replace(/studyPathways: formData.studyPathways,/, `faqs: formData.faqs,\n        sections: formData.sections,`);
  content = content.replace(/isPopular: formData.isPopular,/, `isPopular: formData.isPopular,\n        verified: formData.verified,`);

  // 5. UI Removals: Study Metrics, Admission, Study Pathways
  content = content.replace(/\{\/\* Study & Financial Metrics \*\/\}(.|\n)*?\{\/\* Admission Details \*\/\}(.|\n)*?\{\/\* Media & Documents \*\/\}/, `{/* Media & Documents */}`);
  content = content.replace(/\{\/\* Study Pathways \*\/\}(.|\n)*?\{\/\* Quick Facts \*\/\}/, `{/* Quick Facts */}`);

  // 6. UI Additions: Dynamic Sections & FAQs
  const customSectionHtml = `
          {/* Dynamic Overview Sections */}
          <div className="border-b border-gray-200 dark:border-slate-800 pb-4">
            <h2 className={sectionHeadingClassName}>Dynamic Overview Sections</h2>
            <div className="space-y-4 mb-4">
              {formData.sections.map((sec, index) => (
                <div key={index} className="p-4 border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-800/50 relative">
                  <button type="button" onClick={() => handleRemoveSection(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700 p-1 bg-white dark:bg-slate-900 rounded-full shadow-sm">✕</button>
                  <p className="font-medium mb-2">{sec.title}</p>
                  <div className="text-sm prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: sec.content }} />
                </div>
              ))}
            </div>
            <div className="p-4 border border-dashed border-gray-300 dark:border-slate-700 rounded-lg">
              <h3 className="text-sm font-medium mb-3">Add New Section</h3>
              <div className="mb-3">
                <label className={labelClassName}>Section Title</label>
                <input type="text" value={newSection.title} onChange={(e) => setNewSection({...newSection, title: e.target.value})} className={inputClassName} placeholder="e.g. Admission Timeline" />
              </div>
              <div className="mb-3">
                <label className={labelClassName}>Content</label>
                <ApnaEditor content={newSection.content} onChange={(content) => setNewSection({...newSection, content})} />
              </div>
              <button type="button" onClick={handleAddSection} className="text-sm bg-primary/10 text-primary px-4 py-2 rounded hover:bg-primary/20 transition-colors">+ Add Section</button>
            </div>
          </div>

          {/* Structured FAQs */}
          <div className="border-b border-gray-200 dark:border-slate-800 pb-4">
            <h2 className={sectionHeadingClassName}>FAQs (Accordion)</h2>
            <div className="space-y-3 mb-4">
              {formData.faqs.map((faq, index) => (
                <div key={index} className="p-3 border border-gray-200 dark:border-slate-700 rounded bg-gray-50 dark:bg-slate-800/50 flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm">Q: {faq.question}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">A: {faq.answer}</p>
                  </div>
                  <button type="button" onClick={() => handleRemoveFaq(index)} className="text-red-500 hover:text-red-700 p-1">✕</button>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div>
                <label className={labelClassName}>Question</label>
                <input type="text" value={newFaq.question} onChange={(e) => setNewFaq({...newFaq, question: e.target.value})} className={inputClassName} />
              </div>
              <div>
                <label className={labelClassName}>Answer</label>
                <input type="text" value={newFaq.answer} onChange={(e) => setNewFaq({...newFaq, answer: e.target.value})} className={inputClassName} />
              </div>
              <div className="md:col-span-2">
                <button type="button" onClick={handleAddFaq} className="text-sm bg-primary/10 text-primary px-4 py-2 rounded hover:bg-primary/20 transition-colors">+ Add FAQ</button>
              </div>
            </div>
          </div>
  `;

  content = content.replace(/(\{\/\* SEO Information \*\/\})/, customSectionHtml + '\n          $1');

  // 7. UI Verified Checkbox
  const verifiedCheckbox = `
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="verified" checked={formData.verified} onChange={handleInputChange} className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Mark as verified</span>
                  </label>`;
                  
  content = content.replace(/<label className="flex items-center gap-2 cursor-pointer">\s*<input type="checkbox" name="isPopular"/, verifiedCheckbox + '\n                  <label className="flex items-center gap-2 cursor-pointer">\n                    <input type="checkbox" name="isPopular"');

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log("Updated", filePath);
}

try {
  updateForm(path.join(__dirname, '..', 'app', 'admin', 'country', 'add', 'page.jsx'), false);
  updateForm(path.join(__dirname, '..', 'app', 'admin', 'country', 'edit', '[id]', 'page.jsx'), true);
} catch(e) {
  console.error(e);
}
