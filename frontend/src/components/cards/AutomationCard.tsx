import React from 'react';
import { Zap, CheckCircle, AlertTriangle } from 'lucide-react';
import { DashboardCard } from '../ui/DashboardCard';
import { CardSkeleton } from '../ui/Skeleton';
import { StatNumber } from '../ui/StatNumber';
import { useAutomation } from '../../api/hooks';
import {
  BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

export const AutomationCard: React.FC = () => {
  const { data, isLoading, error } = useAutomation();

  if (isLoading) return <CardSkeleton />;

  const healthIcon = data?.playbookHealth === 'healthy'
    ? <CheckCircle size={14} style={{ color: '#10b981' }} />
    : <AlertTriangle size={14} style={{ color: 'var(--sev-high)' }} />;

  return (
    <DashboardCard
      title="Automation — Last 24h"
      icon={<Zap size={15} />}
      drillInHref="/automation"
      drillInLabel="View workbook"
      isLoading={isLoading}
      error={error}
      data-testid="card-automation"
    >
      {data && (
        <>
          {/* Top stats row */}
          <div className="flex gap-8 mb-4">
            <div>
              <div className="text-xs mb-0.5" style={{ color: 'var(--color-text-muted)' }}>Scans completed</div>
              <div className="text-4xl font-bold tabular" style={{ color: 'var(--color-text)' }}>
                <StatNumber value={data.scansCompleted} />
              </div>
            </div>
            <div>
              <div className="text-xs mb-0.5" style={{ color: 'var(--color-text-muted)' }}>Time saved</div>
              <div className="text-4xl font-bold tabular" style={{ color: 'var(--color-text)' }}>
                <StatNumber value={data.timeSavedHours} suffix="h" decimals={1} />
              </div>
            </div>
            <div>
              <div className="text-xs mb-0.5" style={{ color: 'var(--color-text-muted)' }}>Playbook health</div>
              <div className="flex items-center gap-1 mt-1">
                {healthIcon}
                <span className="text-sm font-semibold capitalize" style={{
                  color: data.playbookHealth === 'healthy' ? '#10b981' : 'var(--sev-high)'
                }}>
                  {data.playbookHealth}
                </span>
              </div>
            </div>
          </div>

          {/* Actions breakdown */}
          <div className="mb-4">
            <div className="text-xs mb-2 font-medium" style={{ color: 'var(--color-text-muted)' }}>
              Actions performed ({data.actionsPerformed})
            </div>
            <ResponsiveContainer width="100%" height={90}>
              <BarChart data={data.actionBreakdown} layout="vertical" barSize={10}>
                <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--color-text-faint)' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: any) => [v, 'Actions']} contentStyle={{ fontSize: 12 }} cursor={{ fill: 'var(--color-surface-2)' }} />
                <Bar dataKey="value" radius={[0, 3, 3, 0]}>
                  {data.actionBreakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex gap-3 flex-wrap mt-1">
              {data.actionBreakdown.map((a) => (
                <span key={a.name} className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: a.color }} />
                  {a.name}
                </span>
              ))}
            </div>
          </div>

          {/* Callout */}
          <div
            className="rounded-lg px-3 py-2 flex items-center justify-between"
            style={{ background: 'var(--color-accent-muted)', border: '1px solid var(--color-border)' }}
          >
            <span className="text-xs" style={{ color: 'var(--color-text)' }}>
              <strong>{data.activeScheduledScans} active</strong> scheduled scans
            </span>
            <a href="/automation" className="text-xs font-medium" style={{ color: 'var(--color-accent)' }}>
              Configure cron rules ›
            </a>
          </div>
        </>
      )}
    </DashboardCard>
  );
};