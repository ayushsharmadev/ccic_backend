const fs = require('fs');

function removeLines(file, start, end) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  const newLines = [...lines.slice(0, start - 1), ...lines.slice(end - 1)];
  fs.writeFileSync(file, newLines.join('\n'), 'utf8');
  console.log('Processed', file);
}

removeLines('D:\\work\\ccic_backend\\app\\admin\\country\\add\\page.jsx', 438, 646);
removeLines('D:\\work\\ccic_backend\\app\\admin\\country\\edit\\[id]\\page.jsx', 578, 786);
