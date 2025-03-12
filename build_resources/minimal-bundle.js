// Minimal bundle for debugging
(function() {
  console.log('Minimal bundle loaded!');
  
  // Wait for DOM
  document.addEventListener('DOMContentLoaded', function() {
    // Replace the loading indicator with our simple app
    const appElement = document.getElementById('app');
    if (appElement) {
      appElement.innerHTML = `
        <div style="padding: 2rem; max-width: 800px; margin: 0 auto; text-align: center;">
          <h1 style="margin-bottom: 2rem;">Minimal Bundle Works!</h1>
          <p>This confirms that a basic JavaScript bundle can load correctly.</p>
          
          <div style="margin: 2rem 0; padding: 1rem; background-color: #2c2c54; border-radius: 8px; color: white;">
            <h2>Preload API Check</h2>
            <p>API Available: <strong>${window.api ? 'Yes ✓' : 'No ✗'}</strong></p>
            
            <div style="margin-top: 1rem; text-align: left;">
              <h3>Available API Methods:</h3>
              <pre>${window.api ? JSON.stringify(Object.keys(window.api), null, 2) : 'None'}</pre>
            </div>
          </div>
          
          <button id="test-button" style="padding: 0.75rem 1.5rem; background-color: #706fd3; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;">
            Test Interaction
          </button>
        </div>
      `;
      
      // Add click handler to the button
      const button = document.getElementById('test-button');
      if (button) {
        button.addEventListener('click', function() {
          alert('Button clicked! JavaScript interaction is working.');
        });
      }
    } else {
      console.error('App element not found in the DOM!');
      // Try to insert our app into the body as a fallback
      const appDiv = document.createElement('div');
      appDiv.id = 'minimal-app';
      appDiv.innerHTML = '<h1>Minimal App (Fallback)</h1><p>The main app container was not found.</p>';
      document.body.appendChild(appDiv);
    }
  });
})();