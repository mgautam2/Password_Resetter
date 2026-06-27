import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { readFileSync, writeFileSync } from 'fs'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-manifest',
      closeBundle() {
        const content = readFileSync('manifest.json', 'utf-8').replace(/"dist\//g, '"')
        writeFileSync('dist/manifest.json', content)
      }
    }
  ],
  base: './',
  build: {
    emptyOutDir: false,
    rollupOptions: {
      input: {
        popup: 'src/popup/index.html',
        background: 'src/background.ts',
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name].js',
        assetFileNames: 'assets/[name].[ext]',
        dir: 'dist'
      }
    }
  }
})
