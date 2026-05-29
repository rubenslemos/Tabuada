module.exports = {
  preset: '@react-native/jest-preset',
  testMatch: ['<rootDir>/tests/ui/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/ui/setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native|@react-navigation|expo(nent)?|@expo|@unimodules|react-clone-referenced-element)/)',
  ],
}
