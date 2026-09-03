import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';
import { SEVERITY_CONFIG } from '../../config/severity';
import type { FindingsSummary } from '../../api/client';

interface TimeSeriesBarProps {
  data: FindingsSummary['overTime'];
  height?: number;
}

const BARS: { key: keyof FindingsSummary['overTime'][0]; color: string }[] = [
  { key: 'critical', color: SEVERITY_CONFIG.critical.chartColor },
  { key: 'high',     color: SEVERITY_CONFIG.high.chartColor     },
  { key: 'medium',   color: SEVERITY_CONFIG.medium.chartColor   },
  { key: 'low',      color: SEVERITY_CONFIG.low.chartColor      },
  { key: 'info',     color: SEVERITY_CONFIG.info.chartColor     },
];

export const TimeSeriesBar: React.FC<TimeSeriesBarProps> = ({ data, height = 130 }) => (
  <ResponsiveContainer width="100%" height={height}>
    <BarChart data={data} barSize={8} barGap={1}>
      <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--color-border)" />
      <XAxis
        dataKey="label"
        tick={{ fontSize: 10, fill: 'var(--color-text-faint)' }}
        axisLine={false}
        tickLine={false}
      />
      <YAxis
        tick={{ fontSize: 10, fill: 'var(--color-text-faint)' }}
        axisLine={false}
        tickLine={false}
        width={30}
      />
      <Tooltip
        contentStyle={{ fontSize: 12 }}
        cursor={{ fill: 'var(--color-surface-2)' }}
      />
      {BARS.map(({ key, color }) => (
        <Bar key={key as string} dataKey={key as string} stackId="a" fill={color} radius={key === 'info' ? [3, 3, 0, 0] : [0, 0, 0, 0]} />
      ))}
    </BarChart>
  </ResponsiveContainer>
);