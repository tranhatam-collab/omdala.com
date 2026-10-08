import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../components/Card';
import { colors } from '../theme/colors';
import { AppAlert } from '../components/AppAlert';
import { useSession } from '../session/sessionStore';

export function SignInScreen() {
  const { session } = useSession();

  return (
    <View style={styles.container}>
      <Card title="Native sign-in unavailable / Dang nhap native chua kha dung">
        <Text style={styles.label}>Status / Trang thai: {session.status}</Text>
        <AppAlert tone="warning">
          Protected features are disabled until the native app has a verified OMDALA session bridge. Use the OMDALA web app for authenticated access. / Cac tinh nang duoc bao ve dang tat cho den khi ung dung native co cau noi phien OMDALA da xac minh. Hay dung ung dung web OMDALA de truy cap co xac thuc.
        </AppAlert>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.background,
  },
  label: {
    color: colors.text,
    marginBottom: 4,
  },
});
