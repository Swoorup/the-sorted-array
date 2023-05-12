import { defineConfig } from 'vite';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
    base: "./",
    build: {
        lib: {
            entry: path.resolve(__dirname, 'src/index.ts'),
            name: 'the-sorted-array',
            fileName: (format) => `index.${format}.js`
        },
        rollupOptions: {
            // Some libraries do not work well with Rollup and should be listed here.
            // Examples are 'gl' and 'fs'.
            external: [],
        },
        sourcemap: true,
    },
    define: {
        global: {},
    },
    optimizeDeps: {
        disabled: true,
    },
    plugins: [],
});
