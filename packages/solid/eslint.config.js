import antfu from '@antfu/eslint-config'

export default antfu({
  typescript: true,
  formatters: true,
  stylistic: {
    indent: 2,
    quotes: 'single',
    semi: false,
  },
  ignores: [
    'dist',
    'node_modules',
    '*.d.ts',
    'coverage',
    '*.config.js',
    '*.config.ts',
  ],
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'ts/no-explicit-any': 'off',
    'ts/explicit-function-return-type': 'off',
    'ts/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    'style/brace-style': ['error', '1tbs'],
    'curly': ['error', 'multi-line'],
  },
})
