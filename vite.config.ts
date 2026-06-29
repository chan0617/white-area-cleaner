import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// No backend — pure client-side build.
export default defineConfig({
  plugins: [react()],
})
