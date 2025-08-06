const fs = require('fs');
const path = require('path');

const glob = require('glob');

// Regex to match formatMessage({ id: '...', default: '...' })
const MESSAGE_REGEX = /formatMessage\(\s*{\s*id:\s*['"]([^'"]+)['"]\s*,\s*default:\s*['"]([^'"]+)['"]\s*}\s*\)/g;

// Output translation object
const translations = {};

// Search in these folders
const inputGlobs = [
  'src/vm/**/*.{js,jsx}'
];

// Process files
for (const pattern of inputGlobs) {
  const files = glob.sync(pattern, { nodir: true });

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    let match;
    while ((match = MESSAGE_REGEX.exec(content)) !== null) {
      // eslint-disable-next-line no-unused-vars
      const [_, id, defaultText] = match;
      if (!translations[id]) {
        translations[id] = defaultText;
      }
    }
  }
}

// Output path
const outputPath = path.join('src/vm/extensions/block/translations', 'en.json');
fs.writeFileSync(outputPath, JSON.stringify(translations, null, 2));
console.log(`✅ Extracted ${Object.keys(translations).length} messages to ${outputPath}`);
