/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  worker: { format: 'es' },
  // Pre-bundle the editor packages together so the dev server never mixes copies of them.
  optimizeDeps: { include: ['@codemirror/language', '@lezer/highlight'] },
  test: { environment: 'node' },
});
