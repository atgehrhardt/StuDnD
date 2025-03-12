// This script is used in the compiled app to verify that the preload script is being loaded correctly
const fs = require('fs');
const path = require('path');

// Write to a log file that can be checked for debugging
const logFile = path.join(__dirname, 'preload-check.log');

try {
  // Get some diagnostics
  const processVersions = process.versions;
  const nodeVersion = process.version;
  const electronVersion = processVersions.electron || 'unknown';
  const chromeVersion = processVersions.chrome || 'unknown';
  
  // Collect paths
  const appPath = process.env.APP_PATH || 'unknown';
  const resourcesPath = process.resourcesPath || 'unknown';
  const appDataPath = process.env.APPDATA || process.env.HOME || 'unknown';
  
  // Log the diagnostics
  const log = `
Preload check ran at: ${new Date().toISOString()}
Node version: ${nodeVersion}
Electron version: ${electronVersion}
Chrome version: ${chromeVersion}
App path: ${appPath}
Resources path: ${resourcesPath}
App data path: ${appDataPath}
  `;
  
  fs.writeFileSync(logFile, log);
  
  console.log('Preload check completed successfully');
} catch (error) {
  // If we can't write to the log file, try to log to the console
  console.error('Error in preload-check.js:', error);
  
  try {
    fs.writeFileSync(logFile, `Error in preload-check.js: ${error.message}`);
  } catch (e) {
    console.error('Could not write to log file:', e);
  }
}