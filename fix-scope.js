const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  path.join(__dirname, 'app', 'admin', 'country', 'add', 'page.jsx'),
  path.join(__dirname, 'app', 'admin', 'country', 'edit', '[id]', 'page.jsx')
];

filesToUpdate.forEach(filePath => {
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf-8');

  const buggyCode = `
  const canAddPathway =
    formData.studyPathways.length === 0 ||
    (formData.studyPathways[formData.studyPathways.length - 1]?.title?.trim() !== "" &&
     formData.studyPathways[formData.studyPathways.length - 1]?.duration?.trim() !== "");

  `;

  // Remove all instances of the buggy code
  while (content.includes(buggyCode)) {
    content = content.replace(buggyCode, '');
  }

  // Also try with varying whitespace if exact match fails
  const regex = /const canAddPathway =[\s\S]*?duration\?\.trim\(\) !== ""\);/g;
  content = content.replace(regex, '');

  // Insert it in the correct scope, right before `// Common UI Classes`
  const targetSpot = '// Common UI Classes';
  if (content.includes(targetSpot)) {
    const replacement = `
  const canAddPathway =
    formData.studyPathways.length === 0 ||
    (formData.studyPathways[formData.studyPathways.length - 1]?.title?.trim() !== "" &&
     formData.studyPathways[formData.studyPathways.length - 1]?.duration?.trim() !== "");

  // Common UI Classes`;
    
    content = content.replace(targetSpot, replacement);
  }

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Updated ${filePath}`);
});
