import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    historyApiFallback: true,
    headers: {
      "Cross-Origin-Embedder-Policy": "credentialless",
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Resource-Policy": "cross-origin"
    }
  },
  optimizeDeps: {
    include: ['html-docx-js'], // Tell Vite to pre-bundle html-docx-js
  },
  build: {
    commonjsOptions: {
      include: [/html-docx-js/, /node_modules/], // Tell Vite to treat html-docx-js as CommonJS
    },
  },
});
