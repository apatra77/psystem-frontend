import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const src = path.resolve(process.cwd(), 'src')

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      { find: '@/app', replacement: path.join(src, 'modules/customer/app') },
      { find: '@/shared', replacement: path.join(src, 'modules/customer/shared') },
      { find: '@', replacement: src },
    ],
  },
})
