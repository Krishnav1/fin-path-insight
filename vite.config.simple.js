import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Simple Vite configuration for Netlify deployment
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "./src"),
    },
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
});
