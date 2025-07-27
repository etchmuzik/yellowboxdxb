import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Simple version without error handlers
const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(<App />);
} else {
  document.body.innerHTML = "<h1>Error: Root element not found</h1>";
}