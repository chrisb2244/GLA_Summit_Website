import nextJest from 'next/jest';

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './'
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    // Handle module aliases (this will be automatically configured for you soon)
    '^@/Components/(.*)$': '<rootDir>/src/Components/$1',
    '^@/pages/(.*)$': '<rootDir>/src/pages/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/EmailTemplates/(.*)$': '<rootDir>/src/EmailTemplates/$1',
    '^@/media/(.*)$': '<rootDir>/public/media/$1'
  },
  testEnvironment: 'jest-environment-jsdom',
  testMatch: ['<rootDir>/**/*.test.ts(x)?'],
  testPathIgnorePatterns: ['<rootDir>/cypress/', '<rootDir>/node_modules/'],
  setupFiles: ['<rootDir>/.env.test']
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default async () => {
  return createJestConfig(customJestConfig);
};
