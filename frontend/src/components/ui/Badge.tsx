import React from 'react';
import type { SeverityLevel } from '../../config/severity';
import { SEVERITY_CONFIG } from '../../config/severity';

interface BadgeProps {
  severity: SeverityLevel;
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ severity, size = 'md', className = '' }) => {
  const cfg = SEVERITY_CONFIG[severity];
  const sizeClass = size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-xs px-2 py-0.5';

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full ${sizeClass} ${className}`}
      style={{ color: cfg.color, backgroundColor: cfg.bgColor }}
      aria-label={`Severity: ${cfg.label}`}
    >
      {cfg.label}
    </span>
  );
};