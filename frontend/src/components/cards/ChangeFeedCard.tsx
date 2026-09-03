import React from 'react';
import { Activity, Plus, Minus, Edit2, CheckCircle, AlertTriangle } from 'lucide-react';
import { DashboardCard } from '../ui/DashboardCard';
import { CardSkeleton } from '../ui/Skeleton';
import { Badge } from '../ui/Badge';
import { useChangeFeed } from '../../api/hooks';
import type { ChangeEntry } from '../../api/client';

const typeConfig: Record<ChangeEntry['type'], { icon: React.ReactNode; label: string; color: string }> = {
  'new-finding':    { icon: <AlertTriangle size={12} />, label: 'New finding',   color: 'var(--sev-high)'     },
  'new-endpoint':   { icon: <Plus size={12} />,          label: 'New endpoint',  color: 'var(--color-accent)' },
  'removed-endpoint': { icon: <Minus size={12} />,       label: 'Removed',       color: 'var(--color-text-muted)' },
  'header-change':  { icon: <Edit2 size={12} />,         label: 'Header change', color: 'var(--sev-medium)'   },
  'resolved':       { icon: <CheckCircle size={12} />,   label: 'Resolved',      color: '#10b981'             },
};

export const ChangeFeedCard: React.FC = () => {
  const { data, isLoading, error } = useChangeFeed();

  if (isLoading) return <CardSkeleton />;

  return (
    <DashboardCard
      title="Change-Monitoring Feed"
      icon={<Activity size={15} />}
      drillInHref="/findings"
      drillInLabel="View all changes"
      isLoading={isLoading}
      error={error}
      data-testid="card-change-feed"
    >
      {data && (
        <div className="space-y-2">
          {data.map((entry) => {
            const cfg = typeConfig[entry.type];
            return (
              <div
                key={entry.id}
                className="flex gap-3 items-start p-2.5 rounded-lg transition-colors"
                style={{ border: '1px solid var(--color-border)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface-2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {/* Type icon */}
                <span
                  className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full mt-0.5"
                  style={{ background: 'var(--color-surface-2)', color: cfg.color }}
                >
                  {cfg.icon}
                </span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
                      {entry.site}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                      style={{ color: cfg.color, background: 'var(--color-surface-2)' }}>
                      {cfg.label}
                    </span>
                    {entry.severity && <Badge severity={entry.severity} size="sm" />}
                  </div>
                  <p className="text-xs leading-snug" style={{ color: 'var(--color-text-muted)' }}>
                    {entry.description}
                  </p>
                </div>

                {/* Timestamp */}
                <span className="flex-shrink-0 text-xs" style={{ color: 'var(--color-text-faint)' }}>
                  {entry.timestamp}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </DashboardCard>
  );
};