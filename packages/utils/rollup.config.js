import { nodeResolve } from "@rollup/plugin-node-resolve"
import commonjs from "@rollup/plugin-commonjs"
import { babel } from "@rollup/plugin-babel"
import terser from "@rollup/plugin-terser"
import { readFileSync } from "fs"
import { fileURLToPath } from "url"
import { dirname, resolve } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 读取父目录的 package.json
const pkg = JSON.parse(readFileSync(resolve(__dirname, "../package.json"), "utf-8"))

export default {
  input: "utils/index.ts",
  output: [
    {
      file: "dist/index.js",
      format: "esm",
      sourcemap: false,
      banner: "/*! node-link v" + pkg.version + " | MIT License */"
    }
  ],
  external: [],
  plugins: [
    nodeResolve({
      browser: true,
      preferBuiltins: false
    }),
    commonjs(),
    babel({
      babelHelpers: "bundled",
      exclude: "node_modules/**",
      extensions: [".js", ".jsx", ".ts", ".tsx"],
      configFile: resolve(__dirname, "../.babelrc")
    }),
    terser()
  ]
}
