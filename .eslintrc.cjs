module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  ignorePatterns: ['_site/', 'coverage/', 'dist/'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      },
    ],
  },
  overrides: [
    {
      files: ['src/**/*.ts'],
      rules: {},
    },
    {
      files: ['src/**/*.test.ts', 'src/**/__tests__/**/*.ts'],
      env: {
        node: true,
      },
      rules: {
        '@typescript-eslint/no-empty-function': 'off',
      },
    },
  ],
};
