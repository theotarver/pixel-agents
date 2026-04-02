import type { ButtonHTMLAttributes } from 'react';

const base = 'border-2 rounded-none cursor-pointer';

const sizes = {
  sm: 'py-1 px-8 text-sm',
  md: 'py-2 px-12',
  lg: 'py-3 px-14 text-lg',
  xl: 'py-6 px-24 text-xl',
} as const;

const variants = {
  default: `${base} bg-btn-bg border-transparent hover:bg-btn-hover`,
  active: `${base} bg-active-bg border-accent`,
  disabled: `${base} bg-btn-bg border-transparent cursor-default opacity-[var(--btn-disabled-opacity)]`,
  accent: `${base} bg-accent! hover:bg-accent-bright! border-accent hover:border-accent-bright`,
  ghost: `${base} text-text-muted bg-transparent border-transparent hover:bg-btn-hover`,
} as const;

type ButtonVariant = keyof typeof variants;
type ButtonSize = keyof typeof sizes;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  variant = 'default',
  size = 'lg',
  className = '',
  ...props
}: ButtonProps) {
  return <button className={`${variants[variant]} ${sizes[size]} ${className}`} {...props} />;
}
