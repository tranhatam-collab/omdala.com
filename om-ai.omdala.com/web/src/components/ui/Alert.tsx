import type { ReactNode } from 'react';

type AlertTone = 'warning' | 'success' | 'info';

type Props = {
  tone?: AlertTone;
  children: ReactNode;
  className?: string;
};

export function Alert({ tone = 'info', children, className = '' }: Props) {
  const toneClass = tone === 'warning' ? 'warning-line' : tone === 'success' ? 'success-line' : 'meta-line';
  return <p className={`${toneClass} ${className}`.trim()}>{children}</p>;
}
