import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  base: '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: mode === 'test' ? 5174 : 5173,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.js'],
    globals: true,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Handle vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom') || id.includes('react-icons')) {
              return 'vendor-react';
            }
            if (id.includes('react-bootstrap') || id.includes('react-select') || id.includes('react-toastify')) {
              return 'vendor-ui';
            }
            if (id.includes('chart.js') || id.includes('react-chartjs-2')) {
              return 'vendor-charts';
            }
            if (id.includes('axios') || id.includes('jquery') || id.includes('popper.js')) {
              return 'vendor-utils';
            }
            if (id.includes('bootstrap')) {
              return 'vendor-bootstrap';
            }
            return 'vendors'; // other vendors
          }
          
          // Handle app chunks
          if (id.includes('/src/components/')) {
            if (id.includes('/auth/')) return 'auth';
            if (id.includes('/menu/') || id.includes('/inventory/') || id.includes('/recipe/') || 
                id.includes('/order/') || id.includes('/customer/') || id.includes('/event/') || 
                id.includes('/quality/')) {
              return 'management';
            }
            if (id.includes('/stock/')) return 'stock';
            if (id.includes('/mealtracker/') || id.includes('/receipt/') || id.includes('/image/')) {
              return 'features';
            }
            if (id.includes('/finance/')) return 'finance';
            if (id.includes('/analytics/')) return 'analytics';
            if (id.includes('/shopping/')) return 'shopping';
          }
        },
        chunkFileNames: 'assets/[name]-[hash].js',
      },
    },
    sourcemap: true,
    target: 'esnext',
  },
  define: {
    // Ensure proper handling of environment mode
    'process.env.NODE_ENV': JSON.stringify(mode)
  }
}))
