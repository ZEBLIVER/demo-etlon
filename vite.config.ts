import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// На GitHub Pages сайт лежит в подпапке /demo-etlon/
export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? '/demo-etlon/' : '/',
  plugins: [react()],
  server: { host: '127.0.0.1', port: 5173 },
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
}));
