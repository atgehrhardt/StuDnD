const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    getApiKey: () => {
      // Security: Don't log sensitive operations with API keys
      return ipcRenderer.invoke('get-api-key');
    },
    setApiKey: (apiKey) => {
      // Security: Don't log sensitive operations with API keys
      return ipcRenderer.invoke('set-api-key', apiKey);
    },
    saveGame: (gameData) => {
      console.log('Preload: saveGame called');
      return ipcRenderer.invoke('save-game', gameData);
    },
    loadGame: () => {
      console.log('Preload: loadGame called');
      return ipcRenderer.invoke('load-game');
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
      return ipcRenderer.invoke('get-debug-mode');
    },
    setDebugMode: (enabled) => {
      console.log('Preload: setDebugMode called with', enabled);
      return ipcRenderer.invoke('set-debug-mode', enabled);
    }
  }
);

// Log that preload script has executed
console.log('Preload script executed');