import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // IMPORTANT: set base to your repo subpath for GitHub Pages project sites
  base: '/preventivatore/',
  plugins: [react()],
  optimizeDeps: {
    include: ['buffer', 'process'],
  },
})
