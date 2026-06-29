import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages(프로젝트 페이지) 경로에 맞춘 base. 백엔드 없음(클라이언트 전용).
export default defineConfig({
  base: '/white-area-cleaner/',
  plugins: [react()],
})
