const { app, BrowserWindow, ipcMain, dialog, session } = require('electron');
const path = require('path');
const Store = require('electron-store');
const fs = require('fs');

// Import startup diagnostic
try {
  const { runDiagnostic } = require('./build_resources/startup-diagnostic');
  runDiagnostic();
} catch (err) {
  console.error('Failed to run startup diagnostic:', err);
}

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
      
      // Create a store with encryption for sensitive data
      const encryptionKey = getEncryptionKey();
      
      // Set up store options
      const storeOptions = {
        name: 'config',
        encryptionKey: encryptionKey,
        defaults: {
          geminiApiKey: '',
          theme: 'dark',
          debugMode: false
        }
      };
      
      // For Windows portable mode, store config next to the executable
      if (process.platform === 'win32' && app.isPackaged) {
        // Try to use portable configuration path
        try {
          const portableConfigPath = path.join(path.dirname(process.execPath), 'config');
          
          // Test if we can write to this directory
          if (!fs.existsSync(portableConfigPath)) {
            fs.mkdirSync(portableConfigPath, { recursive: true });
          }
          // Write test
          const testFile = path.join(portableConfigPath, '.write-test');
          fs.writeFileSync(testFile, 'test');
          fs.unlinkSync(testFile);
          
          // If successful, set portable config path
          storeOptions.cwd = portableConfigPath;
          console.log('Using portable config path:', portableConfigPath);
        } catch (err) {
          console.log('Portable config not available, using standard location');
        }
      }
      
      // Create the store with the configured options
      store = new Store(storeOptions);
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
  let userDataPath;
  
  // For Windows portable mode, store data next to the executable
  if (process.platform === 'win32' && !app.isPackaged) {
    // In development, use standard userData path
    userDataPath = path.join(app.getPath('userData'), 'data');
  } else if (process.platform === 'win32') {
    // In production Windows, check if we're running in portable mode
    // by looking for a "data" folder next to the executable
    const portableDataPath = path.join(path.dirname(process.execPath), 'data');
    
    // Check if we can write to this directory (portable mode)
    try {
      // Try to create or access the portable data directory
      if (!fs.existsSync(portableDataPath)) {
        fs.mkdirSync(portableDataPath, { recursive: true });
      }
      // Do a write test
      const testFile = path.join(portableDataPath, '.write-test');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile); // Remove test file
      
      // If successful, use portable path
      userDataPath = portableDataPath;
      console.log('Using portable data path:', portableDataPath);
    } catch (err) {
      // Fall back to standard userData path if we can't write to portable path
      console.log('Portable mode not available, using standard data location');
      userDataPath = path.join(app.getPath('userData'), 'data');
    }
  } else {
    // For macOS and Linux, use standard userData path
    userDataPath = path.join(app.getPath('userData'), 'data');
  }
  
  // Ensure the directory exists
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
    backgroundColor: '#1a1a1a', // Match the body background color
    icon: path.join(__dirname, process.platform === 'darwin' 
      ? 'build_resources/icons/mac/icon.icns' 
      : process.platform === 'win32'
        ? 'build_resources/icons/win/icon.ico'
        : 'build_resources/icons/linux/512x512.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
      devTools: app.isPackaged ? false : true,  // Only enable DevTools in development
      backgroundThrottling: false // Prevent throttling when window is in background
    },
    // Ensure consistent background color during window creation and loading
    show: false, // Don't show the window until it's ready
    paintWhenInitiallyHidden: true, // Paint the window while it's hidden
    // Use vibrancy effect on macOS to better integrate with the system
    vibrancy: process.platform === 'darwin' ? 'ultra-dark' : null
  });
  
  // Show the window once it's ready to avoid white flashes
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
  
  // Set Content Security Policy for production
  if (app.isPackaged) {
    mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': ["default-src 'self'; script-src 'self'; connect-src 'self' https://generativelanguage.googleapis.com; style-src 'self'; img-src 'self' data:;"]
        }
      });
    });
  }

  console.log('App is packaged:', app.isPackaged);
  
  // Simple logic for loading the app
  // Check if the app is packaged (production build) or not (development)
  // In production, bundle is at the root of the app directory
  // In development, it's in the dist folder
  let indexPath;
  
  if (app.isPackaged) {
    // In production, resources are relative to the app's root
    indexPath = path.join(__dirname, 'dist', 'index.html');
    
    // Log the environment for debugging
    console.log('Running in production mode');
    console.log('App path:', app.getAppPath());
    console.log('__dirname:', __dirname);
    
    // List files in the app directory to verify structure
    try {
      const files = fs.readdirSync(__dirname);
      console.log('Files in app directory:', files);
      
      // Check dist directory
      const distPath = path.join(__dirname, 'dist');
      if (fs.existsSync(distPath)) {
        const distFiles = fs.readdirSync(distPath);
        console.log('Files in dist directory:', distFiles);
      } else {
        console.log('dist directory not found');
      }
    } catch (err) {
      console.error('Error listing files:', err);
    }
  } else {
    // In development, resources are in the dist folder
    indexPath = path.join(__dirname, 'dist', 'index.html');
    console.log('Running in development mode');
  }
  
  // Check if the file exists before loading it
  if (!fs.existsSync(indexPath)) {
    console.error(`Error: index.html not found at ${indexPath}`);
    // Try to find it in alternative locations
    const possiblePaths = [
      path.join(__dirname, 'dist', 'index.html'),
      path.join(process.cwd(), 'dist', 'index.html'),
      path.join(app.getAppPath(), 'dist', 'index.html')
    ];
    
    for (const altPath of possiblePaths) {
      console.log(`Checking alternative path: ${altPath}`);
      if (fs.existsSync(altPath)) {
        console.log(`Found index.html at alternative path: ${altPath}`);
        indexPath = altPath;
        break;
      }
    }
  }
  
  console.log('Loading index from:', indexPath);
  
  // Load the file and add error handling
  try {
    // Before loading the file, check if it exists one more time
    if (fs.existsSync(indexPath)) {
      mainWindow.loadFile(indexPath);
      
      // Handle page load errors
      mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error(`Failed to load: ${errorDescription} (${errorCode})`);
        
        // Load the dedicated error page
        const errorPagePath = path.join(__dirname, 'build_resources', 'error.html');
        if (fs.existsSync(errorPagePath)) {
          mainWindow.loadFile(errorPagePath, {
            query: {
              'error': `Failed to load app: ${errorDescription} (${errorCode})`
            }
          });
        } else {
          // Fallback if even the error page is missing
          // Create an encoded error message to prevent XSS
          const safeErrorDesc = encodeURIComponent(errorDescription);
          const safeErrorCode = encodeURIComponent(errorCode);
          
          mainWindow.loadURL(`data:text/html;charset=utf-8,
            <html>
              <head>
                <title>Error Loading Application</title>
                <style>
                  body { font-family: sans-serif; padding: 2rem; background: #1a1a1a; color: #f0f0f0; }
                  .error { background: #ff5252; color: white; padding: 1rem; border-radius: 4px; }
                </style>
                <script>
                  window.onload = function() {
                    // Safely set error text with DOM methods
                    const errorText = document.getElementById('errorText');
                    errorText.textContent = decodeURIComponent("${safeErrorDesc}") + " (" + decodeURIComponent("${safeErrorCode}") + ")";
                  };
                </script>
              </head>
              <body>
                <h1>Error Loading Application</h1>
                <div class="error">
                  <p><strong>Error:</strong> <span id="errorText"></span></p>
                  <p>Please try restarting the application.</p>
                </div>
              </body>
            </html>
          `);
        }
      });
    } else {
      console.error(`Index file not found at: ${indexPath}`);
      
      // Try to directly load the bundle.js file inside a minimal HTML shell
      mainWindow.loadURL(`data:text/html;charset=utf-8,
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>DnD Learning Companion</title>
            <style>
              body { margin: 0; padding: 0; background: #1a1a1a; color: #f0f0f0; }
            </style>
          </head>
          <body>
            <div id="app">
              <div style="display: flex; justify-content: center; align-items: center; height: 100vh; text-align: center;">
                <div>
                  <h1>DnD Learning Companion</h1>
                  <p>Loading application...</p>
                  <div style="width: 50px; height: 50px; border: 5px solid #333; border-top: 5px solid #4a6; border-radius: 50%; margin: 20px auto; animation: spin 1s linear infinite;"></div>
                </div>
              </div>
            </div>
            <script>
              // Animation for the spinner
              document.head.insertAdjacentHTML('beforeend', 
                '<style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>');
              
              // Try to load the bundle dynamically
              try {
                const script = document.createElement('script');
                script.src = './dist/bundle.js';
                script.onerror = () => {
                  document.getElementById('app').innerHTML = '<div style="padding: 2rem; text-align: center;"><h1>Error Loading Application</h1><p>Failed to load the main application bundle.</p></div>';
                };
                document.body.appendChild(script);
              } catch (e) {
                console.error('Error loading bundle:', e);
              }
            </script>
          </body>
        </html>
      `);
    }
  } catch (err) {
    console.error('Error loading file:', err);
    
    // Try to load the error page as a last resort
    try {
      const errorPagePath = path.join(__dirname, 'build_resources', 'error.html');
      if (fs.existsSync(errorPagePath)) {
        mainWindow.loadFile(errorPagePath, {
          query: {
            'error': `Error loading application: ${err.message}`
          }
        });
      }
    } catch (errorPageErr) {
      console.error('Failed to load error page:', errorPageErr);
    }
  }

  // Only open DevTools in development when explicitly requested
  if (!app.isPackaged && process.env.OPEN_DEV_TOOLS === '1') {
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
    // Validate the API key first
    if (typeof apiKey !== 'string') {
      console.error('Invalid API key type provided');
      return false;
    }
    
    // Basic validation - API keys should be reasonable length and not contain HTML
    if (apiKey && (apiKey.length < 10 || apiKey.includes('<') || apiKey.includes('>'))) {
      console.error('API key failed validation checks');
      return false;
    }
    
    // Save the validated API key
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
    try {
      // Validate the gameData before saving
      if (!gameData || typeof gameData !== 'object') {
        throw new Error('Invalid game data format');
      }
      
      // Basic sanitization - ensure no prototype pollution
      const sanitizedData = JSON.parse(JSON.stringify(gameData));
      
      fs.writeFileSync(filePath, JSON.stringify(sanitizedData, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving game data:', error);
      dialog.showErrorBox('Save Error', 'Failed to save game file.');
      return false;
    }
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
    try {
      const data = fs.readFileSync(filePaths[0], 'utf8');
      // Validate the JSON data before parsing
      const gameData = JSON.parse(data);
      
      // Add basic validation to ensure this is a valid game file
      if (!gameData || typeof gameData !== 'object') {
        throw new Error('Invalid game data format');
      }
      
      // Check for expected game data structure
      if (!gameData.characterState && !gameData.gameState) {
        throw new Error('Missing required game data fields');
      }
      
      return gameData;
    } catch (error) {
      console.error('Error loading game data:', error);
      dialog.showErrorBox('Load Error', 'Failed to load game file. The file may be corrupted or invalid.');
      return null;
    }
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

// Remove window control handlers since we're using native controls