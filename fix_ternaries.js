const fs = require('fs');
const path = require('path');
const dir = 'client/src/pages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));
files.forEach(f => {
  const filepath = path.join(dir, f);
  let content = fs.readFileSync(filepath, 'utf-8');
  // Match: theme === 'dark' ? theme === 'dark' ? '#color1' : '#color2' : '#color3'
  // We want to simplify it to: theme === 'dark' ? '#color1' : '#color3'
  content = content.replace(/theme === 'dark' \? theme === 'dark' \? '([^']+)' : '([^']+)' : '([^']+)'/g, "theme === 'dark' ? '$1' : '$3'");
  fs.writeFileSync(filepath, content, 'utf-8');
});
console.log('Fixed double ternaries.');
