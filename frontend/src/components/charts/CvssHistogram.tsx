import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { CvssDistribution } from '../../api/client';

interface CvssHistogramProps {
  data: CvssDistribution;
  height?: number;
}

export const CvssHistogram: React.FC<CvssHistogramProps> = ({ data, height = 140 }) => (
  <ResponsiveContainer width="100%" height={height}>
    <BarChart data={data.buckets} barSize={14} barGap={2}>
      <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--color-border)" />
      <XAxis
        dataKey="range"
        tick={{ fontSize: 9, fill: 'var(--color-text-faint)' }}
        axisLine={false}
        tickLine={false}
        label={{ value: 'CVSS Score', position: 'insideBottom', offset: -2, fontSize: 10, fill: 'var(--color-text-muted)' }}
        height={30}
      />
      <YAxis
        tick={{ fontSize: 9, fill: 'var(--color-text-faint)' }}
        axisLine={false}
        tickLine={false}
        width={32}
      />
      <Tooltip
        formatter={(v: any) => [v, 'Findings']}
        labelFormatter={(l) => `CVSS ${l}`}
        contentStyle={{ fontSize: 12 }}
        cursor={{ fill: 'var(--color-surface-2)' }}
      />
      <Bar dataKey="count" radius={[3, 3, 0, 0]}>
        {data.buckets.map((entry, i) => (
          <Cell key={i} fill={entry.color} fillOpacity={0.85} />
        ))}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
);