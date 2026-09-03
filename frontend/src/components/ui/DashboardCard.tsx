import React from 'react';
import { motion } from 'framer-motion';

interface DashboardCardProps {
  title: string;
  icon?: React.ReactNode;
  drillInHref?: string;
  drillInLabel?: string;
  isLoading?: boolean;
  error?: Error | null;
  children: React.ReactNode;
  className?: string;
  'data-testid'?: string;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  icon,
  drillInHref,
  drillInLabel,
  isLoading,
  error,
  children,
  className = '',
  'data-testid': testId,
}) => {
  return (
    <motion.div
      className={`card flex flex-col ${className}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      data-testid={testId}
    >
      {/* Card header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-2.5">
          {icon && (
            <span
              className="flex items-center justify-center w-8 h-8 rounded-lg text-sm"
              style={{ background: 'var(--color-accent-muted)', color: 'var(--color-accent)' }}
            >
              {icon}
            </span>
          )}
          <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-muted)' }}>
            {title}
          </h2>
        </div>
        {drillInHref && drillInLabel && (
          <a
            href={drillInHref}
            className="text-xs font-medium transition-colors hover:underline"
            style={{ color: 'var(--color-accent)' }}
            aria-label={drillInLabel}
          >
            {drillInLabel} ›
          </a>
        )}
      </div>

      {/* Card body */}
      <div className="flex-1 px-5 pb-5">
        {error ? (
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--sev-high)' }}>
            <span>⚠</span>
            <span>Failed to load data</span>
          </div>
        ) : (
          children
        )}
      </div>
    </motion.div>
  );
};