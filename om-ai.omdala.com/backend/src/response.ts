export type SuccessEnvelope<T> = {
  data: T;
  error: null;
  meta?: Record<string, unknown>;
};

export type ErrorEnvelope = {
  data: null;
  error: {
    code: string;
    reason?: string;
  };
  meta?: Record<string, unknown>;
};

export function ok<T>(data: T, meta?: Record<string, unknown>): SuccessEnvelope<T> {
  return { data, error: null, meta };
}

export function fail(code: string, reason?: string, meta?: Record<string, unknown>): ErrorEnvelope {
  return { data: null, error: { code, reason }, meta };
}
