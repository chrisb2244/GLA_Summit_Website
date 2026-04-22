import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import testingLibrary from 'eslint-plugin-testing-library';

const eslintConfig = [
  ...nextCoreWebVitals,
  {
    rules: {
      'jsx-quotes': ['error', 'prefer-single'],
      'react-hooks/static-components': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/incompatible-library': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/error-boundaries': 'off'
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
      'reportWebVitals.ts',
      'react-app-env.d.ts',
      'jest.config.ts'
    ]
  }
];

export default eslintConfig;
