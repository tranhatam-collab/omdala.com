import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppButton } from './AppButton';

export function NavMenu() {
  const navigation = useNavigation<any>();
  return (
    <View style={styles.row}>
      <AppButton title="Timeline / Nhat ky" onPress={() => navigation.navigate('Timeline')} />
      <AppButton title="Scenes / Ngu canh" onPress={() => navigation.navigate('Scenes')} variant="secondary" />
      <AppButton title="Settings / Cai dat" onPress={() => navigation.navigate('Settings')} variant="secondary" />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
});
