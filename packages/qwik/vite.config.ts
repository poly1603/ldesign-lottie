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
      name: 'LottieQwik',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      external: [
        '@builder.io/qwik',
        '@builder.io/qwik/jsx-runtime',
        '@ldesign/lottie-core',
      ],
      output: {
        globals: {
          '@builder.io/qwik': 'qwik',
          '@builder.io/qwik/jsx-runtime': 'qwikJsxRuntime',
          '@ldesign/lottie-core': 'LottieCore',
        },
      },
    },
    sourcemap: true,
    minify: false,
  },
})
