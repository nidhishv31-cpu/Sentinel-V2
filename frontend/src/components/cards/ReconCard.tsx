import React from 'react';
import { Radar, Wifi, WifiOff } from 'lucide-react';
import { DashboardCard } from '../ui/DashboardCard';
import { CardSkeleton } from '../ui/Skeleton';
import { SimpleBar } from '../charts/StackedHorizBar';
import { useRecon } from '../../api/hooks';
import { SEVERITY_CONFIG } from '../../config/severity';

export const ReconCard: React.FC = () => {
  const { data, isLoading, error } = useRecon();

  if (isLoading) return <CardSkeleton />;

  const requestsData = data?.requestsPerWindow.map(r => ({
    label: r.label,
    value: r.requests,
  })) ?? [];

  const typeColors: Record<string, string> = {
    'Open Ports': SEVERITY_CONFIG.high.chartColor,
    'Subdomains': SEVERITY_CONFIG.low.chartColor,
    'Exposed Files': SEVERITY_CONFIG.critical.chartColor,
    'Outdated Libs': SEVERITY_CONFIG.medium.chartColor,
  };

  return (
    <DashboardCard
      title="Recon / Attack Surface — Last 24h"
      icon={<Radar size={15} />}
      isLoading={isLoading}
      error={error}
      data-testid="card-recon"
    >
      {data && (
        <>
          {/* Requests chart */}
          <div className="mb-3">
            <div className="text-xs mb-1 font-medium" style={{ color: 'var(--color-text-muted)' }}>
              Requests sent per window
            </div>
            <SimpleBar
              data={requestsData}
              color="var(--color-accent)"
              height={100}
              label="Requests"
            />
          </div>

          {/* Connectors sub-panel */}
          <div className="flex gap-4 mb-4 p-3 rounded-lg" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
            <div className="flex items-center gap-2">
              <WifiOff size={14} style={{ color: 'var(--sev-high)' }} />
              <div>
                <div className="text-lg font-bold tabular" style={{ color: 'var(--sev-high)' }}>
                  {data.connectors.unhealthy}
                </div>
                <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Unhealthy</div>
              </div>
            </div>
            <div className="w-px" style={{ background: 'var(--color-border)' }} />
            <div className="flex items-center gap-2">
              <Wifi size={14} style={{ color: '#10b981' }} />
              <div>
                <div className="text-lg font-bold tabular" style={{ color: '#10b981' }}>
                  {data.connectors.active}
                </div>
                <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Active</div>
              </div>
            </div>
            <div className="flex-1 flex items-center gap-2 flex-wrap ml-2">
              {data.integrationStatus.map(s => (
                <span key={s.name} className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                  style={{
                    background: s.status === 'healthy' ? 'rgba(16,185,129,0.12)' : 'var(--sev-high-bg)',
                    color: s.status === 'healthy' ? '#10b981' : 'var(--sev-high)',
                  }}>
                  {s.name}
                </span>
              ))}
            </div>
          </div>

          {/* Recon findings by type */}
          <div>
            <div className="text-xs mb-2 font-medium" style={{ color: 'var(--color-text-muted)' }}>
              Recon findings by type (16K total)
            </div>
            <div className="flex h-2.5 rounded-full overflow-hidden w-full mb-2">
              {data.findingsByType.map((t) => {
                const total = data.findingsByType.reduce((s, x) => s + x.count, 0);
                return (
                  <div
                    key={t.type}
                    title={`${t.type}: ${t.count.toLocaleString()}`}
                    style={{
                      width: `${(t.count / total) * 100}%`,
                      backgroundColor: typeColors[t.type] ?? 'var(--color-accent)',
                    }}
                  />
                );
              })}
            </div>
            <div className="flex flex-wrap gap-3">
              {data.findingsByType.map((t) => (
                <span key={t.type} className="flex items-center gap-1 text-xs"
                  style={{ color: 'var(--color-text-muted)' }}>
                  <span className="w-2 h-2 rounded-full inline-block"
                    style={{ backgroundColor: typeColors[t.type] ?? 'var(--color-accent)' }} />
                  {t.type} ({(t.count / 1000).toFixed(1)}K)
                </span>
              ))}
            </div>
          </div>
        </>
      )}
    </DashboardCard>
  );
};