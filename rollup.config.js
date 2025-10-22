import typescript from '@rollup/plugin-typescript'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import terser from '@rollup/plugin-terser'
import { defineConfig } from 'rollup'

const production = process.env.NODE_ENV === 'production'

export default defineConfig([
  // 主包构建
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.js',
        format: 'esm',
        sourcemap: true,
        exports: 'named'
      },
      {
        file: 'dist/index.cjs',
        format: 'cjs',
        sourcemap: true,
        exports: 'named'
      }
    ],
    external: ['lottie-web', 'vue', 'react', 'react-dom'],
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: './dist',
        rootDir: './src'
      }),
      production && terser({
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.debug']
        },
        mangle: {
          properties: {
            regex: /^_/
          }
        },
        format: {
          comments: false
        }
      })
    ].filter(Boolean)
  },

  // Vue 适配器
  {
    input: 'src/adapters/vue/index.ts',
    output: [
      {
        file: 'dist/adapters/vue/index.js',
        format: 'esm',
        sourcemap: true
      },
      {
        file: 'dist/adapters/vue/index.cjs',
        format: 'cjs',
        sourcemap: true
      }
    ],
    external: ['lottie-web', 'vue', '../../../core/LottieManager'],
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: './dist/adapters/vue'
      }),
      production && terser()
    ].filter(Boolean)
  },

  // React 适配器
  {
    input: 'src/adapters/react/index.ts',
    output: [
      {
        file: 'dist/adapters/react/index.js',
        format: 'esm',
        sourcemap: true
      },
      {
        file: 'dist/adapters/react/index.cjs',
        format: 'cjs',
        sourcemap: true
      }
    ],
    external: ['lottie-web', 'react', 'react-dom', '../../../core/LottieManager'],
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: './dist/adapters/react'
      }),
      production && terser()
    ].filter(Boolean)
  },

  // Lit 适配器
  {
    input: 'src/adapters/lit/index.ts',
    output: [
      {
        file: 'dist/adapters/lit/index.js',
        format: 'esm',
        sourcemap: true
      },
      {
        file: 'dist/adapters/lit/index.cjs',
        format: 'cjs',
        sourcemap: true
      }
    ],
    external: ['lottie-web', 'lit', '../../../core/LottieManager'],
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: './dist/adapters/lit'
      }),
      production && terser()
    ].filter(Boolean)
  }
])

