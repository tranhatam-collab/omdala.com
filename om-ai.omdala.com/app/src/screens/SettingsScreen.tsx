import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../components/Card';
import { useSession } from '../session/sessionStore';
import { colors } from '../theme/colors';
import { AppButton } from '../components/AppButton';
import { NavMenu } from '../components/NavMenu';

export function SettingsScreen() {
  const { session, logout } = useSession();

  return (
    <View style={styles.container}>
      <NavMenu />
      <Card title="Session">
        <Text style={styles.meta}>Token: {session.token ?? 'none'}</Text>
        <Text style={styles.meta}>Refresh token: {session.refreshToken ? 'available' : 'none'}</Text>
        <Text style={styles.meta}>Expires at: {session.expiresAt ?? 'unknown'}</Text>
        <AppButton title="Logout" onPress={() => void logout()} />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  meta: {
    color: colors.text,
    marginBottom: 8,
  },
});
