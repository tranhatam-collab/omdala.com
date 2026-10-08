import { useMemo, useState } from 'react';

export type AppState = {
  selectedSpaceId: string | null;
};

export function useAppStore() {
  const [state, setState] = useState<AppState>({
    selectedSpaceId: null,
  });

  return useMemo(
    () => ({
      state,
      setSelectedSpaceId: (spaceId: string | null) => setState((prev) => ({ ...prev, selectedSpaceId: spaceId })),
    }),
    [state],
  );
}
