import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? '/Rannarmenu/' : '/',
  plugins: [react()],
  build: { sourcemap: false, chunkSizeWarningLimit: 800 },
});
