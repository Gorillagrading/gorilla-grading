const fs = require('fs');
const path = require('path');

const directory = path.resolve(__dirname, '..', 'src');

const reverseMappings = [
  // Backgrounds
  { regex: /bg-theme-bg/g, replacement: 'bg-[#14170F]' },
  { regex: /bg-theme-panel/g, replacement: 'bg-black/20' },
  
  // Texts
  { regex: /text-theme-text/g, replacement: 'text-white' },
  { regex: /text-theme-muted/g, replacement: 'text-[#A4ACA1]' },

  // Borders
  { regex: /border-theme-border/g, replacement: 'border-white/[0.05]' },

  // Greens
  { regex: /text-theme-green/g, replacement: 'text-[#48C765]' },
  { regex: /bg-theme-green/g, replacement: 'bg-[#48C765]' },
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
      for (const mapping of reverseMappings) {
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
console.log('Reverse Migration complete');
