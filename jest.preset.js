const nxPreset = require('@nx/jest/preset').default;

module.exports = {
  ...nxPreset,
  moduleNameMapper: {
    ...(nxPreset.moduleNameMapper ?? {}),
    '^@kritly/common$': '<rootDir>/../../libs/common/dist/src',
    '^@kritly/common/(.*)$': '<rootDir>/../../libs/common/dist/src/$1',
  },
};
