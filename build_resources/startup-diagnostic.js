// This script checks the application's file structure at startup
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

function runDiagnostic() {
  const report = {
    appInfo: {
      name: app.getName(),
      version: app.getVersion(),
      appPath: app.getAppPath(),
      isPackaged: app.isPackaged,
      paths: {
        home: app.getPath('home'),
        appData: app.getPath('appData'),
        userData: app.getPath('userData'),
        temp: app.getPath('temp'),
        exe: app.getPath('exe'),
        module: app.getPath('module')
      }
    },
    fileStructure: {},
    moduleVersions: {
      node: process.versions.node,
      chrome: process.versions.chrome,
      electron: process.versions.electron
    }
  };

  // Check key directories
  const directories = [
    app.getAppPath(),
    path.join(app.getAppPath(), 'dist'),
    path.join(app.getAppPath(), 'build_resources')
  ];

  directories.forEach(dir => {
    try {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        report.fileStructure[dir] = files;
      } else {
        report.fileStructure[dir] = 'DIRECTORY_NOT_FOUND';
      }
    } catch (err) {
      report.fileStructure[dir] = `ERROR: ${err.message}`;
    }
  });

  // Check key files
  const files = [
    path.join(app.getAppPath(), 'package.json'),
    path.join(app.getAppPath(), 'main.js'),
    path.join(app.getAppPath(), 'preload.js'),
    path.join(app.getAppPath(), 'dist', 'index.html'),
    path.join(app.getAppPath(), 'dist', 'bundle.js'),
    path.join(app.getAppPath(), 'dist', 'test-bundle.js')
  ];

  report.fileStructure.keyFiles = {};
  files.forEach(file => {
    try {
      if (fs.existsSync(file)) {
        const stats = fs.statSync(file);
        report.fileStructure.keyFiles[file] = {
          size: stats.size,
          mtime: stats.mtime
        };
      } else {
        report.fileStructure.keyFiles[file] = 'FILE_NOT_FOUND';
      }
    } catch (err) {
      report.fileStructure.keyFiles[file] = `ERROR: ${err.message}`;
    }
  });

  // Format the report
  const reportStr = JSON.stringify(report, null, 2);
  console.log('=== Application Startup Diagnostic ===');
  console.log(reportStr);
  console.log('=== End Diagnostic ===');

  // Write report to log file in userData directory
  try {
    const logDir = path.join(app.getPath('userData'), 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    const logFile = path.join(logDir, `diagnostic-${Date.now()}.json`);
    fs.writeFileSync(logFile, reportStr);
    console.log(`Diagnostic report written to: ${logFile}`);
  } catch (err) {
    console.error('Error writing diagnostic report:', err);
  }

  return report;
}

module.exports = { runDiagnostic };