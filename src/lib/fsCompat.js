/**
 * Provides a compatibility layer for file operations in Electron
 * This ensures that the code works both in development and production modes
 */

console.log('fsCompat.js initializing...');

// Check if we're running in Electron - more reliable detection
export const isElectron = () => {
  console.log('Checking if running in Electron environment...');
  
  // Check renderer process
  if (typeof window !== 'undefined' && typeof window.process === 'object' && window.process.type === 'renderer') {
    console.log('Detected Electron renderer process');
    return true;
  }
  
  // Check main process
  if (typeof process !== 'undefined' && typeof process.versions === 'object' && !!process.versions.electron) {
    console.log('Detected Electron main process');
    return true;
  }
  
  // Check if window.api exists (Electron exposes this via preload.js)
  if (typeof window !== 'undefined' && typeof window.api === 'object') {
    console.log('Detected window.api - assuming Electron environment');
    return true;
  }
  
  console.log('Not running in Electron environment');
  return false;
};

// In a browser environment during development, create mock implementations
if (!isElectron() && typeof window !== 'undefined') {
  console.log('Setting up browser compatibility layer');
  
  // Create mock file system if needed
  if (!window.fs) {
    console.log('Creating mock file system');
    
    // Create a mock file system for development
    const mockFs = {
      // In-memory storage for "files"
      files: {},
      
      // Read file implementation
      readFile: async (path, options = {}) => {
        console.log('Mock readFile:', path);
        return new Promise((resolve, reject) => {
          // Check if file exists in our mock storage
          if (mockFs.files[path]) {
            const content = mockFs.files[path];
            
            // Return as string if encoding is specified
            if (options.encoding === 'utf8') {
              resolve(content);
            } else {
              // Convert string to Uint8Array
              const encoder = new TextEncoder();
              resolve(encoder.encode(content));
            }
          } else {
            reject(new Error(`File not found: ${path}`));
          }
        });
      },
      
      // Write file implementation
      writeFile: async (path, data) => {
        console.log('Mock writeFile:', path);
        return new Promise((resolve) => {
          // Store the data
          if (typeof data === 'string') {
            mockFs.files[path] = data;
          } else {
            // Convert Uint8Array to string
            const decoder = new TextDecoder();
            mockFs.files[path] = decoder.decode(data);
          }
          resolve();
        });
      }
    };
    
    // Create sample save file for testing
    mockFs.files['mockSave.json'] = JSON.stringify({
      gameState: {
        campaignName: 'Test Campaign',
        currentLocation: 'Test Town',
        gameLog: [
          {
            type: 'system',
            content: 'Game started',
            timestamp: new Date().toISOString()
          }
        ]
      },
      character: {
        name: 'Test Character',
        race: 'Human',
        class: 'Fighter',
        level: 1
      }
    });
    
    // Safely add fs to window object
    window.fs = mockFs;
    console.log('Mock file system created');
  }
  
  // Create mock API if needed
  if (!window.api) {
    console.log('Creating mock API for browser environment');
    
    // Create a temporary object for our mock API with proper promise handling
    const mockApi = {
      getApiKey: async () => {
        console.log('Mock API: getApiKey called');
        // Add some delay to simulate an API call
        return new Promise((resolve) => {
          setTimeout(() => {
            // Return empty string for dev mode
            console.log('Mock API: resolving getApiKey with empty string');
            resolve('');
          }, 100);
        });
      },
      setApiKey: async (key) => {
        console.log('Mock API: setApiKey called with:', key ? 'API key present' : 'empty key');
        return new Promise((resolve) => {
          setTimeout(() => {
            console.log('Mock API: resolving setApiKey');
            resolve(true);
          }, 100);
        });
      },
      saveGame: async (data) => {
        console.log('Mock API: saveGame called');
        return new Promise((resolve) => {
          setTimeout(() => {
            window.fs.files['mockSave.json'] = JSON.stringify(data);
            console.log('Mock API: game saved successfully');
            resolve(true);
          }, 100);
        });
      },
      loadGame: async () => {
        console.log('Mock API: loadGame called');
        return new Promise((resolve) => {
          setTimeout(() => {
            const data = window.fs.files['mockSave.json'];
            if (data) {
              console.log('Mock API: game loaded successfully');
              resolve(JSON.parse(data));
            } else {
              console.log('Mock API: no saved game found');
              resolve(null);
            }
          }, 100);
        });
      },
      getVersion: () => {
        console.log('Mock API: getVersion called');
        return '1.0.0-dev';
      },
      getPlatform: () => {
        console.log('Mock API: getPlatform called');
        return 'browser';
      }
    };
    
    // Define window.api - use a more robust approach
    window.api = mockApi;
    console.log('Mock API created successfully');
  } else {
    console.log('window.api already exists, will not override');
  }
}