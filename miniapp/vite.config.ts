import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiProxyTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:8080';
  const devServerPort = Number(env.VITE_DEV_SERVER_PORT || 8081);

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: devServerPort,
      host: true,
      allowedHosts: true,
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
        },
        '/health': {
          target: apiProxyTarget,
          changeOrigin: true,
        },
      },
    },
    resolve: {
      dedupe: ['react', 'react-dom'],
    },
  };
});
