#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Get the platform from the command line arguments
const platform = process.argv[2];

if (!platform) {
  console.error('Error: Platform name is required. Usage: node organize-platform.js [platform-name]');
  process.exit(1);
}

console.log(`Organizing platform: ${platform}`);

// Define directory paths
const sourceDir = path.join(__dirname, '..', 'dist-electron', platform);
const releasesDir = path.join(__dirname, '..', 'dist-releases');

// Determine target directory based on platform
let targetDir;
if (platform.includes('mac')) {
  targetDir = path.join(releasesDir, 'macos');
} else if (platform.includes('win')) {
  targetDir = path.join(releasesDir, 'windows');
} else if (platform.includes('linux')) {
  targetDir = path.join(releasesDir, 'linux');
} else {
  // Default to a platform-specific directory
  targetDir = path.join(releasesDir, platform);
}

// Create target directory if it doesn't exist
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
  console.log(`Created directory: ${targetDir}`);
}

// Ensure source directory exists
if (!fs.existsSync(sourceDir)) {
  console.error(`Error: Source directory ${sourceDir} does not exist`);
  process.exit(1);
}

// Move files from source to target
let filesMoved = 0;
try {
  const files = fs.readdirSync(sourceDir);
  
  files.forEach(file => {
    const filePath = path.join(sourceDir, file);
    
    // Skip directories
    if (fs.statSync(filePath).isDirectory()) {
      console.log(`Skipping directory: ${file}`);
      return;
    }
    
    const targetPath = path.join(targetDir, file);
    try {
      fs.copyFileSync(filePath, targetPath);
      filesMoved++;
      console.log(`Copied: ${file} -> ${targetPath}`);
    } catch (err) {
      console.error(`Error copying file ${file}: ${err.message}`);
    }
  });
  
  console.log(`\nSuccessfully moved ${filesMoved} files from ${platform} build to ${targetDir}`);
} catch (err) {
  console.error(`Error processing ${platform} builds: ${err.message}`);
  process.exit(1);
}