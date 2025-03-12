#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Directory paths
const sourceDir = path.join(__dirname, '..', 'dist-electron');
const releasesDir = path.join(__dirname, '..', 'dist-releases');

// Create platform directories
const macosDir = path.join(releasesDir, 'macos');
const windowsDir = path.join(releasesDir, 'windows');
const linuxDir = path.join(releasesDir, 'linux');

// Create directories if they don't exist
[releasesDir, macosDir, windowsDir, linuxDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Get all files in the source directory
const files = fs.readdirSync(sourceDir);

// Move files to appropriate directories based on extension
let filesMoved = 0;

files.forEach(file => {
  const filePath = path.join(sourceDir, file);
  
  // Skip directories
  if (fs.statSync(filePath).isDirectory()) {
    return;
  }
  
  let targetDir = null;
  const ext = path.extname(file).toLowerCase();
  
  // Determine target directory based on file extension
  if (ext === '.dmg' || file.includes('mac') || file.includes('darwin')) {
    targetDir = macosDir;
  } else if (ext === '.exe' || ext === '.msi' || file.includes('win')) {
    targetDir = windowsDir;
  } else if (ext === '.appimage' || ext === '.deb' || ext === '.rpm' || ext === '.snap' || file.includes('linux')) {
    targetDir = linuxDir;
  }
  
  // Copy the file if target directory was determined
  if (targetDir) {
    const targetPath = path.join(targetDir, file);
    fs.copyFileSync(filePath, targetPath);
    filesMoved++;
    console.log(`Copied: ${file} -> ${targetPath}`);
  }
});

console.log(`\nOrganized ${filesMoved} files into platform-specific directories:`);
console.log(`- macOS: ${macosDir}`);
console.log(`- Windows: ${windowsDir}`);
console.log(`- Linux: ${linuxDir}`);