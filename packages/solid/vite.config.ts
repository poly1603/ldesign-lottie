import { defineConfig } from 'vite'
import { resolve } from 'node:path'
import dts from 'vite-plugin-dts'
import solid from 'vite-plugin-solid'

export default defineConfig({
  plugins: [
    solid(),
    dts({
      insertTypesEntry: true,
      rollupTypes: true,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'LottieSolid',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      external: [
        'solid-js',
        'solid-js/web',
        '@ldesign/lottie-core',
      ],
      output: {
        globals: {
          'solid-js': 'solid',
          'solid-js/web': 'solidWeb',
          '@ldesign/lottie-core': 'LottieCore',
        },
      },
    },
    sourcemap: true,
    minify: false,
  },
})
