import React from 'react';

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', style }) => (
  <div className={`skeleton ${className}`} style={style} aria-hidden="true" />
);

// Pre-built card skeleton that matches DashboardCard proportions
export const CardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`card p-5 ${className}`}>
    <div className="flex items-center gap-3 mb-4">
      <Skeleton className="w-8 h-8 rounded-lg" />
      <Skeleton className="h-4 w-32" />
    </div>
    <Skeleton className="h-10 w-24 mb-3" />
    <div className="flex gap-4 mb-4">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-3 w-16" />
    </div>
    <Skeleton className="h-24 w-full mb-3" />
    <Skeleton className="h-3 w-28" />
  </div>
);