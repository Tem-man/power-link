import { defineConfig } from 'tsup'

export default defineConfig({
  // 入口文件
  entry: ['src/index.ts'],

  // 输出格式
  format: ['cjs', 'esm'],

  // 生成类型声明文件
  dts: true,

  // 生成 sourcemap
  sourcemap: true,

  // 构建前清理输出目录
  clean: true,

  // 目标环境
  target: 'es2020',

  // 输出目录
  outDir: 'dist',

  // 不压缩（库文件通常不需要压缩）
  minify: false,

  // Tree shaking
  treeshake: true,

  // 代码分割
  splitting: false,

  // 保留原始函数/类名
  keepNames: true,

  // 配置横幅和输出选项
  esbuildOptions(options) {
    options.banner = {
      js: '/** @power-link/core - Visual node connector library */',
    }
  },

  // 指定导出方式，避免 named/default exports 警告
  esbuildPlugins: [],
})

