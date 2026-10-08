export const userRoleEnum = [
  'owner',
  'family_admin',
  'family_member',
  'guest',
  'operator',
  'facility_admin',
  'technician',
  'observer',
] as const;

export const actionClassEnum = ['observe', 'low', 'medium', 'sensitive', 'high', 'critical'] as const;

export const policyDecisionEnum = [
  'allow',
  'allow_with_logging',
  'suggest_only',
  'confirm_required',
  'location_required',
  'time_window_required',
  'two_person_approval',
  'admin_only',
  'denied',
] as const;

export const errorEnvelopeSchema = {
  type: 'object',
  properties: {
    data: { type: 'null' },
    error: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        reason: { type: 'string' },
      },
      required: ['code'],
    },
    meta: { type: 'object', additionalProperties: true },
  },
  required: ['data', 'error'],
} as const;
