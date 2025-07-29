import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx'
      }
    }]
  },
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  collectCoverageFrom: [
    'src/**/*.(ts|tsx)',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/vite-env.d.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  testTimeout: 10000,
  maxWorkers: '50%',
  cache: true,
  clearMocks: true,
  restoreMocks: true,
  // Performance testing configuration
  reporters: [
    'default',
    ['jest-performance', {
      thresholds: {
        default: 50, // 50ms threshold for all tests
        'performance': 100, // 100ms for performance-specific tests
        'scalability': 200 // 200ms for scalability tests
      },
      outputFile: 'performance-report.json'
    }]
  ],
  // Memory leak detection
  detectOpenHandles: true,
  detectLeaks: true,
  forceExit: true,
  // Global test configuration
  globals: {
    'ts-jest': {
      isolatedModules: true
    }
  }
};

export default config;