import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

interface BarData {
  label: string;
  value: number;
  color?: string;
}

interface StackedHorizBarProps {
  /** For simple horizontal bar: array of { label, value, color } */
  segments: BarData[];
  total: number;
  height?: number;
  showLabels?: boolean;
}

export const StackedHorizBar: React.FC<StackedHorizBarProps> = ({
  segments, total, showLabels = true
}) => {
  return (
    <div className="w-full">
      {/* Stacked bar */}
      <div className="flex h-3 rounded-full overflow-hidden w-full" role="img" aria-label="Severity distribution">
        {segments.map((seg) => (
          <div
            key={seg.label}
            title={`${seg.label}: ${seg.value}`}
            style={{
              width: `${(seg.value / total) * 100}%`,
              backgroundColor: seg.color ?? 'var(--color-accent)',
              minWidth: seg.value > 0 ? 2 : 0,
            }}
          />
        ))}
      </div>
      {/* Legend */}
      {showLabels && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
          {segments.map((seg) => (
            <span key={seg.label} className="flex items-center gap-1 text-xs"
              style={{ color: 'var(--color-text-muted)' }}>
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ backgroundColor: seg.color }}
              />
              {seg.label} ({seg.value.toLocaleString()})
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

/** Simple vertical bar chart for recon data */
interface SimpleBarProps {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
  label?: string;
}

export const SimpleBar: React.FC<SimpleBarProps> = ({ data, color = 'var(--color-accent)', height = 110, label }) => (
  <ResponsiveContainer width="100%" height={height}>
    <BarChart data={data} barSize={10}>
      <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--color-border)" />
      <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--color-text-faint)' }} axisLine={false} tickLine={false} />
      <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-faint)' }} axisLine={false} tickLine={false} width={36} />
      <Tooltip
        formatter={(v: any) => [Number(v).toLocaleString(), label ?? 'Value']}
        contentStyle={{ fontSize: 12 }}
        cursor={{ fill: 'var(--color-surface-2)' }}
      />
      <Bar dataKey="value" radius={[3, 3, 0, 0]}>
        {data.map((_, i) => (
          <Cell key={i} fill={color} fillOpacity={0.85} />
        ))}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
);