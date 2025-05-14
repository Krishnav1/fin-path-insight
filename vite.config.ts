import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { visualizer } from "rollup-plugin-visualizer";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on mode (development or production)
  const env = loadEnv(mode, process.cwd(), '');
  const apiBaseUrl = env.VITE_API_BASE_URL || 'https://fininsight.onrender.com';
  const fastApiUrl = env.VITE_FASTAPI_URL || 'https://fininsight.onrender.com';
  const enableFallbacks = env.VITE_ENABLE_FALLBACK_APIS === 'true';
  const enableErrorMonitoring = env.VITE_ENABLE_ERROR_MONITORING === 'true';
  
  console.log(`Building for ${mode} mode with:`);
  console.log(`- Node.js API base URL: ${apiBaseUrl}`);
  console.log(`- FastAPI URL: ${fastApiUrl}`);
  console.log(`- Fallback APIs: ${enableFallbacks ? 'Enabled' : 'Disabled'}`);
  console.log(`- Error Monitoring: ${enableErrorMonitoring ? 'Enabled' : 'Disabled'}`);
  console.log(`- Build timestamp: ${new Date().toISOString()}`);
  
  // Configure proxy targets
  const proxyConfig: Record<string, any> = {};
  
  // Node.js backend API routes
  proxyConfig['/api'] = {
    target: apiBaseUrl,
    changeOrigin: true,
    secure: mode === 'production',
    rewrite: (path: string): string => path,
    configure: (proxy: any, _options: any): void => {
      proxy.on('error', (err: Error, _req: any, res: any): void => {
        console.log('Node.js API proxy error:', err.message);
        if (res.headersSent) return;
        
        // If fallbacks are enabled, don't return an error yet
        // The fallback middleware will handle it
        if (!enableFallbacks) {
          res.writeHead(500, {
            'Content-Type': 'application/json',
          });
          res.end(JSON.stringify({ 
            error: 'proxy_error', 
            message: err.message,
            service: 'node_backend',
            timestamp: new Date().toISOString()
          }));
        }
      });
      proxy.on('proxyReq', (proxyReq: any, req: any, _res: any): void => {
        // Add custom headers for tracking
        proxyReq.setHeader('X-Client-Environment', mode);
        proxyReq.setHeader('X-Request-ID', Math.random().toString(36).substring(2, 15));
        
        if (mode === 'development') {
          console.log(`Proxying to Node.js backend: ${req.method} ${proxyReq.path}`);
        }
      });
    }
  };
  
  // FastAPI routes
  if (fastApiUrl) {
    proxyConfig['/fastapi'] = {
      target: fastApiUrl,
      changeOrigin: true,
      secure: mode === 'production',
      rewrite: (path: string): string => path.replace(/^\/fastapi/, '/api'),
      configure: (proxy: any, _options: any): void => {
        proxy.on('error', (err: Error, _req: any, res: any): void => {
          console.log('FastAPI proxy error:', err.message);
          if (res.headersSent) return;
          
          // If Node.js backend is also down, this is a critical error
          res.writeHead(500, {
            'Content-Type': 'application/json',
          });
          res.end(JSON.stringify({ 
            error: 'proxy_error', 
            message: err.message,
            service: 'fastapi_backend',
            timestamp: new Date().toISOString(),
            isFallback: true
          }));
        });
        proxy.on('proxyReq', (proxyReq: any, req: any, _res: any): void => {
          // Add custom headers for tracking
          proxyReq.setHeader('X-Client-Environment', mode);
          proxyReq.setHeader('X-Request-ID', Math.random().toString(36).substring(2, 15));
          
          if (mode === 'development') {
            console.log(`Proxying to FastAPI: ${req.method} ${proxyReq.path}`);
          }
        });
      }
    };
  }
  
  // Add static data fallback for when both APIs are down
  proxyConfig['/data'] = {
    target: '/',
    rewrite: (path: string): string => path,
  };
  
  return {
    server: {
      host: "::",
      port: 8080,
      proxy: proxyConfig,
    },
    plugins: [
      react(),
      mode === 'development' && componentTagger(),
      mode === 'production' && visualizer({
        open: false,
        gzipSize: true,
        brotliSize: true,
        filename: 'dist/stats.html'
      })
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      // Add build information for debugging
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
      __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
      __DEV_MODE__: mode !== 'production',
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
      // Use esbuild instead of terser to avoid dependency issues
      minify: 'esbuild',
      // Generate source maps for better debugging
      sourcemap: mode !== 'production',
    }
  };
});
