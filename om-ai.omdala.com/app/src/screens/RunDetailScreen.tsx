import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { getProof, getRun } from '../api/reality';
import { Card } from '../components/Card';
import { AppAlert } from '../components/AppAlert';
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

  useEffect(() => {
    let active = true;
    void (async () => {
      const runResult = await getRun(runId);
      if (!active) return;
      if (runResult.error || !runResult.value) {
        setError(runResult.error ?? 'run_not_found');
        setLoading(false);
        return;
      }
      const run = runResult.value;
      setRunText(`${run.run_id} / ${run.source}:${run.source_id} / ${run.status}`);

      if (run.proof_id) {
        const proofResult = await getProof(run.proof_id);
        if (proofResult.value) {
          setProofText(`${proofResult.value.proofId} / confidence=${proofResult.value.confidenceScore}`);
        }
      }

      setError(null);
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [runId]);

  return (
    <ScrollView style={styles.container}>
      <Card title="Run detail">
        {loading ? <Text style={styles.meta}>Loading...</Text> : null}
        {error ? <AppAlert tone="warning">{error}</AppAlert> : null}
        {runText ? <Text style={styles.meta}>Run: {runText}</Text> : null}
        {proofText ? <Text style={styles.meta}>Proof: {proofText}</Text> : null}
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
