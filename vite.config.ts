import { defineConfig } from 'vite'
import { resolve } from 'node:path'

export default defineConfig({
  base: '/TitanLog/',
  build: {
    outDir: '_site',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        dashboard: resolve(__dirname, 'dashboard.html'),
      },
    },
  },
})
