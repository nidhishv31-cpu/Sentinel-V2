import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { DashboardCard } from '../ui/DashboardCard';
import { CardSkeleton } from '../ui/Skeleton';
import { StatNumber } from '../ui/StatNumber';
import { SeverityDonut } from '../charts/SeverityDonut';
import { useCompliance } from '../../api/hooks';

export const ComplianceCard: React.FC = () => {
  const { data, isLoading, error } = useCompliance();

  if (isLoading) return <CardSkeleton />;

  return (
    <DashboardCard
      title="Compliance Analytics"
      icon={<ShieldCheck size={15} />}
      drillInHref="/reports"
      drillInLabel="Improve your coverage"
      isLoading={isLoading}
      error={error}
      data-testid="card-compliance"
    >
      {data && (
        <>
          {/* Donut */}
          <SeverityDonut data={data} centerLabel={data.totalActiveChecks} />

          {/* Legend */}
          <div className="flex gap-5 justify-center mt-1 mb-4">
            {[
              { label: 'Enabled',       val: data.enabled,       color: '#10b981' },
              { label: 'Disabled',      val: data.disabled,      color: 'var(--sev-high)' },
              { label: 'Auto-disabled', val: data.autoDisabled,  color: 'var(--color-text-faint)' },
            ].map(({ label, val, color }) => (
              <div key={label} className="text-center">
                <div className="text-xl font-bold tabular" style={{ color }}>
                  <StatNumber value={val} />
                </div>
                <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* OWASP breakdown list */}
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '10px' }}>
            <div className="text-xs mb-2 font-medium" style={{ color: 'var(--color-text-muted)' }}>
              OWASP Top 10 breakdown
            </div>
            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              {data.owaspBreakdown.slice(0, 6).map((row) => (
                <div key={row.short} className="flex items-center gap-2">
                  <span className="text-xs font-mono px-1 rounded"
                    style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)', minWidth: 28, textAlign: 'center' }}>
                    {row.short}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-0.5">
                      <span className="text-xs truncate" style={{ color: 'var(--color-text)' }}>{row.category}</span>
                      <span className="text-xs tabular ml-2" style={{ color: 'var(--color-text-muted)' }}>{row.count}</span>
                    </div>
                    <div className="h-1 rounded-full" style={{ background: 'var(--color-surface-2)' }}>
                      <div
                        className="h-1 rounded-full"
                        style={{
                          width: `${Math.min((row.count / 350) * 100, 100)}%`,
                          backgroundColor: `var(--sev-${row.severity})`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </DashboardCard>
  );
};