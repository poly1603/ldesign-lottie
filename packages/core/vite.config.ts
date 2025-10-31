import { defineConfig } from 'vite'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      outDir: 'dist',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/*.spec.ts']
    })
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'LottieCore',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`
    },
    rollupOptions: {
      external: ['lottie-web'],
      output: {
        globals: {
          'lottie-web': 'lottie'
        },
        // 处理动态导入的chunk
        chunkFileNames: '[name].js',
        assetFileNames: '[name][extname]'
      }
    },
    minify: 'terser',
    sourcemap: true
  },
  // Worker configuration
  worker: {
    format: 'es',
    // 禁用rollup选项，避免路径问题
    rollupOptions: {
      output: {
        entryFileNames: 'lottie.worker.js'
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  optimizeDeps: {
    exclude: ['lottie-web']
  }
})


