import { createRoot } from 'react-dom/client'
import App from './App.tsx'
// import TestApp from './TestApp.tsx'
import './index.css'

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error("Root element not found!");
  document.body.innerHTML = "<h1>Error: Root element not found</h1>";
} else {
  console.log("Mounting React app...");
  createRoot(rootElement).render(<App />);
}
