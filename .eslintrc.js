module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  plugins: [
    '@typescript-eslint'
  ],
  extends: [
    'eslint:recommended'
  ],
  rules: {
    'curly': 'warn',
    'eqeqeq': 'warn',
    'no-throw-literal': 'warn',
    'semi': ['warn', 'always'],
    'no-unused-vars': 'off', // Turn off base rule
    '@typescript-eslint/no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    'prefer-const': 'warn',
    'no-var': 'error',
    'no-case-declarations': 'warn'
  },
  ignorePatterns: [
    'out',
    'dist',
    '**/*.d.ts',
    'node_modules',
    'webviews'
  ],
  env: {
    node: true,
    es6: true
  },
  overrides: [
    {
      files: ['src/test/**/*.ts'],
      env: {
        mocha: true
      },
      globals: {
        'describe': 'readonly',
        'it': 'readonly',
        'before': 'readonly',
        'after': 'readonly',
        'beforeEach': 'readonly',
        'afterEach': 'readonly'
      }
    }
  ]
};