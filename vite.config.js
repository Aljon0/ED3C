import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm'; // Import the Wasm plugin

// Vite configuration
export default defineConfig({
  plugins: [
    react(),
    wasm(), // Add the Wasm plugin here
  ],
});