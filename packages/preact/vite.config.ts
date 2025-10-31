import { defineConfig } from 'vite'
import { resolve } from 'path'
import preact from '@preact/preset-vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    preact(),
    dts({
      insertTypesEntry: true,
      outDir: 'dist',
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'src/**/*.spec.ts', 'src/**/*.spec.tsx']
    })
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'LottiePreact',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`
    },
    rollupOptions: {
      external: ['preact', 'preact/hooks', '@ldesign/lottie-core'],
      output: {
        globals: {
          preact: 'preact',
          'preact/hooks': 'preactHooks',
          '@ldesign/lottie-core': 'LottieCore'
        }
      }
    },
    minify: 'terser',
    sourcemap: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      'react': 'preact/compat',
      'react-dom': 'preact/compat'
    }
  }
})
