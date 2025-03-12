const fs = require('fs');
const path = require('path');

// List of files to check
const files = [
  { path: 'dist/bundle.js', description: 'Main Svelte application bundle' },
  { path: 'dist/bundle.css', description: 'CSS bundle' },
  { path: 'dist/index.html', description: 'HTML entry point' },
  { path: 'build_resources/icons/mac/icon.icns', description: 'macOS icon' },
  { path: 'build_resources/icons/win/icon.ico', description: 'Windows icon' },
  { path: 'build_resources/error.html', description: 'Error page' }
];

console.log('=== Bundle Check ===');
console.log('Checking required files before build:\n');

let allFilesExist = true;

files.forEach(file => {
  const fullPath = path.join(__dirname, '..', file.path);
  const exists = fs.existsSync(fullPath);
  
  if (exists) {
    const stats = fs.statSync(fullPath);
    const size = (stats.size / 1024).toFixed(2);
    console.log(`✅ ${file.path} (${file.description}): ${size} KB`);
    
    // For critical files, perform additional checks
    if (file.path === 'dist/bundle.js') {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        const hasApp = content.includes('new App(');
        const hasSvelte = content.includes('svelte');
        console.log(`   - Contains App reference: ${hasApp ? '✅' : '❌'}`);
        console.log(`   - Contains Svelte reference: ${hasSvelte ? '✅' : '❌'}`);
      } catch (err) {
        console.log(`   - Error reading bundle: ${err.message}`);
      }
    }
    
    if (file.path === 'dist/index.html') {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        const hasBundle = content.includes('bundle.js');
        const hasCss = content.includes('bundle.css');
        console.log(`   - References bundle.js: ${hasBundle ? '✅' : '❌'}`);
        console.log(`   - References bundle.css: ${hasCss ? '✅' : '❌'}`);
      } catch (err) {
        console.log(`   - Error reading index.html: ${err.message}`);
      }
    }
  } else {
    console.log(`❌ ${file.path} (${file.description}): MISSING`);
    allFilesExist = false;
  }
});

console.log('\n=== Summary ===');
if (allFilesExist) {
  console.log('All required files exist! ✅');
} else {
  console.log('Some required files are missing! ❌');
  console.log('Please run the build process or check for errors.');
}

// Return success or failure code
process.exit(allFilesExist ? 0 : 1);