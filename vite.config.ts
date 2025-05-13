import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on mode (development or production)
  const env = loadEnv(mode, process.cwd(), '');
  const apiBaseUrl = env.VITE_API_BASE_URL || 'https://fininsight.onrender.com';
  
  console.log(`Building for ${mode} mode with API base URL: ${apiBaseUrl}`);
  
  return {
    server: {
      host: "::",
      port: 8081, // Changed to 8081 to avoid conflicts with backend on 8080
      proxy: {
        '/api': {
          target: apiBaseUrl,
          changeOrigin: true,
          secure: mode === 'production',
          rewrite: (path) => path,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, res) => {
              console.log('proxy error', err);
              if (res.headersSent) {
                return;
              }
              res.writeHead(500, {
                'Content-Type': 'application/json',
              });
              res.end(JSON.stringify({ error: 'proxy_error', message: err.message }));
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log(`Proxying ${req.method} request to: ${proxyReq.path}`);
            });
          }
        }
      }
    },
    plugins: [
      react(),
      mode === 'development' && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    optimizeDeps: {
      include: ['html2pdf.js'],
      exclude: ['chunk-BOIXESWR']
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
    }
  };
});
