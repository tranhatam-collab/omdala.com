module.exports = {
  preset: 'jest-expo',
  testPathIgnorePatterns: ['/node_modules/', '/__tests_node__/'],
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|expo(nent)?|@expo|expo-modules-core|@unimodules|unimodules|@react-navigation|@testing-library|react-clone-referenced-element|expo-secure-store)'
  ],
};
