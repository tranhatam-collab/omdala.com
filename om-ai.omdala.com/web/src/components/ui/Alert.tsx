import type { ReactNode } from 'react';

type AlertTone = 'warning' | 'success' | 'info';

type Props = {
  tone?: AlertTone;
  children: ReactNode;
  className?: string;
  lang?: string;
};

export function Alert({ tone = 'info', children, className = '', lang }: Props) {
  const toneClass = tone === 'warning' ? 'warning-line' : tone === 'success' ? 'success-line' : 'meta-line';
  return <p className={`${toneClass} ${className}`.trim()} lang={lang}>{children}</p>;
}
