#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Directory paths
const electronDir = path.join(__dirname, '..', 'dist-electron');
const releasesDir = path.join(__dirname, '..', 'dist-releases');

// Check if platform-specific folders exist in dist-electron
const platformFolders = ['mac', 'win', 'win-portable', 'linux', 'linux-appimage', 'linux-deb'];
let hasPlatformFolders = false;

for (const folder of platformFolders) {
  const folderPath = path.join(electronDir, folder);
  if (fs.existsSync(folderPath)) {
    hasPlatformFolders = true;
    break;
  }
}

// We'll use this to determine how to process files

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

// Function to process a directory and move files
function processDirectory(dirPath) {
  // If the directory doesn't exist, skip it
  if (!fs.existsSync(dirPath)) {
    return 0;
  }

  // Get all files in the directory
  const files = fs.readdirSync(dirPath);
  let filesMoved = 0;

  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    
    // Skip directories within this directory (recursive option if needed)
    if (fs.statSync(filePath).isDirectory()) {
      // Skip for now - could add recursion if needed
      return;
    }
    
    let targetDir = null;
    const ext = path.extname(file).toLowerCase();
    
    // Determine target directory based on file extension and naming
    if (ext === '.dmg' || file.toLowerCase().includes('mac') || file.includes('darwin')) {
      targetDir = macosDir;
    } else if (ext === '.exe' || ext === '.msi' || file.toLowerCase().includes('win')) {
      targetDir = windowsDir;
    } else if (ext === '.appimage' || ext === '.deb' || ext === '.rpm' || ext === '.snap' || file.toLowerCase().includes('linux')) {
      targetDir = linuxDir;
    }
    
    // Copy the file if target directory was determined
    if (targetDir) {
      const targetPath = path.join(targetDir, file);
      try {
        fs.copyFileSync(filePath, targetPath);
        filesMoved++;
        console.log(`Copied: ${file} -> ${targetPath}`);
      } catch (err) {
        console.error(`Error copying file ${file}: ${err.message}`);
      }
    } else {
      console.log(`Skipping file with unknown type: ${file}`);
    }
  });
  
  return filesMoved;
}

// Total files moved counter
let totalFilesMoved = 0;

// If platform-specific folders exist, process each one
if (hasPlatformFolders) {
  console.log("Processing platform-specific output folders...");
  platformFolders.forEach(folder => {
    const folderPath = path.join(electronDir, folder);
    if (fs.existsSync(folderPath)) {
      console.log(`Processing ${folder} folder...`);
      const moved = processDirectory(folderPath);
      totalFilesMoved += moved;
      console.log(`- Moved ${moved} files from ${folder}`);
    }
  });
} else {
  // Process the main electron directory if no platform folders
  console.log("Processing main dist-electron folder...");
  totalFilesMoved = processDirectory(electronDir);
}

console.log(`\nOrganized ${totalFilesMoved} files into platform-specific directories:`);
console.log(`- macOS: ${macosDir}`);
console.log(`- Windows: ${windowsDir}`);
console.log(`- Linux: ${linuxDir}`);