// This script will be manually added to the index.html to help debug rendering issues
console.log('▶️ Debug renderer script starting');

// Check DOM state
console.log('▶️ Document readyState:', document.readyState);
console.log('▶️ App element exists:', !!document.getElementById('app'));

// Check bundle loading
const bundleScript = document.querySelector('script[src="bundle.js"]');
console.log('▶️ Bundle script element exists:', !!bundleScript);

// Check if API is available from preload
console.log('▶️ window.api available:', !!window.api);

// Listen for DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('▶️ DOMContentLoaded event fired');
  console.log('▶️ App element inner HTML:', document.getElementById('app').innerHTML);
});

// Monitor DOM changes to detect when app is loaded
const observer = new MutationObserver(function(mutations) {
  console.log('▶️ DOM mutation detected:', mutations.length, 'changes');
  const appElement = document.getElementById('app');
  if (appElement) {
    // Check if the app element has changed from the loading state
    const isStillLoading = !!appElement.querySelector('.loading-app');
    console.log('▶️ App is still in loading state:', isStillLoading);
    if (!isStillLoading) {
      console.log('▶️ App has loaded content:', appElement.innerHTML.substring(0, 100) + '...');
    }
  }
});

// Start observing when document is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startObserver);
} else {
  startObserver();
}

function startObserver() {
  const appElement = document.getElementById('app');
  if (appElement) {
    observer.observe(appElement, { childList: true, subtree: true });
    console.log('▶️ Started observing DOM mutations on #app element');
  }
}

// Track resource loading
const originalFetch = window.fetch;
window.fetch = function(...args) {
  console.log('▶️ fetch called with:', args[0]);
  return originalFetch.apply(this, args)
    .then(response => {
      console.log('▶️ fetch succeeded for:', args[0]);
      return response;
    })
    .catch(err => {
      console.error('▶️ fetch failed for:', args[0], err);
      throw err;
    });
};

// Check for errors with bundle.js
window.addEventListener('error', function(event) {
  if (event.filename && event.filename.includes('bundle.js')) {
    console.error('▶️ Error in bundle.js:', event.message, 'at line', event.lineno);
  }
});

console.log('▶️ Debug renderer script finished initialization');