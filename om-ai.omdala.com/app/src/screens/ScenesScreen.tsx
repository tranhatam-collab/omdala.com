import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert as RNAlert,
} from 'react-native';
import { useScenes } from '../hooks/useScenes';
import { Card } from '../components/Card';
import { colors } from '../theme/colors';
import { AppButton } from '../components/AppButton';
import { AppAlert } from '../components/AppAlert';
import { NavMenu } from '../components/NavMenu';

export function ScenesScreen() {
  const { scenes, loading, error, run, retry } = useScenes();

  async function onRun(sceneId: string) {
    const result = await run(sceneId);
    if (!result) return;
    RNAlert.alert('Scene run / Chay scene', `${result.scene_id} -> ${result.status}`);
  }

  return (
    <ScrollView style={styles.container}>
      <NavMenu />
      <Card title="Scenes / Ngu canh">
        {loading ? <Text style={styles.meta}>Loading scenes... / Dang tai scenes...</Text> : null}
        {error ? (
          <View>
            <AppAlert tone="warning">{error}</AppAlert>
            <AppButton title="Retry / Thu lai" onPress={() => void retry()} />
          </View>
        ) : null}
        {!loading && !error && scenes.length === 0 ? (
          <Text style={styles.meta}>No scenes configured yet. / Chua co scene nao duoc cau hinh.</Text>
        ) : null}
        {scenes.map((scene) => (
          <View key={scene.scene_id} style={styles.sceneRow}>
            <Text style={styles.sceneTitle}>{scene.display_name}</Text>
            <Text style={styles.meta}>Safety / Muc an toan: {scene.safety_class}</Text>
            <AppButton title="Run / Chay" onPress={() => void onRun(scene.scene_id)} />
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
