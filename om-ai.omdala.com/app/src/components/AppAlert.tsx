import { Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

type Props = {
  tone?: 'info' | 'success' | 'warning';
  children: string;
};

export function AppAlert({ tone = 'info', children }: Props) {
  return <Text style={[styles.base, toneStyles[tone]]}>{children}</Text>;
}

const styles = StyleSheet.create({
  base: {
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
  },
});

const toneStyles = StyleSheet.create({
  info: {
    color: colors.text,
    backgroundColor: '#e4e4e7',
  },
  success: {
    color: '#1b6137',
    backgroundColor: '#dff4e7',
  },
  warning: {
    color: colors.warningText,
    backgroundColor: colors.warningBg,
  },
});
