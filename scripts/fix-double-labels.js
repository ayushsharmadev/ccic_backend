const fs = require('fs');

function fixLabels(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/<label className=\{labelClassName\}>Country Logo<\/label>\s*/g, '');
  content = content.replace(/<label className=\{labelClassName\}>Country Banner<\/label>\s*/g, '');
  content = content.replace(/<label className=\{labelClassName\}>Country Brochure<\/label>\s*/g, '');
  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed labels in', file);
}

fixLabels('D:\\work\\ccic_backend\\app\\admin\\country\\add\\page.jsx');
fixLabels('D:\\work\\ccic_backend\\app\\admin\\country\\edit\\[id]\\page.jsx');
