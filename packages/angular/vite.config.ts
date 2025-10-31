import { defineConfig } from 'vite'
import { resolve } from 'node:path'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      rollupTypes: true,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'LottieAngular',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      external: [
        '@angular/core',
        '@angular/common',
        '@ldesign/lottie-core',
        'rxjs',
        'tslib',
      ],
      output: {
        globals: {
          '@angular/core': 'ng.core',
          '@angular/common': 'ng.common',
          '@ldesign/lottie-core': 'LottieCore',
          'rxjs': 'rxjs',
        },
      },
    },
    sourcemap: true,
    minify: false,
  },
})
