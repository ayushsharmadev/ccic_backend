const fs = require('fs');

const handlers = `
  const handleAddFaq = () => {
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
  };

`;

function fixForm(file) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Inject handlers if not there
  if (!content.includes('const handleAddSection = () => {')) {
    content = content.replace('const handleSubmit = async (e) => {', handlers + 'const handleSubmit = async (e) => {');
  }

  // Fix ApnaEditor value prop
  content = content.replace(/<ApnaEditor content=\{newSection\.content\}/g, '<ApnaEditor value={newSection.content}');

  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed', file);
}

fixForm('D:\\work\\ccic_backend\\app\\admin\\country\\add\\page.jsx');
fixForm('D:\\work\\ccic_backend\\app\\admin\\country\\edit\\[id]\\page.jsx');
