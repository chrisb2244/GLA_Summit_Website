import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypeScript from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier';
import testingLibrary from 'eslint-plugin-testing-library';

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypeScript,
  prettier,
  {
    rules: {
      'jsx-quotes': ['error', 'prefer-single']
    }
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { varsIgnorePattern: '^_', argsIgnorePattern: '^_' }]
    }
  },
  {
    files: ['__tests__/**/*.{ts,tsx,js,jsx}'],
    ...testingLibrary.configs['flat/react'],
    rules: {
      ...testingLibrary.configs['flat/react'].rules,
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
