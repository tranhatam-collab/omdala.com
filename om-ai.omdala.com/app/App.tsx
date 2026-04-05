import { SafeAreaView, StatusBar, StyleSheet, Linking } from 'react-native';
import { useEffect } from 'react';
import { AppNavigator } from './src/navigation/AppNavigator';
import { SessionProvider, useSession } from './src/session/sessionStore';
import { colors } from './src/theme/colors';

function AppRoot() {
  const { setSession } = useSession();

  useEffect(() => {
    function extract(url: string) {
      const tokenMatch = url.match(/[?&](token|access_token)=([^&]+)/);
      const refreshMatch = url.match(/[?&]refresh_token=([^&]+)/);
      const expiresMatch = url.match(/[?&]expires_at=([^&]+)/);
      return {
        accessToken: tokenMatch?.[2] ? decodeURIComponent(tokenMatch[2]) : null,
        refreshToken: refreshMatch?.[1] ? decodeURIComponent(refreshMatch[1]) : undefined,
        expiresAt: expiresMatch?.[1] ? decodeURIComponent(expiresMatch[1]) : undefined,
      };
    }

    const handle = (event: { url?: string }) => {
      const url = event?.url ?? '';
      const parsed = extract(url);
      if (parsed.accessToken) {
        void setSession(parsed.accessToken, parsed.refreshToken, parsed.expiresAt);
      }
    };

    const sub = Linking.addEventListener('url', handle);

    void (async () => {
      const initial = await Linking.getInitialURL();
      if (initial) {
        handle({ url: initial });
      }
    })();

    return () => sub.remove();
  }, [setSession]);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <AppNavigator />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SessionProvider>
      <AppRoot />
    </SessionProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
