import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

type Props = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
};

export function AppButton({ title, onPress, variant = 'primary', disabled }: Props) {
  return (
    <TouchableOpacity
      style={[styles.button, variant === 'secondary' && styles.secondary, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.text, variant === 'secondary' && styles.textSecondary]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: colors.primary,
    marginTop: 8,
    alignItems: 'center',
  },
  secondary: {
    backgroundColor: colors.secondary,
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    color: '#fff',
    fontWeight: '600',
  },
  textSecondary: {
    color: colors.text,
  },
});
