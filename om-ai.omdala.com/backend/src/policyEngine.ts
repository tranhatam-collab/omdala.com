import type { PolicyDecision, UserRole } from './types';

export type PolicyInput = {
  role: UserRole;
  actionClass: 'observe' | 'low' | 'medium' | 'sensitive' | 'high' | 'critical';
  businessMode: boolean;
};

export function evaluatePolicy(input: PolicyInput): PolicyDecision {
  if (input.actionClass === 'critical') return 'denied';
  if (input.actionClass === 'high') return 'two_person_approval';
  if (input.actionClass === 'sensitive' && input.role !== 'owner' && input.role !== 'facility_admin') {
    return 'confirm_required';
  }
  if (input.businessMode && input.actionClass === 'medium') return 'allow_with_logging';
  return 'allow';
}
