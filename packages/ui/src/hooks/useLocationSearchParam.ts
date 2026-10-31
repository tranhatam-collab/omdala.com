"use client";

import { useCallback, useSyncExternalStore } from "react";

const LOCATION_CHANGE_EVENT = "omdala:location-change";

let historyPatched = false;

// Next's router changes the URL through history.pushState/replaceState, which fire no
// event; announce them so ?lang= consumers update after client-side navigation.
function patchHistory(): void {
  if (historyPatched || typeof window === "undefined") {
    return;
  }
  historyPatched = true;

  for (const method of ["pushState", "replaceState"] as const) {
    const original = window.history[method].bind(window.history);
    window.history[method] = (...args: Parameters<History["pushState"]>) => {
      original(...args);
      window.dispatchEvent(new Event(LOCATION_CHANGE_EVENT));
    };
  }
}

function subscribe(onStoreChange: () => void): () => void {
  patchHistory();
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

/** Current query string and hash (for example `?next=/x&lang=vi#a`), kept in sync with navigation. */
export function useLocationSuffix(): string {
  const getSnapshot = useCallback(
    () => `${window.location.search}${window.location.hash}`,
    [],
  );

  return useSyncExternalStore(subscribe, getSnapshot, () => "");
}
