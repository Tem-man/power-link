import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  title: 'online demo',
  base: '/power-link/',
  plugins: [vue()],
  resolve: {
    alias:
      // dev 模式直接指向 TS 源码，Vite 实时编译，无需 build
      // prod build 时走 package.json exports（dist 产物）
      command === 'serve'
        ? { 'power-link': resolve(__dirname, '../../packages/connector/src/index.ts') }
        : {},
  },
}))
