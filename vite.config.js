import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  // Expose the dev server on a predictable port.
  server: {
    port: 3000,
    open: true, // Automatically open the browser on `npm run dev`.
  },

  // Produce a clean "dist/" folder on build.
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
