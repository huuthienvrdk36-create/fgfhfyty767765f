import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/api/admin-panel/',
  server: {
    port: 3002,
    host: '0.0.0.0',
  },
});
