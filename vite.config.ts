import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // relative asset paths, so the build works under any GitHub Pages repo path
  base: './',
  plugins: [react()],
});
