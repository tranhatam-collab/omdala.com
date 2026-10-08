import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function Button({ variant = 'primary', className = '', type = 'button', ...props }: Props) {
  const variantClass = variant === 'secondary' ? 'button-secondary' : '';
  const mergedClass = `${variantClass} ${className}`.trim();

  return <button type={type} className={mergedClass} {...props} />;
}
