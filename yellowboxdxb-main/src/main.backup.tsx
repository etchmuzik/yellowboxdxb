import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Add global error handler to catch any initialization errors
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  // Display error on page if app fails to mount
  const errorDiv = document.getElementById('error-display') || document.createElement('div');
  errorDiv.id = 'error-display';
  errorDiv.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; background: #fee; color: #c00; padding: 20px; z-index: 9999;';
  errorDiv.innerHTML = `
    <h2>Application Error</h2>
    <p>${event.error?.message || 'Unknown error'}</p>
    <pre style="font-size: 12px; overflow: auto;">${event.error?.stack || ''}</pre>
  `;
  document.body.appendChild(errorDiv);
});

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error("Root element not found!");
  document.body.innerHTML = "<h1>Error: Root element not found</h1>";
} else {
  try {
    createRoot(rootElement).render(<App />);
  } catch (error) {
    console.error("Failed to mount React app:", error);
    document.body.innerHTML = `
      <div style="padding: 40px; font-family: system-ui, sans-serif;">
        <h1 style="color: #c00;">Failed to start application</h1>
        <p>${error.message}</p>
        <pre style="background: #f5f5f5; padding: 10px; overflow: auto;">${error.stack}</pre>
      </div>
    `;
  }
}
