import { defineConfig } from 'vite'
import { resolve } from 'node:path'
import dts from 'vite-plugin-dts'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  plugins: [
    svelte(),
    dts({
      insertTypesEntry: true,
      rollupTypes: true,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'LottieSvelte',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      external: [
        'svelte',
        'svelte/internal',
        '@ldesign/lottie-core',
      ],
      output: {
        globals: {
          'svelte': 'svelte',
          'svelte/internal': 'svelteInternal',
          '@ldesign/lottie-core': 'LottieCore',
        },
      },
    },
    sourcemap: true,
    minify: false,
  },
})
