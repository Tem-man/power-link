import { defineConfig } from 'tsup'

export default defineConfig({
  // 入口文件
  entry: ['src/index.ts'],

  // 输出格式：CJS、ESM、IIFE（浏览器直接引用）
  format: ['cjs', 'esm', 'iife'],

  // IIFE 格式的全局变量名
  globalName: 'PowerLink',

  // 明确指定为浏览器平台
  platform: 'browser',

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

  // 配置横幅和尾部代码
  esbuildOptions(options) {
    // 让 IIFE 的 PowerLink 直接可作为构造函数使用
    options.footer = {
      js: 'if(typeof PowerLink!=="undefined"&&PowerLink.default){Object.assign(PowerLink.default,PowerLink);PowerLink=PowerLink.default;}',
    }
  },
})
