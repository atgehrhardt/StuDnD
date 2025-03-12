const { app, BrowserWindow, ipcMain, dialog, session } = require('electron');
const path = require('path');
const Store = require('electron-store');
const fs = require('fs');

// In development mode, we'd want live reload, but we'll skip for now
// as it's causing issues
if (process.env.ELECTRON_DEV) {
  console.log('Running in development mode');
}

// Generate a device-specific encryption key (more secure than a hardcoded string)
function getEncryptionKey() {
  try {
    // Use machine-specific information for the key
    const machineId = require('node-machine-id').machineIdSync();
    const crypto = require('crypto');
    // Create a deterministic but machine-specific encryption key
    return crypto.createHash('sha256')
      .update(`dnd-companion-${machineId}-${app.getName()}`)
      .digest('hex').substring(0, 32); // Use first 32 chars (electron-store requirement)
  } catch (error) {
    console.error('Error generating encryption key, falling back to default:', error);
    // Fallback to a default key if machine ID fails
    return 'dnd-learning-companion-secure-key-fallback';
  }
}

// Initialize a simple store for settings (basic version)
let store;

// This function will be called when we need to access the store
function getStore() {
  if (!store) {
    try {
      // Try to delete corrupted config file if it exists
      try {
        const appDataPath = app.getPath('userData');
        const configPath = path.join(appDataPath, 'config.json');
        
        if (fs.existsSync(configPath)) {
          try {
            // Test if it's valid JSON
            const content = fs.readFileSync(configPath, 'utf8');
            JSON.parse(content);
          } catch (e) {
            // Invalid JSON - backup and remove
            console.log('Found invalid config file, creating backup');
            fs.renameSync(configPath, configPath + '.bak.' + Date.now());
          }
        }
      } catch (e) {
        console.error('Error checking config file:', e);
      }
      
      // Create a simple store without encryption for now
      store = new Store({
        name: 'config',
        defaults: {
          geminiApiKey: '',
          theme: 'dark',
          debugMode: false
        }
      });
      console.log('Store initialized successfully');
    } catch (error) {
      console.error('Error initializing store:', error);
      
      // Create in-memory fallback
      store = {
        _data: {
          geminiApiKey: '',
          theme: 'dark',
          debugMode: false
        },
        get: function(key) {
          return this._data[key];
        },
        set: function(key, value) {
          this._data[key] = value;
          return true;
        }
      };
      console.log('Using in-memory store fallback');
    }
  }
  return store;
}

let mainWindow;

// Get user data directory for saved games
function getUserDataPath() {
  const userDataPath = path.join(app.getPath('userData'), 'data');
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }
  return userDataPath;
}

function createWindow() {
  // For development, disable CSP to allow API calls
  if (!app.isPackaged) {
    console.log('Development mode: disabling CSP for API calls');
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': ['']
        }
      });
    });
  }

  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
      devTools: app.isPackaged ? false : true  // Disable DevTools in production
    }
  });
  
  // Set Content Security Policy for production
  if (app.isPackaged) {
    mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': ["default-src 'self'; script-src 'self'; connect-src 'self' https://generativelanguage.googleapis.com; style-src 'self' 'unsafe-inline';"]
        }
      });
    });
  }

  console.log('App is packaged:', app.isPackaged);
  
  // Simple logic for loading the app
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  console.log('Loading index from:', indexPath);
  
  // Load the file
  mainWindow.loadFile(indexPath);

  // Open DevTools in development mode (ELECTRON_DEV), but never in production
  if (process.env.ELECTRON_DEV || (!app.isPackaged && process.env.NODE_ENV !== 'production')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Create window when Electron is ready
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle IPC communication
ipcMain.handle('get-api-key', () => {
  try {
    return getStore().get('geminiApiKey') || '';
  } catch (error) {
    console.error('Error getting API key from store:', error);
    return ''; // Return empty string on error
  }
});

ipcMain.handle('set-api-key', (_, apiKey) => {
  try {
    getStore().set('geminiApiKey', apiKey);
    return true;
  } catch (error) {
    console.error('Error saving API key to store:', error);
    return false;
  }
});

ipcMain.handle('save-game', async (_, gameData) => {
  // Get save directory in user data
  const userDataPath = getUserDataPath();
  const savesDir = path.join(userDataPath, 'saved-games');
  
  if (!fs.existsSync(savesDir)) {
    fs.mkdirSync(savesDir, { recursive: true });
  }
  
  const defaultPath = path.join(savesDir, 'game.json');
  
  const { filePath } = await dialog.showSaveDialog({
    title: 'Save Game',
    defaultPath: defaultPath,
    filters: [
      { name: 'JSON Files', extensions: ['json'] }
    ]
  });

  if (filePath) {
    fs.writeFileSync(filePath, JSON.stringify(gameData, null, 2));
    return true;
  }
  return false;
});

ipcMain.handle('load-game', async () => {
  // Get save directory in user data
  const userDataPath = getUserDataPath();
  const savesDir = path.join(userDataPath, 'saved-games');
  
  if (!fs.existsSync(savesDir)) {
    fs.mkdirSync(savesDir, { recursive: true });
  }
  
  const { filePaths } = await dialog.showOpenDialog({
    title: 'Load Game',
    defaultPath: savesDir,
    filters: [
      { name: 'JSON Files', extensions: ['json'] }
    ],
    properties: ['openFile']
  });

  if (filePaths && filePaths.length > 0) {
    const data = fs.readFileSync(filePaths[0], 'utf8');
    return JSON.parse(data);
  }
  return null;
});

// Get debug mode status
ipcMain.handle('get-debug-mode', () => {
  try {
    return getStore().get('debugMode') || false;
  } catch (error) {
    console.error('Error getting debug mode from store:', error);
    return false; // Default to false
  }
});

// Set debug mode status
ipcMain.handle('set-debug-mode', (_, enabled) => {
  try {
    getStore().set('debugMode', enabled);
    
    // Toggle DevTools based on debug mode
    if (mainWindow) {
      if (enabled && !mainWindow.webContents.isDevToolsOpened()) {
        mainWindow.webContents.openDevTools();
      } else if (!enabled && mainWindow.webContents.isDevToolsOpened()) {
        mainWindow.webContents.closeDevTools();
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error saving debug mode to store:', error);
    return false;
  }
});