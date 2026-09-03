import React from 'react';
import { BarChart2 } from 'lucide-react';
import { DashboardCard } from '../ui/DashboardCard';
import { CardSkeleton } from '../ui/Skeleton';
import { CvssHistogram } from '../charts/CvssHistogram';
import { useCvssDistribution } from '../../api/hooks';

export const CvssDistributionCard: React.FC = () => {
  const { data, isLoading, error } = useCvssDistribution();

  if (isLoading) return <CardSkeleton />;

  return (
    <DashboardCard
      title="CVSS Score Distribution"
      icon={<BarChart2 size={15} />}
      isLoading={isLoading}
      error={error}
      data-testid="card-cvss"
    >
      {data && (
        <>
          <div className="flex gap-4 mb-3">
            {[
              { label: 'Critical (9–10)', color: '#ef4444', count: data.buckets.slice(8).reduce((s, b) => s + b.count, 0) },
              { label: 'High (7–9)',      color: '#f97316', count: data.buckets.slice(6, 8).reduce((s, b) => s + b.count, 0) },
              { label: 'Medium (4–7)',    color: '#eab308', count: data.buckets.slice(3, 6).reduce((s, b) => s + b.count, 0) },
              { label: 'Low (0–4)',       color: '#3b82f6', count: data.buckets.slice(0, 3).reduce((s, b) => s + b.count, 0) },
            ].map(({ label, color, count }) => (
              <div key={label}>
                <div className="text-sm font-bold tabular" style={{ color }}>{count}</div>
                <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{label}</div>
              </div>
            ))}
          </div>
          <CvssHistogram data={data} height={150} />
        </>
      )}
    </DashboardCard>
  );
};