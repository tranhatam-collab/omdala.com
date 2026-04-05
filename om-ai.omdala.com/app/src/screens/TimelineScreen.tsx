import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTimeline } from '../hooks/useTimeline';
import { Card } from '../components/Card';
import { StatusPill } from '../components/StatusPill';
import { colors } from '../theme/colors';
import { AppButton } from '../components/AppButton';
import { AppAlert } from '../components/AppAlert';
import { NavMenu } from '../components/NavMenu';
import { useNavigation } from '@react-navigation/native';

export function TimelineScreen() {
  const { entries, refresh, loading, error } = useTimeline();
  const navigation = useNavigation<any>();

  return (
    <ScrollView style={styles.container}>
      <NavMenu />
      <Card title="Activity timeline">
        <AppButton title={loading ? 'Refreshing...' : 'Refresh'} onPress={() => void refresh()} disabled={loading} />
        {error ? <AppAlert tone="warning">{error}</AppAlert> : null}
        {entries.map(({ run, proof }) => (
          <View key={run.run_id} style={styles.runRow}>
            <Text style={styles.runTitle}>
              {run.source}:{run.source_id}
            </Text>
            <View style={styles.pillRow}>
              <StatusPill label={run.status} />
              {run.policy_decision ? <StatusPill label={run.policy_decision} /> : null}
            </View>
            <Text style={styles.meta}>Run ID: {run.run_id}</Text>
            {proof ? <Text style={styles.meta}>Proof: {proof.proofId}</Text> : <Text style={styles.meta}>Proof pending</Text>}
            <AppButton title="View run detail" variant="secondary" onPress={() => navigation.navigate('RunDetail', { runId: run.run_id })} />
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
  runRow: {
    marginTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e4e4e7',
    paddingBottom: 12,
  },
  runTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  meta: {
    color: colors.textMuted,
    marginTop: 4,
  },
  pillRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
});
