import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function manualChunks(id: string) {
  if (!id.includes('node_modules')) {
    return;
  }

  if (
    id.includes('/react/') ||
    id.includes('/react-dom/') ||
    id.includes('/react-router') ||
    id.includes('/scheduler/')
  ) {
    return 'vendor-react';
  }

  if (
    id.includes('/recharts/') ||
    id.includes('/d3-') ||
    id.includes('/victory-vendor/')
  ) {
    return 'vendor-charts';
  }

  if (id.includes('/motion/') || id.includes('/framer-motion/')) {
    return 'vendor-motion';
  }

  if (id.includes('/xlsx/')) {
    return 'vendor-xlsx';
  }

  if (id.includes('/jspdf/')) {
    return 'vendor-jspdf';
  }

  if (id.includes('/html2canvas/')) {
    return 'vendor-html2canvas';
  }
}

// Configuración extendida para desarrollo local y dentro de Docker con HMR estable
export default defineConfig(() => {
  // Leer URL del API desde variables de entorno
  const apiUrl = process.env.VITE_API_URL || 'http://localhost:8000';
  
  // Remover trailing slash si existe
  const apiUrlClean = apiUrl.replace(/\/+$/, '');
  
  return {
    plugins: [react()],
    server: {
      host: true, // Permite acceso externo (0.0.0.0) útil en contenedores
      port: Number(process.env.VITE_PORT) || 5173,
      strictPort: true, // Falla si el puerto está ocupado para evitar confusión
      allowedHosts: [
        'sihul.unilibre.edu.co',
      ],
      open: false,
      proxy: {
        '/api': {
          target: apiUrlClean,
          changeOrigin: true,
          secure: false,
        },
        '/media': {
          target: apiUrlClean,
          changeOrigin: true,
          secure: false,
        },
      },
      hmr: {
        // En Docker puede necesitar clientPort si se hace port-forward distinto
        host: process.env.VITE_HMR_HOST || undefined,
        clientPort: Number(
          process.env.VITE_HMR_CLIENT_PORT || process.env.VITE_HMR_PORT
        ) || undefined,
      },
      watch: {
        // Polling mejora fiabilidad en volúmenes montados (Windows + Docker)
        usePolling: process.env.VITE_USE_POLLING === 'true',
        interval: 100,
      },
    },
    preview: {
      host: true,
      port: 4173,
    },
    optimizeDeps: {
      include: ['react', 'react-dom'],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks,
        },
      },
    },
  };
});
