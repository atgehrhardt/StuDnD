const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=== Debug Build Information ===');

// Check if dist directory exists and its contents
const distPath = path.join(__dirname, '..', 'dist');
console.log(`\nChecking dist directory: ${distPath}`);
if (fs.existsSync(distPath)) {
  console.log('dist directory exists');
  const distFiles = fs.readdirSync(distPath);
  console.log('Files in dist directory:', distFiles);
  
  // Check bundle.js and bundle.css
  const bundleJsPath = path.join(distPath, 'bundle.js');
  const bundleCssPath = path.join(distPath, 'bundle.css');
  const indexHtmlPath = path.join(distPath, 'index.html');
  
  console.log('\nBundle Files:');
  if (fs.existsSync(bundleJsPath)) {
    const bundleJsStats = fs.statSync(bundleJsPath);
    console.log(`bundle.js: ${(bundleJsStats.size / 1024).toFixed(2)} KB`);
  } else {
    console.log('bundle.js does not exist!');
  }
  
  if (fs.existsSync(bundleCssPath)) {
    const bundleCssStats = fs.statSync(bundleCssPath);
    console.log(`bundle.css: ${(bundleCssStats.size / 1024).toFixed(2)} KB`);
  } else {
    console.log('bundle.css does not exist!');
  }
  
  if (fs.existsSync(indexHtmlPath)) {
    console.log('index.html exists');
    const indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf8');
    console.log('\nChecking index.html content:');
    
    // Check for bundle references
    const hasBundleJs = indexHtmlContent.includes('bundle.js');
    const hasBundleCss = indexHtmlContent.includes('bundle.css');
    
    console.log(`References bundle.js: ${hasBundleJs}`);
    console.log(`References bundle.css: ${hasBundleCss}`);
    
    // Check content security policy
    const cspMatch = indexHtmlContent.match(/<meta http-equiv="Content-Security-Policy"[^>]*>/);
    if (cspMatch) {
      console.log('\nContent Security Policy:');
      console.log(cspMatch[0]);
    } else {
      console.log('No Content Security Policy found in index.html');
    }
  } else {
    console.log('index.html does not exist!');
  }
} else {
  console.log('dist directory does not exist!');
}

// Check electron-builder configuration
console.log('\nElectron-builder configuration:');
try {
  const packageJson = require('../package.json');
  console.log('Build config from package.json:', JSON.stringify(packageJson.build, null, 2));
  
  // Check electron-builder.json if it exists
  const ebPath = path.join(__dirname, '..', 'electron-builder.json');
  if (fs.existsSync(ebPath)) {
    const ebConfig = require(ebPath);
    console.log('electron-builder.json config:', JSON.stringify(ebConfig, null, 2));
  } else {
    console.log('electron-builder.json does not exist');
  }
} catch (err) {
  console.error('Error reading configuration:', err.message);
}

// Check if icons exist
console.log('\nChecking icon files:');
const iconPaths = [
  path.join(__dirname, 'icons', 'mac', 'icon.icns'),
  path.join(__dirname, 'icons', 'win', 'icon.ico'),
  path.join(__dirname, 'icons', 'linux', '512x512.png')
];

iconPaths.forEach(iconPath => {
  if (fs.existsSync(iconPath)) {
    console.log(`${iconPath}: exists`);
  } else {
    console.log(`${iconPath}: does not exist!`);
  }
});

console.log('\n=== End Debug Information ===');