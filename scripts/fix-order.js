const fs = require('fs');

const dynamicSectionHtmlOldRegex = /\{\/\* Dynamic Overview Sections \*\/\}[\s\S]*?\{\/\* SEO Information \*\/\}/;

const dynamicSectionHtmlNew = `{/* Dynamic Overview Sections */}
          <div className="border-b border-gray-200 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h2 className={sectionHeadingClassName}>Dynamic Overview Sections</h2>
            </div>
            
            <div className="mb-6 p-4 border border-primary-200 dark:border-primary/30 rounded-lg bg-primary-50/30 dark:bg-primary/5">
              <h4 className="text-sm font-semibold mb-4 text-gray-900 dark:text-white">Add New Section</h4>
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
                  + Add Section
                </button>
              </div>
            </div>

            <div className="space-y-4 mb-4">
              {formData.sections.map((sec, index) => (
                <div key={index} className="p-4 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800/50 shadow-sm relative">
                  <button type="button" onClick={() => handleRemoveSection(index)} className="absolute top-2 right-2 text-xs bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded transition-colors dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40">Remove</button>
                  <p className="font-semibold text-gray-900 dark:text-white mb-2">{sec.title}</p>
                  <div className="text-sm prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300" dangerouslySetInnerHTML={{ __html: sec.content }} />
                </div>
              ))}
              {formData.sections.length === 0 && (
                <div className="text-center py-6 text-sm text-gray-500 border border-dashed border-gray-300 dark:border-slate-700 rounded-lg">No dynamic sections added yet.</div>
              )}
            </div>
          </div>

          {/* Structured FAQs */}
          <div className="border-b border-gray-200 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className={sectionHeadingClassName}>FAQs (Accordion)</h2>
            </div>
            
            <div className="mb-6 p-4 border border-primary-200 dark:border-primary/30 rounded-lg bg-primary-50/30 dark:bg-primary/5">
              <h4 className="text-sm font-semibold mb-4 text-gray-900 dark:text-white">Add New FAQ</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
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
                  + Add FAQ
                </button>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              {formData.faqs.map((faq, index) => (
                <div key={index} className="flex items-center justify-between p-4 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800/50 hover:shadow-sm transition-shadow">
                  <div className="flex-1 pr-4">
                    <p className="font-semibold text-sm text-gray-900 dark:text-white mb-1">Q: {faq.question}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">A: {faq.answer}</p>
                  </div>
                  <button type="button" onClick={() => handleRemoveFaq(index)} className="shrink-0 text-xs bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded transition-colors dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40">Remove</button>
                </div>
              ))}
              {formData.faqs.length === 0 && (
                <div className="text-center py-6 text-sm text-gray-500 border border-dashed border-gray-300 dark:border-slate-700 rounded-lg">No FAQs added yet.</div>
              )}
            </div>
          </div>
  
          {/* SEO Information */}`;

function fixOrder(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(dynamicSectionHtmlOldRegex, dynamicSectionHtmlNew);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed order in', file);
}

fixOrder('D:\\work\\ccic_backend\\app\\admin\\country\\add\\page.jsx');
fixOrder('D:\\work\\ccic_backend\\app\\admin\\country\\edit\\[id]\\page.jsx');
