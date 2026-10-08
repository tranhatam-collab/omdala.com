export function nowIso() {
  return new Date().toISOString();
}

export function randomId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}
