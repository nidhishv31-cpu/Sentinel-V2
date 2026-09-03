import React from 'react';
import { ScanLine, CheckCircle2, AlertCircle, Clock, XCircle } from 'lucide-react';
import { DashboardCard } from '../ui/DashboardCard';
import { CardSkeleton } from '../ui/Skeleton';
import { Badge } from '../ui/Badge';
import { useScanHistory } from '../../api/hooks';
import type { ScanRun } from '../../api/client';

const StatusIcon: React.FC<{ status: ScanRun['status'] }> = ({ status }) => {
  if (status === 'completed') return <CheckCircle2 size={13} style={{ color: '#10b981' }} />;
  if (status === 'running')   return <Clock size={13} style={{ color: 'var(--sev-medium)' }} />;
  if (status === 'failed')    return <XCircle size={13} style={{ color: 'var(--sev-critical)' }} />;
  return <AlertCircle size={13} style={{ color: 'var(--color-text-faint)' }} />;
};

const statusLabel: Record<ScanRun['status'], string> = {
  completed: 'Completed',
  running:   'Running',
  failed:    'Failed',
  scheduled: 'Scheduled',
};

export const RecentScansCard: React.FC = () => {
  const { data, isLoading, error } = useScanHistory();

  if (isLoading) return <CardSkeleton />;

  return (
    <DashboardCard
      title="Recent Scan Runs"
      icon={<ScanLine size={15} />}
      drillInHref="/scans/history"
      drillInLabel="View all scans"
      isLoading={isLoading}
      error={error}
      data-testid="card-recent-scans"
    >
      {data && (
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-xs" style={{ minWidth: 500 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['Target', 'Status', 'Started', 'Duration', 'Findings', 'Max Sev'].map(h => (
                  <th key={h} className="pb-2 pr-3 text-left font-semibold"
                    style={{ color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((run, i) => (
                <tr
                  key={run.id}
                  className="transition-colors"
                  style={{
                    borderBottom: i < data.length - 1 ? '1px solid var(--color-border)' : 'none',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface-2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td className="py-2 pr-3 font-mono" style={{ color: 'var(--color-text)', maxWidth: 160 }}>
                    <span className="truncate block">{run.target}</span>
                  </td>
                  <td className="py-2 pr-3">
                    <span className="flex items-center gap-1">
                      <StatusIcon status={run.status} />
                      <span style={{ color: 'var(--color-text-muted)' }}>{statusLabel[run.status]}</span>
                    </span>
                  </td>
                  <td className="py-2 pr-3 tabular" style={{ color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                    {run.startedAt}
                  </td>
                  <td className="py-2 pr-3 tabular" style={{ color: 'var(--color-text-muted)' }}>
                    {run.duration}
                  </td>
                  <td className="py-2 pr-3 tabular" style={{ color: 'var(--color-text)' }}>
                    {run.findingsCount}
                  </td>
                  <td className="py-2">
                    <Badge severity={run.maxSeverity} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardCard>
  );
};