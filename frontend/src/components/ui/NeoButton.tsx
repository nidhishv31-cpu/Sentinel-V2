import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

export interface NeoButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'default' | 'primary' | 'accent' | 'inset';
  size?: 'sm' | 'md' | 'lg';
  active?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const NeoButton: React.FC<NeoButtonProps> = ({
  variant = 'default',
  size = 'md',
  active = false,
  icon,
  children,
  className = '',
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs rounded-xl gap-1.5 min-h-[32px]',
    md: 'px-4 py-2 text-sm rounded-2xl gap-2 min-h-[38px]',
    lg: 'px-6 py-3 text-base rounded-2xl gap-2.5 min-h-[44px]',
  }[size];

  const variantStyles = {
    default: 'neo-button text-[var(--color-text-primary)]',
    primary: 'neo-button text-white !bg-[var(--color-primary)] !border-[var(--color-primary)] shadow-lg shadow-[var(--color-primary-glow)] hover:!brightness-110',
    accent: 'neo-button text-white !bg-[var(--color-secondary)] !border-[var(--color-secondary)] shadow-lg shadow-[var(--color-secondary-glow)] hover:!brightness-110',
    inset: 'neo-button active neo-button-inset',
  }[variant];

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.12 }}
      className={`inline-flex items-center justify-center flex-row whitespace-nowrap select-none font-semibold ${variantStyles} ${sizeClasses} ${active ? 'ring-2 ring-[var(--color-primary)] ring-offset-1 ring-offset-[var(--color-surface-solid)] font-bold' : ''} ${className}`}
      {...props}
    >
      {icon && <span className="inline-flex items-center justify-center shrink-0">{icon}</span>}
      <span className="whitespace-nowrap leading-none inline-block">{children}</span>
    </motion.button>
  );
};