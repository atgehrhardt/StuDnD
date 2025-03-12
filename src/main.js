import './lib/fsCompat.js'; // Import FS compatibility layer
import App from './App.svelte';

console.log('main.js: App initialization starting');

// Check if the app element exists
const appElement = document.getElementById('app');
console.log('main.js: App element found:', !!appElement);

// Create a function to initialize the app with a slight delay
// This helps ensure the DOM is fully ready
function initApp() {
  console.log('main.js: Initializing app');
  
  try {
    // First, clear the loading indicator that's in the HTML
    if (appElement) {
      console.log('main.js: Clearing loading indicator');
      appElement.innerHTML = '';
    }
    
    // Then mount the Svelte app
    const app = new App({
      target: appElement || document.body
    });
    
    console.log('main.js: App mounted successfully');
    return app;
  } catch (error) {
    console.error('main.js: Error initializing app:', error);
    
    // Show user-friendly error message
    if (appElement) {
      appElement.innerHTML = `
        <div style="padding: 2rem; text-align: center; font-family: sans-serif; color: #f0f0f0; background: #2a2a2a; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;">
          <h2>Failed to initialize application</h2>
          <p>Please try restarting the application. If the problem persists, please contact support.</p>
          <div style="margin-top: 2rem; padding: 1rem; background: rgba(0,0,0,0.3); max-width: 80%; border-radius: 8px; font-family: monospace; text-align: left;">
            <p>Error: ${error.message}</p>
          </div>
          <button style="margin-top: 2rem; padding: 0.75rem 1.5rem; background: #7c5ce7; color: white; border: none; border-radius: 8px; cursor: pointer;" 
                  onclick="location.reload()">Retry</button>
        </div>
      `;
    }
    
    throw error; // Re-throw for debugging purposes
  }
}

// Add a small delay to ensure the DOM is ready
setTimeout(initApp, 100);

export default {}; // Export empty object instead of the app to avoid timing issues