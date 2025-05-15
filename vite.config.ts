import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd());
  
  // Default to localhost:8000 if FASTAPI_URL is not defined
  const fastApiUrl = env.FASTAPI_URL || 'http://localhost:8000';
  
  return {
  server: {
    host: "::",
    port: 8080,
    proxy: {
      // Proxy API requests to FastAPI backend
      '/api': {
        target: fastApiUrl,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: false,
      }
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ['html2pdf.js']
  },
  build: {
    rollupOptions: {
      external: ['fs', 'path'],
    },
    commonjsOptions: {
      include: [/html2pdf.js/, /node_modules/],
      transformMixedEsModules: true,
    },
    chunkSizeWarningLimit: 2000,
  },
};
});
