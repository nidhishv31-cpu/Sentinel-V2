import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { SEVERITY_CONFIG, SEVERITY_ORDER } from '../../config/severity';
import type { ComplianceData } from '../../api/client';

interface SeverityDonutProps {
  data: ComplianceData;
  centerLabel?: string | number;
}

const RADIAN = Math.PI / 180;

const renderCustomLabel = (props: any) => {
  const { cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, percent = 0 } = props;
  if (percent < 0.06) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
      fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export const SeverityDonut: React.FC<SeverityDonutProps> = ({ data, centerLabel }) => {
  // Aggregate by severity
  const bySev = SEVERITY_ORDER.reduce((acc, sev) => {
    acc[sev] = data.owaspBreakdown.filter(r => r.severity === sev).reduce((s, r) => s + r.count, 0);
    return acc;
  }, {} as Record<string, number>);

  const chartData = SEVERITY_ORDER
    .filter(s => bySev[s] > 0)
    .map(s => ({ name: SEVERITY_CONFIG[s].label, value: bySev[s], color: SEVERITY_CONFIG[s].chartColor }));

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            dataKey="value"
            labelLine={false}
            label={renderCustomLabel}
          >
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={entry.color} stroke="none" />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: any, name: any) => [Number(value).toLocaleString(), name]}
            contentStyle={{ fontSize: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Center label */}
      {centerLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold tabular" style={{ color: 'var(--color-text)' }}>
            {centerLabel}
          </span>
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>checks</span>
        </div>
      )}
    </div>
  );
};