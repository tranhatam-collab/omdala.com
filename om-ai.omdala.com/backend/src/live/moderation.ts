export const MODERATION_MAX_TEXT_LENGTH = 10_000;

const SELF_HARM_PATTERNS = [
  'self-harm',
  'self harm',
  'kill myself',
  'suicide',
  'hurt myself',
  'tự tử',
  'tự sát',
  'muốn chết',
];

export type ModerationAssessment = {
  safe: boolean;
  requires_escalation: boolean;
  safety_profile: 'wellness_safe_default' | 'education_safe_default';
  reason: 'high_risk_self_harm_signal' | 'no_high_risk_signal';
};

/** Local, deterministic screen only. It never calls a provider and is not a full classifier. */
export function assessText(text: string): ModerationAssessment {
  const normalized = text.normalize('NFC').toLowerCase();
  const flagged = SELF_HARM_PATTERNS.some((pattern) => normalized.includes(pattern));
  return {
    safe: !flagged,
    requires_escalation: flagged,
    safety_profile: flagged ? 'wellness_safe_default' : 'education_safe_default',
    reason: flagged ? 'high_risk_self_harm_signal' : 'no_high_risk_signal',
  };
}
