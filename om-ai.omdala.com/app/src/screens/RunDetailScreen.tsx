import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { getProof, getRun } from '../api/reality';
import { Card } from '../components/Card';
import { AppAlert } from '../components/AppAlert';
import { AppButton } from '../components/AppButton';
import { colors } from '../theme/colors';

type Props = {
  route: {
    params: {
      runId: string;
    };
  };
};

export function RunDetailScreen({ route }: Props) {
  const { runId } = route.params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runText, setRunText] = useState('');
  const [proofText, setProofText] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setRunText('');
    setProofText('');

    const runResult = await getRun(runId);
    if (runResult.error || !runResult.value) {
      setError('Unable to load activity details. Please try again. / Khong the tai chi tiet hoat dong. Vui long thu lai.');
      setLoading(false);
      return;
    }
    const run = runResult.value;
    setRunText(
      `${run.run_id} / ${run.source}:${run.source_id} / ${run.status}`,
    );

    if (run.proof_id) {
      const proofResult = await getProof(run.proof_id);
      if (proofResult.value) {
        setProofText(
          `${proofResult.value.proofId} / confidence=${proofResult.value.confidenceScore}`,
        );
      }
    }

    setError(null);
    setLoading(false);
  }, [runId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <ScrollView style={styles.container}>
      <Card title="Run detail / Chi tiet run">
        {loading ? <Text style={styles.meta}>Loading... / Dang tai...</Text> : null}
        {error ? (
          <View>
            <AppAlert tone="warning">{error}</AppAlert>
            <AppButton title="Retry / Thu lai" onPress={() => void load()} />
          </View>
        ) : null}
        {!loading && !error && !runText ? (
          <Text style={styles.meta}>Run not found. / Khong tim thay run.</Text>
        ) : null}
        {runText ? <Text style={styles.meta}>Run / Luot chay: {runText}</Text> : null}
        {proofText ? <Text style={styles.meta}>Proof / Bang chung: {proofText}</Text> : null}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  meta: {
    color: colors.text,
    marginTop: 8,
  },
});
