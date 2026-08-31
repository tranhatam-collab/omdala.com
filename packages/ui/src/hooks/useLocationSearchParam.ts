"use client";

import { useCallback, useSyncExternalStore } from "react";

const LOCATION_CHANGE_EVENT = "omdala:location-change";

function subscribe(onStoreChange: () => void): () => void {
  window.addEventListener("popstate", onStoreChange);
  window.addEventListener("hashchange", onStoreChange);
  window.addEventListener(LOCATION_CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("popstate", onStoreChange);
    window.removeEventListener("hashchange", onStoreChange);
    window.removeEventListener(LOCATION_CHANGE_EVENT, onStoreChange);
  };
}

export function useLocationSearchParam(name: string): string | null {
  const getSnapshot = useCallback(
    () => new URLSearchParams(window.location.search).get(name),
    [name],
  );

  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}

export function notifyLocationChange(): void {
  window.dispatchEvent(new Event(LOCATION_CHANGE_EVENT));
}
