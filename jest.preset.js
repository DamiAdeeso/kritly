const nxPreset = require('@nx/jest/preset').default;

module.exports = {
  ...nxPreset,
  moduleNameMapper: {
    ...(nxPreset.moduleNameMapper ?? {}),
    '^@kritly/common$': '<rootDir>/../../dist/libs/common/src',
    '^@kritly/common/(.*)$': '<rootDir>/../../dist/libs/common/src/$1',
  },
};
