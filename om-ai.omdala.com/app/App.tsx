import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { SessionProvider } from './src/session/sessionStore';
import { colors } from './src/theme/colors';

function AppRoot() {
  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <AppNavigator />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <AppRoot />
      </SessionProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
