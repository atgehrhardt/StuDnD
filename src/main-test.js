// Simplified test entry point
console.log('Test entry point loaded');

// Create a simple test app
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM fully loaded');
  const appElement = document.getElementById('app');
  
  if (appElement) {
    console.log('App element found, replacing content');
    appElement.innerHTML = `
      <div style="padding: 20px; max-width: 800px; margin: 0 auto; font-family: sans-serif;">
        <h1>Test App Loaded Successfully!</h1>
        <p>This confirms that the bundle is loading correctly.</p>
        <p>API available: <strong>${window.api ? 'Yes' : 'No'}</strong></p>
        <div style="margin-top: 20px; padding: 15px; background-color: #333; border-radius: 5px;">
          <h3>API Methods:</h3>
          <ul style="list-style: none; padding: 0;">
            ${window.api ? Object.keys(window.api).map(method => 
              `<li style="margin: 5px 0; padding: 5px; background-color: #444; border-radius: 3px;">${method}</li>`
            ).join('') : '<li>No API methods available</li>'}
          </ul>
        </div>
        <button id="test-button" style="margin-top: 20px; padding: 10px 15px; background-color: #7c5ce7; color: white; border: none; border-radius: 5px; cursor: pointer;">
          Test Button
        </button>
      </div>
    `;
    
    // Add event listener to test button
    const button = document.getElementById('test-button');
    if (button) {
      button.addEventListener('click', function() {
        alert('Button works! The app is functional.');
      });
    }
  } else {
    console.error('App element not found');
  }
});