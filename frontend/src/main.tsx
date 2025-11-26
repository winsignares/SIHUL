
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { initializeDatabase } from './hooks/seed-data';

// Inicializar base de datos con datos de ejemplo
initializeDatabase();

// Render sin StrictMode para evitar doble montaje en desarrollo
createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
