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
      name: 'LottieLit',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`
    },
    rollupOptions: {
      external: ['lit', '@ldesign/lottie-core'],
      output: {
        globals: {
          lit: 'Lit',
          '@ldesign/lottie-core': 'LottieCore'
        }
      }
    },
    minify: 'terser',
    sourcemap: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})

