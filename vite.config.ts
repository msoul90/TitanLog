import { defineConfig } from 'vite'

export default defineConfig({
  base: '/TitanLog/',
  build: {
    outDir: '_site',
    emptyOutDir: true,
  },
})
