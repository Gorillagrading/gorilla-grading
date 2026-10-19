const fs = require('fs');
const path = require('path');

const directory = path.resolve(__dirname, '..', 'src');

const mappings = [
  // Backgrounds
  { regex: /bg-\[#111311\]/g, replacement: 'bg-theme-bg' },
  { regex: /bg-\[#14170F\]/g, replacement: 'bg-theme-bg' },
  { regex: /bg-\[#121814\]/g, replacement: 'bg-theme-bg' },
  { regex: /bg-\[#161B16\]/g, replacement: 'bg-theme-bg' },
  { regex: /bg-\[#454545\]/g, replacement: 'bg-theme-bg' },
  
  // Panel Backgrounds
  { regex: /bg-\[#2B302B\]/g, replacement: 'bg-theme-panel' },
  { regex: /bg-black\/20/g, replacement: 'bg-theme-panel' },
  { regex: /bg-black\/30/g, replacement: 'bg-theme-panel' },
  { regex: /bg-black\/40/g, replacement: 'bg-theme-panel' },
  { regex: /bg-white\/\[0\.02\]/g, replacement: 'bg-theme-panel' },
  { regex: /bg-white\/\[0\.05\]/g, replacement: 'bg-theme-panel' },
  
  // Texts
  { regex: /text-white/g, replacement: 'text-theme-text' },
  { regex: /text-\[#F0F1F2\]/g, replacement: 'text-theme-text' },
  { regex: /text-\[#A4ACA1\]/g, replacement: 'text-theme-muted' },
  { regex: /text-\[#5A6357\]/g, replacement: 'text-theme-muted' },
  { regex: /text-white\/50/g, replacement: 'text-theme-muted' },

  // Borders
  { regex: /border-white\/10/g, replacement: 'border-theme-border' },
  { regex: /border-white\/20/g, replacement: 'border-theme-border' },
  { regex: /border-white\/5/g, replacement: 'border-theme-border' },
  { regex: /border-white\/\[0\.05\]/g, replacement: 'border-theme-border' },
  { regex: /border-white\/\[0\.06\]/g, replacement: 'border-theme-border' },
  { regex: /border-white\/\[0\.07\]/g, replacement: 'border-theme-border' },
  { regex: /border-white\/\[0\.1\]/g, replacement: 'border-theme-border' },

  // Greens
  { regex: /text-\[#48C765\]/g, replacement: 'text-theme-green' },
  { regex: /text-\[#61B663\]/g, replacement: 'text-theme-green' },
  { regex: /bg-\[#48C765\]/g, replacement: 'bg-theme-green' },
  { regex: /bg-\[#61B663\]/g, replacement: 'bg-theme-green' },
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let original = content;
      for (const mapping of mappings) {
        content = content.replace(mapping.regex, mapping.replacement);
      }
      if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory(directory);
console.log('Migration complete');
