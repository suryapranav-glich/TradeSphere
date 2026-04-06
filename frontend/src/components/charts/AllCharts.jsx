import React, { useState } from 'react';
import {
  ResponsiveContainer, LineChart, Line, Area, AreaChart, ComposedChart as RComposedChart,
  BarChart, Bar, PieChart as RPieChart, Pie, Cell, ScatterChart, Scatter,
  RadarChart as RRadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Treemap as RTreemap, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, LabelList
} from 'recharts';
import { motion } from 'framer-motion';

const COLORS = ["#6c63ff", "#00d4ff", "#ff6b6b", "#ffd93d", "#6bcb77"];

// ─── Custom Tooltip ────────────────────────────────────────
const GlassTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(8,4,25,0.97)', border: '1px solid rgba(108,99,255,0.3)', borderRadius: 12, padding: '12px 16px', boxShadow: '0 20px 40px rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', minWidth: 140 }}>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: '#64748B', marginBottom: 8 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: p.color || COLORS[i % COLORS.length] }} />
          <span style={{ fontSize: 12, color: '#94A3B8' }}>{p.name}:</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#F1F5F9' }}>{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</span>
        </div>
      ))}
    </div>
  );
};

const GRID = { strokeDasharray: "3 3", stroke: "rgba(255,255,255,0.06)" };
const AXIS = { fill: "#64748B", fontSize: 12 };

// Helper to pivot datasets into Recharts format
const transformDatasets = (datasets, labels, xKey) => {
  if (!datasets || !labels) return null;
  return labels.map((label, idx) => {
    const obj = { [xKey]: label };
    datasets.forEach(ds => {
      obj[ds.label] = ds.data[idx];
    });
    return obj;
  });
};

// ─── 1. Line/Area Chart ────────────────────────────────────
export const LineAreaChart = ({ data, datasets, labels, dataKeys, xKey }) => {
  const xK = xKey || 'name';
  const chartData = transformDatasets(datasets, labels, xK) || data;
  const keys = datasets ? datasets.map(d => d.label) : (dataKeys || Object.keys(data[0] || {}).filter(k => k !== xK && typeof data[0][k] === 'number'));
  
  return (
    <ResponsiveContainer width="100%" height={260}>
      <RComposedChart data={chartData} margin={{ top: 10, right: 10, bottom: 5, left: -10 }}>
        <defs>
          {keys.map((k, i) => (
            <linearGradient key={k} id={`grad-${k}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.4} />
              <stop offset="100%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid {...GRID} />
        <XAxis dataKey={xK} tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} />
        <Tooltip content={<GlassTooltip />} />
        <Legend verticalAlign="top" align="center" iconType="circle" wrapperStyle={{ paddingBottom: 15 }} />
        {keys.map((k, i) => (
          <React.Fragment key={k}>
            <Area type="monotone" dataKey={k} fill={`url(#grad-${k})`} stroke="none" fillOpacity={1} isAnimationActive animationDuration={1500} />
            <Line type="monotone" dataKey={k} stroke={COLORS[i % COLORS.length]} strokeWidth={2.5}
              dot={{ r: 4, fill: COLORS[i % COLORS.length], stroke: '#0D0B24', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: COLORS[i % COLORS.length], stroke: '#0D0B24', strokeWidth: 2 }}
              isAnimationActive animationDuration={1500} animationEasing="ease-out" />
          </React.Fragment>
        ))}
      </RComposedChart>
    </ResponsiveContainer>
  );
};

// ─── 2. Vertical Bar Chart ─────────────────────────────────
export const BarChartVertical = ({ data, datasets, labels, dataKeys, xKey }) => {
  const xK = xKey || 'name';
  const chartData = transformDatasets(datasets, labels, xK) || data;
  const keys = datasets ? datasets.map(d => d.label) : (dataKeys || Object.keys(data[0] || {}).filter(k => k !== xK && typeof data[0][k] === 'number'));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 5, left: -10 }}>
        <defs>
          {keys.map((k, i) => (
            <linearGradient key={k} id={`barGrad-${k}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS[i % COLORS.length]} stopOpacity={1} />
              <stop offset="100%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.4} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid {...GRID} />
        <XAxis dataKey={xK} tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} />
        <Tooltip content={<GlassTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Legend verticalAlign="top" align="center" wrapperStyle={{ paddingBottom: 15 }} />
        {keys.map((k, i) => (
          <Bar key={k} dataKey={k} fill={`url(#barGrad-${k})`} radius={[6, 6, 0, 0]} isAnimationActive animationDuration={1200} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
};


// ─── 3. Horizontal Bar Chart ───────────────────────────────
export const BarChartHorizontal = ({ data, dataKeys, xKey }) => {
  const valKey = (dataKeys && dataKeys[0]) || Object.keys(data[0] || {}).find(k => typeof data[0][k] === 'number');
  const catKey = xKey || Object.keys(data[0] || {}).find(k => typeof data[0][k] === 'string');
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart layout="vertical" data={data} margin={{ top: 5, right: 40, bottom: 5, left: 10 }}>
        <CartesianGrid {...GRID} />
        <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey={catKey} width={100} tick={AXIS} axisLine={false} tickLine={false} />
        <Tooltip content={<GlassTooltip />} cursor={{ fill: 'transparent' }} />
        <Bar dataKey={valKey} radius={4} isAnimationActive animationDuration={1200}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          <LabelList dataKey={valKey} position="right" formatter={v => v?.toLocaleString()} style={{ fill: '#94A3B8', fontSize: 12 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

// ─── 4. Pie Chart ──────────────────────────────────────────
export const PieChartComp = ({ data }) => (
  <ResponsiveContainer width="100%" height={260}>
    <RPieChart>
      <Tooltip content={<GlassTooltip />} />
      <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="80%" label={{ fill: '#94A3B8', fontSize: 11 }} isAnimationActive animationDuration={1500} paddingAngle={2}>
        {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="rgba(0,0,0,0.3)" strokeWidth={2} />)}
      </Pie>
    </RPieChart>
  </ResponsiveContainer>
);

// ─── 5. Donut Chart ────────────────────────────────────────
export const DonutChart = ({ data }) => {
  const total = data.reduce((s, d) => s + (d.value || 0), 0);
  return (
    <ResponsiveContainer width="100%" height={260}>
      <RPieChart>
        <Tooltip content={<GlassTooltip />} />
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="55%" outerRadius="80%" paddingAngle={2} isAnimationActive animationDuration={1500}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="rgba(0,0,0,0.3)" strokeWidth={2} />)}
        </Pie>
        <text x="50%" y="48%" textAnchor="middle" fill="#F1F5F9" fontSize={20} fontWeight={700}>{total.toLocaleString()}</text>
        <text x="50%" y="57%" textAnchor="middle" fill="#64748B" fontSize={12}>Total</text>
      </RPieChart>
    </ResponsiveContainer>
  );
};

// ─── 6. Composed Chart ─────────────────────────────────────
export const ComposedChartComp = ({ data, barKey, lineKey, xKey }) => (
  <ResponsiveContainer width="100%" height={260}>
    <RComposedChart data={data} margin={{ top: 10, right: 10, bottom: 5, left: -10 }}>
      <CartesianGrid {...GRID} />
      <XAxis dataKey={xKey || Object.keys(data[0])[0]} tick={AXIS} axisLine={false} tickLine={false} />
      <YAxis yAxisId="left" tick={{ ...AXIS, fill: COLORS[0] }} axisLine={false} tickLine={false} />
      <YAxis yAxisId="right" orientation="right" tick={{ ...AXIS, fill: COLORS[1] }} axisLine={false} tickLine={false} />
      <Tooltip content={<GlassTooltip />} />
      <Bar yAxisId="left" dataKey={barKey || Object.keys(data[0]).find(k => typeof data[0][k] === 'number')} fill={COLORS[0]} radius={[6, 6, 0, 0]} isAnimationActive />
      <Line yAxisId="right" type="monotone" dataKey={lineKey || Object.keys(data[0]).filter(k => typeof data[0][k] === 'number')[1]} stroke={COLORS[1]} strokeWidth={2.5} dot={{ r: 4, fill: COLORS[1], stroke: '#0D0B24', strokeWidth: 2 }} isAnimationActive />
    </RComposedChart>
  </ResponsiveContainer>
);

// ─── 7. Bubble/Scatter Chart ───────────────────────────────
export const BubbleChart = ({ data }) => {
  const numKeys = Object.keys(data[0] || {}).filter(k => typeof data[0][k] === 'number');
  const xK = numKeys[0] || 'spend';
  const yK = numKeys[1] || 'revenue';
  const xMid = data.reduce((s, d) => s + (d[xK] || 0), 0) / data.length;
  const yMid = data.reduce((s, d) => s + (d[yK] || 0), 0) / data.length;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <ScatterChart margin={{ top: 10, right: 10, bottom: 5, left: -10 }}>
        <CartesianGrid {...GRID} />
        <XAxis dataKey={xK} tick={AXIS} axisLine={false} tickLine={false} name={xK} />
        <YAxis dataKey={yK} tick={AXIS} axisLine={false} tickLine={false} name={yK} />
        <Tooltip content={<GlassTooltip />} />
        <ReferenceLine x={xMid} strokeDasharray="6 3" stroke="rgba(255,255,255,0.15)" />
        <ReferenceLine y={yMid} strokeDasharray="6 3" stroke="rgba(255,255,255,0.15)" />
        <Scatter data={data} fill={COLORS[0]} isAnimationActive>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.6} stroke={COLORS[i % COLORS.length]} strokeWidth={1.5} />)}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
};

// ─── 8. Funnel Chart (Custom SVG) ──────────────────────────
export const FunnelChart = ({ data }) => {
  const maxW = 500;
  const minW = maxW * 0.2;
  const stageH = 44;
  const gap = 4;
  const n = data.length;
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
      <svg width={maxW + 200} height={n * (stageH + gap)} viewBox={`0 0 ${maxW + 200} ${n * (stageH + gap)}`}>
        {data.map((d, i) => {
          const w = maxW - (i * (maxW - minW) / Math.max(n - 1, 1));
          const nw = i < n - 1 ? maxW - ((i + 1) * (maxW - minW) / Math.max(n - 1, 1)) : minW * 0.5;
          const cx = maxW / 2;
          const y = i * (stageH + gap);
          const color = COLORS[i % COLORS.length];
          return (
            <motion.g key={i} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }}>
              <polygon points={`${cx - w / 2},${y} ${cx + w / 2},${y} ${cx + nw / 2},${y + stageH} ${cx - nw / 2},${y + stageH}`} fill={color} fillOpacity={0.8} stroke="rgba(0,0,0,0.3)" strokeWidth={1} />
              <text x={cx + maxW / 2 + 16} y={y + 16} fill="white" fontSize={13} fontWeight={500}>{d.stage}</text>
              <text x={cx + maxW / 2 + 16} y={y + 32} fill={COLORS[0]} fontSize={13} fontWeight={600}>{d.count?.toLocaleString()}</text>
              {i < n - 1 && <text x={cx + maxW / 2 + 100} y={y + 32} fill="#64748B" fontSize={12}>→ {d.pct}%</text>}
            </motion.g>
          );
        })}
      </svg>
    </div>
  );
};

// ─── 9. Treemap ────────────────────────────────────────────
const TreemapContent = ({ x, y, width, height, name, size, index }) => {
  if (width < 4 || height < 4) return null;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={COLORS[index % COLORS.length]} fillOpacity={0.8} stroke="rgba(0,0,0,0.4)" strokeWidth={2} rx={4} />
      {width > 60 && height > 35 && <>
        <text x={x + 8} y={y + 18} fill="white" fontSize={12} fontWeight={500}>{name}</text>
        <text x={x + 8} y={y + 34} fill="rgba(255,255,255,0.7)" fontSize={11}>{size?.toLocaleString()}</text>
      </>}
    </g>
  );
};
export const TreemapChart = ({ data, dataKeys, xKey }) => {
  const valKey = (dataKeys && dataKeys[0]) || Object.keys(data[0] || {}).find(k => typeof data[0][k] === 'number');
  const catKey = xKey || Object.keys(data[0] || {}).find(k => typeof data[0][k] === 'string');
  const formattedData = data.map(d => ({ name: d[catKey] || 'Unknown', size: Math.abs(d[valKey] || 0) }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <RTreemap data={formattedData} dataKey="size" nameKey="name" content={<TreemapContent />} isAnimationActive animationDuration={1500} />
    </ResponsiveContainer>
  );
};

// ─── 10. Radar Chart ───────────────────────────────────────
export const RadarChartComp = ({ data, dataKeys, xKey }) => {
  const keys = dataKeys || Object.keys(data[0] || {}).filter(k => k !== xKey && typeof data[0][k] === 'number').slice(0, 2);
  const catKey = xKey || Object.keys(data[0] || {}).find(k => typeof data[0][k] === 'string') || 'name';
  return (
    <ResponsiveContainer width="100%" height={260}>
      <RRadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
        <PolarGrid gridType="polygon" stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
        <PolarAngleAxis dataKey={catKey} tick={{ fontSize: 11, fill: '#94A3B8' }} />
        <PolarRadiusAxis axisLine={false} tick={false} />
        <Tooltip content={<GlassTooltip />} />
        {keys.map((k, i) => (
          <Radar key={k} name={k} dataKey={k} fill={COLORS[i % COLORS.length]} fillOpacity={0.25} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 4, fill: COLORS[i % COLORS.length], stroke: '#0D0B24', strokeWidth: 2 }} isAnimationActive />
        ))}
      </RRadarChart>
    </ResponsiveContainer>
  );
};

// ─── 11. Waterfall Chart ───────────────────────────────────
export const WaterfallChart = ({ data, rawData }) => (
  <ResponsiveContainer width="100%" height={260}>
    <BarChart data={data} margin={{ top: 20, right: 10, bottom: 5, left: -10 }}>
      <CartesianGrid {...GRID} />
      <XAxis dataKey="name" tick={AXIS} axisLine={false} tickLine={false} />
      <YAxis tick={AXIS} axisLine={false} tickLine={false} />
      <Tooltip content={<GlassTooltip />} />
      <Bar dataKey="base" stackId="a" fill="transparent" isAnimationActive={false} />
      <Bar dataKey="value" stackId="a" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={1200}>
        {data.map((d, i) => <Cell key={i} fill={d.type === 'positive' ? '#34D399' : d.type === 'negative' ? '#F87171' : '#4F9EFF'} />)}
        <LabelList dataKey="value" position="top" formatter={v => {
          const item = data.find(d => d.value === v);
          if (!item || item.type === 'total') return `$${(v / 1000).toFixed(0)}K`;
          return item.type === 'positive' ? `+$${(v / 1000).toFixed(0)}K` : `-$${(v / 1000).toFixed(0)}K`;
        }} style={{ fill: '#94A3B8', fontSize: 11 }} />
      </Bar>
    </BarChart>
  </ResponsiveContainer>
);

// ─── 12. Gauge Chart (Custom SVG) ──────────────────────────
export const GaugeChart = ({ value = 75, target = 100 }) => {
  const pct = Math.min(Math.max(value / target, 0), 1);
  const r = 110;
  const cx = 150, cy = 140;
  const circumference = Math.PI * r;
  const dashoffset = circumference * (1 - pct);

  const tickAngle = (p) => Math.PI - p * Math.PI;
  const tickX = (p) => cx + r * Math.cos(tickAngle(p));
  const tickY = (p) => cy - r * Math.sin(tickAngle(p));

  const needleAngle = -90 + pct * 180;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
      <svg viewBox="0 0 300 180" width="100%" style={{ maxWidth: 300 }}>
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F87171" />
            <stop offset="50%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#34D399" />
          </linearGradient>
        </defs>
        {/* Background arc */}
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={24} strokeLinecap="round" />
        {/* Value arc */}
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="url(#gaugeGrad)" strokeWidth={24} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={dashoffset} style={{ transition: 'stroke-dashoffset 1.5s ease' }} />
        {/* Tick marks */}
        {[0, 0.25, 0.5, 0.75, 1].map(p => (
          <g key={p}>
            <line x1={tickX(p)} y1={tickY(p)} x2={cx + (r - 16) * Math.cos(tickAngle(p))} y2={cy - (r - 16) * Math.sin(tickAngle(p))} stroke="rgba(255,255,255,0.3)" strokeWidth={2} />
            <text x={cx + (r + 18) * Math.cos(tickAngle(p))} y={cy - (r + 18) * Math.sin(tickAngle(p)) + 4} textAnchor="middle" fill="#64748B" fontSize={10}>{Math.round(p * 100)}%</text>
          </g>
        ))}
        {/* Needle */}
        <motion.line x1={cx} y1={cy} x2={cx} y2={cy - 85} stroke="white" strokeWidth={3} strokeLinecap="round"
          initial={{ rotate: -90 }} animate={{ rotate: needleAngle }} transition={{ type: 'spring', stiffness: 60, damping: 12 }}
          style={{ transformOrigin: `${cx}px ${cy}px` }} />
        <circle cx={cx} cy={cy} r={8} fill="var(--color-primary)" stroke="#0D0B24" strokeWidth={3} />
        {/* Center text */}
        <text x={cx} y={cy + 36} textAnchor="middle" fill="white" fontSize={28} fontWeight={700}>{value}%</text>
        <text x={cx} y={cy + 54} textAnchor="middle" fill="#94A3B8" fontSize={12}>of target</text>
        {/* Zone labels */}
        <text x={60} y={170} fill="#F87171" fontSize={11}>Low</text>
        <text x={142} y={170} fill="#FBBF24" fontSize={11}>Mid</text>
        <text x={225} y={170} fill="#34D399" fontSize={11}>High</text>
      </svg>
    </div>
  );
};

// ─── Chart Type Map ────────────────────────────────────────
export const chartMap = {
  line: LineAreaChart,
  area: LineAreaChart,
  bar: BarChartVertical,
  hbar: BarChartHorizontal,
  pie: PieChartComp,
  donut: DonutChart,
  composed: ComposedChartComp,
  bubble: BubbleChart,
  scatter: BubbleChart,
  funnel: FunnelChart,
  treemap: TreemapChart,
  radar: RadarChartComp,
  waterfall: WaterfallChart,
  gauge: GaugeChart,
};
