const fs = require('fs');
const path = require('path');

const baseSourceDir = path.join(__dirname, 'app', 'admin', 'college', 'sections', '[collegeId]');
const baseDestDir = path.join(__dirname, 'app', 'admin', 'country', 'sections', '[countryId]');

// Ensure dest dirs exist
fs.mkdirSync(baseDestDir, { recursive: true });
fs.mkdirSync(path.join(baseDestDir, 'add'), { recursive: true });
fs.mkdirSync(path.join(baseDestDir, 'edit', '[sectionId]'), { recursive: true });

function replaceContent(content) {
  let newContent = content.replace(/collegeId/g, 'countryId');
  newContent = newContent.replace(/collegeName/g, 'countryName');
  newContent = newContent.replace(/setCollegeName/g, 'setCountryName');
  newContent = newContent.replace(/\/api\/colleges\//g, '/api/countries/');
  newContent = newContent.replace(/\/api\/facility-sections/g, '/api/country-sections');
  newContent = newContent.replace(/\/admin\/college\/sections/g, '/admin/country/sections');
  newContent = newContent.replace(/CollegeSectionsPage/g, 'CountrySectionsPage');
  newContent = newContent.replace(/College/g, 'Country');
  newContent = newContent.replace(/college/g, 'country');
  return newContent;
}

// 1. page.jsx
let listContent = fs.readFileSync(path.join(baseSourceDir, 'page.jsx'), 'utf-8');
fs.writeFileSync(path.join(baseDestDir, 'page.jsx'), replaceContent(listContent));

// 2. add/page.jsx
let addContent = fs.readFileSync(path.join(baseSourceDir, 'add', 'page.jsx'), 'utf-8');
fs.writeFileSync(path.join(baseDestDir, 'add', 'page.jsx'), replaceContent(addContent));

// 3. edit/[sectionId]/page.jsx
let editContent = fs.readFileSync(path.join(baseSourceDir, 'edit', '[sectionId]', 'page.jsx'), 'utf-8');
fs.writeFileSync(path.join(baseDestDir, 'edit', '[sectionId]', 'page.jsx'), replaceContent(editContent));

console.log("Pages created successfully!");
