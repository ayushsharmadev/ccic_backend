const fs = require('fs');
const path = require('path');

function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (!['public', 'auth', 'test-jwt'].includes(file)) {
        findFiles(filePath, fileList);
      }
    } else if (file === 'route.js' || file === 'route.ts') {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const apiDir = path.join(process.cwd(), 'app', 'api');
const files = findFiles(apiDir);
console.log('Total API route files to check (excluding public/auth):', files.length);

let modifiedCount = 0;

for (const filePath of files) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  if (!/export\s+async\s+function\s+GET\s*\(/.test(content)) continue;

  // Ensure withAdminAuth is imported
  if (!content.includes('withAdminAuth')) {
    const importRegex = /import\s+.*?;?\n/g;
    let match;
    let lastMatch = null;
    while ((match = importRegex.exec(content)) !== null) {
      lastMatch = match;
    }
    
    if (lastMatch) {
      const lastIndex = lastMatch.index + lastMatch[0].length;
      content = content.slice(0, lastIndex) + 'import { withAdminAuth } from "@/lib/middleware/auth";\n' + content.slice(lastIndex);
    } else {
      content = 'import { withAdminAuth } from "@/lib/middleware/auth";\n' + content;
    }
  }

  // Find and replace the GET function definition
  const getRegex = /export\s+async\s+function\s+GET\s*\(([^)]*)\)\s*\{/g;
  let matchRegex;
  let matches = [];
  while ((matchRegex = getRegex.exec(content)) !== null) {
    matches.push(matchRegex);
  }
  
  // We process matches in reverse order so the indices don't change!
  for (let i = matches.length - 1; i >= 0; i--) {
    const match = matches[i];
    const startIndex = match.index;
    const blockStartIndex = startIndex + match[0].length - 1;
    let depth = 0;
    let endIndex = -1;
    
    for (let j = blockStartIndex; j < content.length; j++) {
      if (content[j] === '{') depth++;
      else if (content[j] === '}') depth--;
      
      if (depth === 0) {
        endIndex = j;
        break;
      }
    }
    
    if (endIndex !== -1) {
      const params = match[1];
      const newHeader = `export const GET = withAdminAuth(async (${params}) => {`;
      
      content = content.substring(0, startIndex) +
                newHeader +
                content.substring(blockStartIndex + 1, endIndex) +
                '});' +
                content.substring(endIndex + 1);
    }
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed:', path.relative(process.cwd(), filePath));
    modifiedCount++;
  }
}

console.log(`\nOperation completed. Modified ${modifiedCount} files.`);
