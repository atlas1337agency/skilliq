const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./src');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content
    .replace(/\bpl-/g, 'ps-')
    .replace(/\bpr-/g, 'pe-')
    .replace(/\bml-/g, 'ms-')
    .replace(/\bmr-/g, 'me-')
    .replace(/\btext-left\b/g, 'text-start')
    .replace(/\btext-right\b/g, 'text-end')
    .replace(/\bborder-l\b/g, 'border-s')
    .replace(/\bborder-r\b/g, 'border-e')
    .replace(/\bborder-l-/g, 'border-s-')
    .replace(/\bborder-r-/g, 'border-e-')
    .replace(/\brounded-l\b/g, 'rounded-s')
    .replace(/\brounded-r\b/g, 'rounded-e')
    .replace(/\brounded-l-/g, 'rounded-s-')
    .replace(/\brounded-r-/g, 'rounded-e-')
    .replace(/\bleft-/g, 'start-')
    .replace(/\bright-/g, 'end-');
  
  // Some exceptions that might break if replaced naively
  // e.g. if we had "start-0" replaced from "left-0", but it might be inside a relative path? No, CSS classes.
  // We'll trust the simple regex since it's just CSS classes.
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`Updated ${file}`);
  }
});
