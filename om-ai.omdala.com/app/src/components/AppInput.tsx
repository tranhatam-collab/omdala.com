import { TextInput, StyleSheet, TextInputProps } from 'react-native';
import { colors } from '../theme/colors';

export function AppInput(props: TextInputProps) {
  return <TextInput style={styles.input} placeholderTextColor="#94a3b8" {...props} />;
}

const styles = StyleSheet.create({
  input: {
    borderColor: '#d4d4d8',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    color: colors.text,
  },
});
