import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './': GitHub Pages 하위 경로 배포에서도 에셋 경로가 깨지지 않음
export default defineConfig({
  plugins: [react()],
  base: './',
})
