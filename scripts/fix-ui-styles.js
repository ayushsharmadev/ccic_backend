const fs = require('fs');

const verifiedCheckbox = `
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
`;

function fixUI(file) {
  let content = fs.readFileSync(file, 'utf8');

  // Fix + Add Section / + Add FAQ buttons
  content = content.replace(
    /className="text-sm bg-primary\/10 text-primary px-4 py-2 rounded hover:bg-primary\/20 transition-colors">\+ Add Section/g,
    'className="bg-primary text-white px-4 py-2 text-sm rounded hover:bg-primary-700 transition-colors shadow-sm">+ Add Section'
  );
  content = content.replace(
    /className="text-sm bg-primary\/10 text-primary px-4 py-2 rounded hover:bg-primary\/20 transition-colors">\+ Add FAQ/g,
    'className="bg-primary text-white px-4 py-2 text-sm rounded hover:bg-primary-700 transition-colors shadow-sm">+ Add FAQ'
  );

  // Fix FAQ Remove button
  content = content.replace(
    /className="text-red-500 hover:text-red-700 p-1">✕/g,
    'className="shrink-0 text-xs bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded transition-colors dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40">Remove'
  );

  // Inject Verified Checkbox
  if (!content.includes('name="verified"')) {
    content = content.replace(
      /<label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-white\/80 cursor-pointer">\s*<input\s*type="checkbox"\s*name="isPopular"/,
      verifiedCheckbox + '              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-white/80 cursor-pointer">\n                <input\n                  type="checkbox"\n                  name="isPopular"'
    );
  }

  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed UI in', file);
}

fixUI('D:\\work\\ccic_backend\\app\\admin\\country\\add\\page.jsx');
fixUI('D:\\work\\ccic_backend\\app\\admin\\country\\edit\\[id]\\page.jsx');
