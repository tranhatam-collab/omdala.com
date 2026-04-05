import { ScrollView, StyleSheet, Text, View, Alert as RNAlert } from 'react-native';
import { useScenes } from '../hooks/useScenes';
import { Card } from '../components/Card';
import { colors } from '../theme/colors';
import { AppButton } from '../components/AppButton';
import { AppAlert } from '../components/AppAlert';
import { NavMenu } from '../components/NavMenu';

export function ScenesScreen() {
  const { scenes, loading, error, run } = useScenes();

  async function onRun(sceneId: string) {
    const result = await run(sceneId);
    if (!result) return;
    RNAlert.alert('Scene run', `${result.scene_id} -> ${result.status}`);
  }

  return (
    <ScrollView style={styles.container}>
      <NavMenu />
      <Card title="Scenes">
        {loading ? <Text style={styles.meta}>Loading scenes...</Text> : null}
        {error ? <AppAlert tone="warning">{error}</AppAlert> : null}
        {scenes.map((scene) => (
          <View key={scene.scene_id} style={styles.sceneRow}>
            <Text style={styles.sceneTitle}>{scene.display_name}</Text>
            <Text style={styles.meta}>Safety: {scene.safety_class}</Text>
            <AppButton title="Run" onPress={() => void onRun(scene.scene_id)} />
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  sceneRow: {
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e4e4e7',
    paddingBottom: 12,
  },
  sceneTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  meta: {
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: 4,
  },
});
