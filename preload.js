const { contextBridge, ipcRenderer } = require('electron');

// Add useful diagnostics to understand the environment
console.log('Preload script starting...');
console.log('Node version:', process.versions.node);
console.log('Chrome version:', process.versions.chrome);
console.log('Electron version:', process.versions.electron);

// Track preload execution
let preloadExecuted = false;

// Make sure ipcRenderer is available
if (!ipcRenderer) {
  console.error('ERROR: ipcRenderer is not available in the preload script!');
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
try {
  console.log('Starting to expose API through contextBridge');

  contextBridge.exposeInMainWorld(
    'api', {
    getApiKey: () => {
      return ipcRenderer.invoke('get-api-key').catch(err => {
        console.error('Error in getApiKey:', err);
        return '';
      });
    },
    setApiKey: (apiKey) => {
      return ipcRenderer.invoke('set-api-key', apiKey).catch(err => {
        console.error('Error in setApiKey:', err);
        return false;
      });
    },
    saveGame: (gameData) => {
      console.log('Preload: saveGame called');
      return ipcRenderer.invoke('save-game', gameData).catch(err => {
        console.error('Error in saveGame:', err);
        return false;
      });
    },
    loadGame: () => {
      console.log('Preload: loadGame called');
      return ipcRenderer.invoke('load-game').catch(err => {
        console.error('Error in loadGame:', err);
        return null;
      });
    },

    // Add app info
    getVersion: () => {
      const version = process.env.npm_package_version || '1.0.0';
      console.log('Preload: getVersion called, version:', version);
      return version;
    },
    getPlatform: () => {
      const platform = process.platform;
      console.log('Preload: getPlatform called, platform:', platform);
      return platform;
    },
    getDebugMode: () => {
      console.log('Preload: getDebugMode called');
      return ipcRenderer.invoke('get-debug-mode').catch(err => {
        console.error('Error in getDebugMode:', err);
        return false;
      });
    },
    setDebugMode: (enabled) => {
      console.log('Preload: setDebugMode called with', enabled);
      return ipcRenderer.invoke('set-debug-mode', enabled).catch(err => {
        console.error('Error in setDebugMode:', err);
        return false;
      });
    }
  }
  );
  
  console.log('Successfully exposed API through contextBridge');
  preloadExecuted = true;
} catch (error) {
  console.error('Error in contextBridge.exposeInMainWorld:', error);
}

// Signal when the preload script has finished
if (preloadExecuted) {
  console.log('Preload script executed successfully!');
  
  // Expose a global window variable to confirm preload execution
  try {
    process.once('loaded', () => {
      global.__preloadExecuted = true;
    });
  } catch (err) {
    console.error('Failed to set global preload flag:', err);
  }
} else {
  console.error('Preload script failed to execute properly!');
}