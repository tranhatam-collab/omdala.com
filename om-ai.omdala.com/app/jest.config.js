module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|expo(nent)?|@expo|expo-modules-core|@unimodules|unimodules|@react-navigation|@testing-library|react-clone-referenced-element|expo-secure-store)'
  ],
};
