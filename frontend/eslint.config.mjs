import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import testingLibrary from 'eslint-plugin-testing-library';

const eslintConfig = [
  ...nextCoreWebVitals,
  {
    rules: {
      'jsx-quotes': ['error', 'prefer-single']
    }
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'warn'
    }
  },
  {
    files: ['__tests__/**/*.{ts,tsx,js,jsx}'],
    plugins: {
      'testing-library': testingLibrary
    },
    rules: {
      '@typescript-eslint/no-empty-function': 'off',
      'testing-library/no-debugging-utils': 'warn',
      'testing-library/no-dom-import': 'off'
    }
  },
  {
    files: ['playwright/**/*.{ts,tsx,js,jsx}'],
    rules: {
      'react-hooks/rules-of-hooks': 'off'
    }
  },
  {
    ignores: [
      '.next/**',
      'src/.next/**',
      'playwright-report/**',
      'test-results/**',
      'reportWebVitals.ts',
      'react-app-env.d.ts',
      'jest.config.ts',
      'src/Components/Utilities/FakeScrollbar.tsx'
    ]
  }
];

export default eslintConfig;
