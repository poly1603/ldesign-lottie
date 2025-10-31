import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3105,
  },
  esbuild: {
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
    jsxInject: `import { h, Fragment } from '@builder.io/qwik'`
  }
});
