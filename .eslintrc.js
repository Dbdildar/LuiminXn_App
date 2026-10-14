module.exports = {
  root: true,
  extends: '@react-native',
  ignorePatterns: ['node_modules/', 'android/', 'coverage/', 'e2e/artifacts/'],
  overrides: [
    {
      files: ['__tests__/**/*.{ts,tsx}', 'e2e/**/*.{ts,js}', 'jest.setup.ts'],
      plugins: ['jest'],
      env: {'jest/globals': true},
      rules: {
        'jest/no-focused-tests': 'error',
        'jest/no-identical-title': 'error',
        'jest/valid-expect': 'error',
        '@typescript-eslint/no-shadow': 'off',
        'react-native/no-inline-styles': 'off',
      },
    },
  ],
};
