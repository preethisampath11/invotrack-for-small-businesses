const fs = require('fs');

function replaceInFile(filepath, replacements) {
  let content = fs.readFileSync(filepath, 'utf-8');
  
  if (!content.includes('useTheme')) {
    if (content.includes("import { useAuth } from '../context/AuthContext';")) {
        content = content.replace("import { useAuth } from '../context/AuthContext';", "import { useAuth } from '../context/AuthContext';\nimport { useTheme } from '../context/ThemeContext';");
    } else {
        content = content.replace(/import \{.*\} from 'react';/, match => match + "\nimport { useTheme } from '../context/ThemeContext';");
    }
    // inject hook
    content = content.replace(/const \w+ = \(\) => \{/, match => match + "\n  const { theme } = useTheme();");
  }

  replacements.forEach(([regex, replacement]) => {
    content = content.replace(regex, replacement);
  });
  fs.writeFileSync(filepath, content, 'utf-8');
}

// 1. InvoicesPage.jsx
replaceInFile('client/src/pages/InvoicesPage.jsx', [
  [/'#64748b'/g, "theme === 'dark' ? '#94a3b8' : '#64748b'"],
  [/'#475569'/g, "theme === 'dark' ? '#cbd5e1' : '#475569'"],
  [/'#16a34a'/g, "theme === 'dark' ? '#4ade80' : '#16a34a'"],
  [/'#ef4444'/g, "theme === 'dark' ? '#f87171' : '#ef4444'"],
  [/'#22c55e'/g, "theme === 'dark' ? '#4ade80' : '#22c55e'"],
  [/'#94a3b8'/g, "theme === 'dark' ? '#cbd5e1' : '#94a3b8'"], // also lighten 400 to 300 for some borders/texts
  [/style=\{\{ background: '#3b82f6' \}\}/g, '']
]);

// 2. SettingsPage.jsx
replaceInFile('client/src/pages/SettingsPage.jsx', [
  [/'#64748b'/g, "theme === 'dark' ? '#94a3b8' : '#64748b'"],
  [/'#475569'/g, "theme === 'dark' ? '#cbd5e1' : '#475569'"],
  [/'#dc2626'/g, "theme === 'dark' ? '#ef4444' : '#dc2626'"],
  [/'#94a3b8'/g, "theme === 'dark' ? '#cbd5e1' : '#94a3b8'"],
  [/style=\{\{ color: '#0f172a' \}\}/g, "style={{ color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}"],
  [/style=\{\{ background: '#16a34a' \}\}/g, ''], 
  [/accentColor: '#16a34a'/g, "accentColor: theme === 'dark' ? '#4ade80' : '#16a34a'"],
  [/style=\{\{ color: '#16a34a', borderColor: '#bbf7d0', background: '#f0fdf4' \}\}/g, "style={{ color: theme === 'dark' ? '#4ade80' : '#16a34a', borderColor: theme === 'dark' ? '#059669' : '#bbf7d0', background: theme === 'dark' ? '#064e3b' : '#f0fdf4' }}"]
]);

// 3. ProfilePage.jsx
replaceInFile('client/src/pages/ProfilePage.jsx', [
  [/'#64748b'/g, "theme === 'dark' ? '#94a3b8' : '#64748b'"]
]);

// 4. PaymentsPage.jsx
replaceInFile('client/src/pages/PaymentsPage.jsx', [
  [/'#64748b'/g, "theme === 'dark' ? '#94a3b8' : '#64748b'"],
  [/'#94a3b8'/g, "theme === 'dark' ? '#cbd5e1' : '#94a3b8'"]
]);

// 5. StaffPage.jsx
replaceInFile('client/src/pages/StaffPage.jsx', [
  [/'#64748b'/g, "theme === 'dark' ? '#94a3b8' : '#64748b'"],
  [/'#94a3b8'/g, "theme === 'dark' ? '#cbd5e1' : '#94a3b8'"]
]);

console.log("Done");
