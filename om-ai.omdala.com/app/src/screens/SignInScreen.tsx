import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useMagicLink } from '../hooks/useMagicLink';
import { Card } from '../components/Card';
import { colors } from '../theme/colors';
import { AppButton } from '../components/AppButton';
import { AppInput } from '../components/AppInput';
import { AppAlert } from '../components/AppAlert';

export function SignInScreen() {
  const { send, loading, error, success, setError, setSuccess } = useMagicLink();
  const [email, setEmail] = useState('');

  async function onSend() {
    setError(null);
    setSuccess(null);
    await send(email.trim());
  }

  return (
    <View style={styles.container}>
      <Card title="Sign in with magic link">
        <Text style={styles.label}>Email address</Text>
        <AppInput
          placeholder="you@omdala.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <AppButton title={loading ? 'Sending...' : 'Send magic link'} onPress={onSend} disabled={loading} />
        <AppAlert tone="info">Open your magic-link email on this device to continue sign in.</AppAlert>
        {success ? <AppAlert tone="success">{success}</AppAlert> : null}
        {error ? <AppAlert tone="warning">{error}</AppAlert> : null}
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
