import React from 'react';
import { Bug, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardCard } from '../ui/DashboardCard';
import { CardSkeleton } from '../ui/Skeleton';
import { StatNumber } from '../ui/StatNumber';
import { StackedHorizBar } from '../charts/StackedHorizBar';
import { TimeSeriesBar } from '../charts/TimeSeriesBar';
import { SEVERITY_CONFIG, SEVERITY_ORDER } from '../../config/severity';
import { useFindings } from '../../api/hooks';

export const FindingsSummaryCard: React.FC = () => {
  const { data, isLoading, error } = useFindings();
  const navigate = useNavigate();
  const isEmpty = !data || data.total === 0;

  if (isLoading) return <CardSkeleton />;

  const severitySegments = SEVERITY_ORDER.map(s => ({
    label: SEVERITY_CONFIG[s].label,
    value: data?.bySeverity[s] ?? 0,
    color: SEVERITY_CONFIG[s].chartColor,
  }));
  const total = data?.total ?? 0;

  return (
    <DashboardCard
      title="Findings — Last 24h"
      icon={<Bug size={15} />}
      drillInHref="/findings"
      drillInLabel="Manage findings"
      isLoading={isLoading}
      error={error}
      data-testid="card-findings"
    >
      {data && (
        <>
          {/* Big number */}
          <div className="mb-3">
            <span className="text-4xl font-bold tabular" style={{ color: 'var(--color-text)' }}>
              <StatNumber value={total} />
            </span>
            <span className="ml-2 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
              total findings
            </span>
          </div>

          {/* Sub-stats */}
          <div className="flex gap-5 mb-4">
            {[
              { label: 'New',         val: data.newCount,   color: 'var(--sev-critical)' },
              { label: 'In Progress', val: data.inProgress, color: 'var(--sev-high)'     },
              { label: 'Resolved',    val: data.resolved,   color: 'var(--color-accent)' },
            ].map(({ label, val, color }) => (
              <div key={label}>
                <div className="text-xl font-bold tabular" style={{ color }}>
                  <StatNumber value={val} />
                </div>
                <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Severity bar */}
          {!isEmpty ? (
            <>
              <div className="mb-4">
                <div className="text-xs mb-1.5 font-medium" style={{ color: 'var(--color-text-muted)' }}>By severity</div>
                <StackedHorizBar segments={severitySegments} total={total} />
              </div>
              <div className="mb-3">
                <div className="text-xs mb-1 font-medium" style={{ color: 'var(--color-text-muted)' }}>Findings by scan run</div>
                <TimeSeriesBar data={data.overTime} height={110} />
              </div>
            </>
          ) : (
            <EmptyPlaceholder onAction={() => navigate('/scans')} label="Run a scan to see findings" />
          )}

          {/* Footer */}
          <div className="flex gap-6 pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
            <div>
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Mean detect </span>
              <span className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>{data.meanTimeToDetect}</span>
            </div>
            <div>
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Mean remediate </span>
              <span className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>{data.meanTimeToRemediate}</span>
            </div>
          </div>
        </>
      )}
    </DashboardCard>
  );
};

const EmptyPlaceholder: React.FC<{ label: string; onAction: () => void }> = ({ label, onAction }) => (
  <div
    className="rounded-xl flex flex-col items-center justify-center gap-2 py-7 mb-3 cursor-pointer transition-colors"
    style={{ background: 'var(--color-surface-2)', border: '1px dashed var(--color-border)' }}
    onClick={onAction}
    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-accent)')}
    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
    role="button"
    tabIndex={0}
    onKeyDown={e => e.key === 'Enter' && onAction()}
  >
    <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
    <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-accent)' }}>
      Go to Scans <ArrowRight size={11} />
    </span>
  </div>
);