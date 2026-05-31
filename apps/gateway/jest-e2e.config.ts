export default {
  displayName: 'gateway-e2e',
  preset: '../../jest.preset.js',
  globalSetup: undefined,
  globalTeardown: undefined,
  setupFiles: [],
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/gateway-e2e',
  testMatch: ['**/?(*.)+(e2e-spec).ts'],
};
