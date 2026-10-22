import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // JSX runtime "automatic". Vite 8 dùng `oxc`; vitest 2 chạy vite 5 riêng nên
  // cần thêm `esbuild` khi đang ở trong test runner.
  oxc: { jsx: { runtime: 'automatic' } },
  ...(process.env.VITEST ? { esbuild: { jsx: 'automatic' } } : {}),
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
