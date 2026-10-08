import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

type Props = {
  label: ReactNode;
  tone?: 'default' | 'warning' | 'success';
};

export function StatusPill({ label, tone = 'default' }: Props) {
  const toneStyle = tone === 'warning' ? styles.warning : tone === 'success' ? styles.success : undefined;
  return (
    <View style={[styles.pill, toneStyle]}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d4d4d8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  text: {
    color: colors.text,
  },
  warning: {
    borderColor: colors.warningText,
    backgroundColor: colors.warningBg,
  },
  success: {
    borderColor: '#1b6137',
    backgroundColor: '#dff4e7',
  },
});
