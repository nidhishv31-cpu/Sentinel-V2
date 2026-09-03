// Single source of truth for severity levels
export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface SeverityConfig {
  key: SeverityLevel;
  label: string;
  color: string;       // CSS variable reference
  bgColor: string;
  textColor: string;
  chartColor: string;  // raw hex for recharts (resolves at build time per theme)
}

export const SEVERITY_CONFIG: Record<SeverityLevel, SeverityConfig> = {
  critical: {
    key: 'critical',
    label: 'Critical',
    color: 'var(--sev-critical)',
    bgColor: 'var(--sev-critical-bg)',
    textColor: 'var(--sev-critical)',
    chartColor: '#ef4444',
  },
  high: {
    key: 'high',
    label: 'High',
    color: 'var(--sev-high)',
    bgColor: 'var(--sev-high-bg)',
    textColor: 'var(--sev-high)',
    chartColor: '#f97316',
  },
  medium: {
    key: 'medium',
    label: 'Medium',
    color: 'var(--sev-medium)',
    bgColor: 'var(--sev-medium-bg)',
    textColor: 'var(--sev-medium)',
    chartColor: '#eab308',
  },
  low: {
    key: 'low',
    label: 'Low',
    color: 'var(--sev-low)',
    bgColor: 'var(--sev-low-bg)',
    textColor: 'var(--sev-low)',
    chartColor: '#3b82f6',
  },
  info: {
    key: 'info',
    label: 'Info',
    color: 'var(--sev-info)',
    bgColor: 'var(--sev-info-bg)',
    textColor: 'var(--sev-info)',
    chartColor: '#6b7280',
  },
};

export const SEVERITY_ORDER: SeverityLevel[] = ['critical', 'high', 'medium', 'low', 'info'];

export function getSeverityConfig(level: SeverityLevel): SeverityConfig {
  return SEVERITY_CONFIG[level];
}
