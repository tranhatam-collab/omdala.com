import type { ReactNode } from 'react';

type Props = {
  title?: string;
  className?: string;
  id?: string;
  children: ReactNode;
};

export function Card({ title, className = '', id, children }: Props) {
  return (
    <section className={`card ${className}`.trim()} id={id}>
      {title ? <h2>{title}</h2> : null}
      {children}
    </section>
  );
}
