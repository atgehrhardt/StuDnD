// Error handling for the renderer process

// Global error handler
function setupGlobalErrorHandlers() {
  // Handle uncaught exceptions in the renderer process
  window.addEventListener('error', (event) => {
    console.error('Uncaught error:', event.error);
    showErrorOverlay(`Uncaught error: ${event.error?.message || 'Unknown error'}`);
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    showErrorOverlay(`Unhandled promise rejection: ${event.reason?.message || 'Unknown error'}`);
  });

  // Check if the API is available
  setTimeout(() => {
    if (!window.api) {
      console.error('API not available - preload script might not be loaded correctly');
      showErrorOverlay('API not available - preload script might not be loaded correctly');
    }
  }, 2000);
}

// Create and show an error overlay
function showErrorOverlay(message) {
  // Check if an error overlay already exists
  let overlay = document.getElementById('error-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'error-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    overlay.style.zIndex = '9999';
    overlay.style.color = 'white';
    overlay.style.padding = '20px';
    overlay.style.boxSizing = 'border-box';
    overlay.style.overflow = 'auto';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    
    document.body.appendChild(overlay);
  }

  // Add the error message
  const messageElement = document.createElement('div');
  messageElement.style.backgroundColor = '#ff5252';
  messageElement.style.padding = '10px';
  messageElement.style.margin = '10px';
  messageElement.style.borderRadius = '5px';
  messageElement.style.maxWidth = '80%';
  messageElement.style.wordBreak = 'break-word';
  messageElement.innerHTML = `<strong>Error:</strong> ${message}<br>Check the console (Ctrl+Shift+I) for more details.`;
  
  overlay.appendChild(messageElement);
}

// Export the setup function
export { setupGlobalErrorHandlers, showErrorOverlay };