const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  path.join(__dirname, 'app', 'admin', 'country', 'add', 'page.jsx'),
  path.join(__dirname, 'app', 'admin', 'country', 'edit', '[id]', 'page.jsx')
];

filesToUpdate.forEach(filePath => {
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf-8');

  // 1. Remove duplicate labels in Media & Documents
  content = content.replace(
    /<label className=\{labelClassName\}>Country Logo<\/label>\s*/g,
    ''
  );
  content = content.replace(
    /<label className=\{labelClassName\}>Country Banner<\/label>\s*/g,
    ''
  );
  content = content.replace(
    /<label className=\{labelClassName\}>Country Brochure \(PDF\)<\/label>\s*/g,
    ''
  );

  // 2. Pathway logic: Compute canAddPathway and use it in the Add button
  // Add canAddPathway before return (
  if (!content.includes('const canAddPathway =')) {
    const returnIdx = content.indexOf('return (');
    if (returnIdx !== -1) {
      const canAddPathwayStr = `
  const canAddPathway =
    formData.studyPathways.length === 0 ||
    (formData.studyPathways[formData.studyPathways.length - 1]?.title?.trim() !== "" &&
     formData.studyPathways[formData.studyPathways.length - 1]?.duration?.trim() !== "");

  `;
      content = content.substring(0, returnIdx) + canAddPathwayStr + content.substring(returnIdx);
    }
  }

  // Update the button
  content = content.replace(
    /<button type="button" onClick=\{handleAddPathway\}/g,
    `<button type="button" onClick={handleAddPathway} disabled={!canAddPathway}`
  );
  
  // Also add opacity-50 and cursor-not-allowed if disabled
  content = content.replace(
    /className="text-sm bg-primary\/10 text-primary px-3 py-1\.5 rounded hover:bg-primary\/20 transition-colors"/g,
    `className={\`text-sm bg-primary/10 text-primary px-3 py-1.5 rounded transition-colors \${!canAddPathway ? "opacity-50 cursor-not-allowed" : "hover:bg-primary/20"}\`}`
  );

  // 3. Improve Gallery UI
  // Remove the block label for Country Gallery
  content = content.replace(
    /<label className="block text-sm font-medium text-gray-700 dark:text-white\/80 mb-2">Country Gallery \(Multiple Images\)<\/label>\s*/g,
    ''
  );
  
  // Add multiple={true} to the Gallery ImageUpload and simplify the grid
  content = content.replace(
    /title="Add Photo"\s+type="image"\s+preview=\{null\}\s+onFileChange=\{\(\) => \{\}\}\s+onRemove=\{\(\) => \{\}\}\s+accept="image\/\*"/g,
    `title="Country Gallery (Multiple)"
                    type="image"
                    preview={null}
                    onFileChange={() => {}}
                    onRemove={() => {}}
                    accept="image/*"
                    multiple={true}`
  );

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Updated ${filePath}`);
});
