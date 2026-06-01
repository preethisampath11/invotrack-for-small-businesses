const fs = require('fs');
const path = require('path');
const dir = 'client/src/pages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));
let issues = [];
files.forEach(f => {
  const content = fs.readFileSync(path.join(dir, f), 'utf-8');
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    if (line.match(/(color|background|border|backgroundColor|borderColor):\s*['"]#[0-9a-fA-F]{3,6}['"]/i)) {
      if (!line.includes('theme ===')) {
        issues.push(f + ':' + (i+1) + ' => ' + line.trim());
      }
    }
  });
});
console.log(issues.join('\n'));
