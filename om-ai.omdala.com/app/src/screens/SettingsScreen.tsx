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
      <Card title="Session / Phien dang nhap">
        <Text style={styles.meta}>Status / Trang thai: {session.status}</Text>
        <Text style={styles.meta}>{session.reason}</Text>
        <AppButton title="Logout / Dang xuat" onPress={() => void logout()} />
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
