const fs = require('fs');

function replaceInFile(filepath, replacements) {
  let content = fs.readFileSync(filepath, 'utf-8');
  
  if (!content.includes('useTheme')) {
    if (content.includes("import { useAuth }")) {
        content = content.replace(/(import \{.*?\} from '\.\.\/context\/AuthContext';)/, "$1\nimport { useTheme } from '../context/ThemeContext';");
    } else {
        content = content.replace(/(import \{.*?\} from 'react';)/, "$1\nimport { useTheme } from '../context/ThemeContext';");
    }
    content = content.replace(/const \w+ = \(\) => \{/, match => match + "\n  const { theme } = useTheme();");
  }

  replacements.forEach(([regex, replacement]) => {
    content = content.replace(regex, replacement);
  });
  fs.writeFileSync(filepath, content, 'utf-8');
}

// 1. AuthPage.jsx (Does not use useTheme currently, but we can add it, OR since AuthPage handles login/signup it might use theme)
// Wait, AuthPage is fine, mostly it uses #fff, #818cf8, #6366f1 which is the indigo theme! We don't need to change #fff or indigo colors!
// But we should change #64748b, #94a3b8, #e2e8f0.
replaceInFile('client/src/pages/AuthPage.jsx', [
  [/'#64748b'/g, "theme === 'dark' ? '#94a3b8' : '#64748b'"],
  [/'#94a3b8'/g, "theme === 'dark' ? '#cbd5e1' : '#94a3b8'"],
  [/'#e2e8f0'/g, "theme === 'dark' ? '#334155' : '#e2e8f0'"],
  [/'#475569'/g, "theme === 'dark' ? '#cbd5e1' : '#475569'"]
]);

// 2. ClientsPage.jsx
replaceInFile('client/src/pages/ClientsPage.jsx', [
  [/'#64748b'/g, "theme === 'dark' ? '#94a3b8' : '#64748b'"],
  [/'#94a3b8'/g, "theme === 'dark' ? '#cbd5e1' : '#94a3b8'"],
  [/'#475569'/g, "theme === 'dark' ? '#cbd5e1' : '#475569'"],
  [/'#ef4444'/g, "theme === 'dark' ? '#f87171' : '#ef4444'"],
  [/'#22c55e'/g, "theme === 'dark' ? '#4ade80' : '#22c55e'"]
]);

// 3. Dashboard.jsx
replaceInFile('client/src/pages/Dashboard.jsx', [
  [/'#64748b'/g, "theme === 'dark' ? '#94a3b8' : '#64748b'"],
  [/'#94a3b8'/g, "theme === 'dark' ? '#cbd5e1' : '#94a3b8'"],
  [/'#0f172a'/g, "theme === 'dark' ? '#f8fafc' : '#0f172a'"],
  [/'#e2e8f0'/g, "theme === 'dark' ? '#334155' : '#e2e8f0'"]
]);

// 4. InventoryPage.jsx
replaceInFile('client/src/pages/InventoryPage.jsx', [
  [/'#64748b'/g, "theme === 'dark' ? '#94a3b8' : '#64748b'"],
  [/'#94a3b8'/g, "theme === 'dark' ? '#cbd5e1' : '#94a3b8'"],
  [/'#475569'/g, "theme === 'dark' ? '#cbd5e1' : '#475569'"],
  [/'#ef4444'/g, "theme === 'dark' ? '#f87171' : '#ef4444'"]
]);

// 5. PaymentsPage.jsx
replaceInFile('client/src/pages/PaymentsPage.jsx', [
  [/'#ef4444'/g, "theme === 'dark' ? '#f87171' : '#ef4444'"]
]);

// 6. ProfilePage.jsx
replaceInFile('client/src/pages/ProfilePage.jsx', [
  [/'#16a34a'/g, "theme === 'dark' ? '#4ade80' : '#16a34a'"]
]);

console.log('done');
