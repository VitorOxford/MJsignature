// vite.config.js

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path' // 👈 Adicione esta linha

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: { // 👈 Adicione toda esta seção 'resolve'
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})