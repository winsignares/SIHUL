
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

if (import.meta.env.DEV) {
  const originalConsoleInfo = console.info;
  console.info = (...args: unknown[]) => {
    const firstArg = typeof args[0] === 'string' ? args[0] : '';
    if (firstArg.includes('Download the React DevTools for a better development experience')) {
      return;
    }
    originalConsoleInfo(...args);
  };
}

// Render sin StrictMode para evitar doble montaje en desarrollo
createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
