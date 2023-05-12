import path from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "lib/index.ts"),
      name: 'SortedArray',
      fileName: (format) => `the-sorted-array.${format}.js`,
    },
    sourcemap: true,
  },
})