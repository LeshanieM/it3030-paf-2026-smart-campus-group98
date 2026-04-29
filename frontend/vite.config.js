import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendTarget = env.VITE_BACKEND_URL || 'http://localhost:8092';

  return {
    plugins: [react()],
    define: {
      global: 'window',
    },
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on('error', (err, _req, _res) => {
              // Silent error handling for when the backend is down
            });
          },
        },
        // Only proxy the OAuth2 login initiation — NOT /oauth2/redirect (that's a frontend React route)
        '/oauth2/authorization': {
          target: backendTarget,
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on('error', (err, _req, _res) => {
              // Silent error handling
            });
          },
        },
        // Spring Security's internal OAuth2 callback endpoint
        '/login/oauth2': {
          target: backendTarget,
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on('error', (err, _req, _res) => {
              // Silent error handling
            });
          },
        },
        '/ws': {
          target: backendTarget,
          ws: true,
          configure: (proxy) => {
            proxy.on('error', (err, _req, _res) => {
              // Silent error handling for when the backend is down
            });
          },
        },
      },
    },
  };
});
