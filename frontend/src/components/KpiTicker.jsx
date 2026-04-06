import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';

const INITIAL_KPIS = [
  { name: 'Total Revenue', value: '$4.2M', raw: 4.2, dir: 'up' },
  { name: 'Churn Rate', value: '3.1%', raw: 3.1, dir: 'down' },
  { name: 'New Customers', value: '1,842', raw: 1842, dir: 'up' },
  { name: 'Avg Deal Size', value: '$12,400', raw: 12400, dir: 'up' },
  { name: 'Win Rate', value: '67%', raw: 67, dir: 'up' },
  { name: 'CAC', value: '$340', raw: 340, dir: 'down' },
  { name: 'NPS Score', value: '72', raw: 72, dir: 'up' },
  { name: 'MoM Growth', value: '+8.3%', raw: 8.3, dir: 'up' },
];

const KpiTicker = () => {
  const [kpis, setKpis] = useState(INITIAL_KPIS);
  const [flashIdx, setFlashIdx] = useState(-1);
  const [paused, setPaused] = useState(false);

  // Random tick every 4s
  useEffect(() => {
    const interval = setInterval(() => {
      const idx = Math.floor(Math.random() * kpis.length);
      setFlashIdx(idx);
      setKpis(prev => prev.map((k, i) => {
        if (i !== idx) return k;
        const delta = k.raw * (0.01 + Math.random() * 0.02) * (Math.random() > 0.5 ? 1 : -1);
        const newRaw = +(k.raw + delta).toFixed(k.raw > 100 ? 0 : 1);
        let newVal = k.value;
        if (k.value.startsWith('$') && k.value.includes('M')) newVal = `$${newRaw}M`;
        else if (k.value.startsWith('$') && k.raw > 1000) newVal = `$${Math.round(newRaw).toLocaleString()}`;
        else if (k.value.startsWith('$')) newVal = `$${Math.round(newRaw)}`;
        else if (k.value.includes('%')) newVal = k.value.startsWith('+') ? `+${newRaw}%` : `${newRaw}%`;
        else if (k.raw > 100) newVal = Math.round(newRaw).toLocaleString();
        else newVal = String(newRaw);
        return { ...k, raw: newRaw, value: newVal };
      }));
      setTimeout(() => setFlashIdx(-1), 500);
    }, 4000);
    return () => clearInterval(interval);
  }, [kpis]);

  const Arrow = ({ dir }) => {
    if (dir === 'up') return <TrendingUp size={14} color="var(--color-success)" />;
    if (dir === 'down') return <TrendingDown size={14} color="var(--color-danger)" />;
    return <ArrowRight size={14} color="var(--color-muted)" />;
  };

  const renderKpi = (kpi, i, offset) => (
    <div key={`${offset}-${i}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0 28px', height: 38, borderRight: '1px solid rgba(255,255,255,0.08)', whiteSpace: 'nowrap' }}>
      <span style={{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(148,163,184,0.7)' }}>{kpi.name}</span>
      <span className="tabular-nums" style={{ fontSize: 13, fontWeight: 600, color: flashIdx === i ? 'white' : 'var(--color-text)', textShadow: flashIdx === i ? '0 0 12px white' : 'none', transition: 'all 0.3s' }}>{kpi.value}</span>
      <Arrow dir={kpi.dir} />
    </div>
  );

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{ position: 'fixed', top: 64, left: 0, width: '100%', height: 38, zIndex: 99, background: 'rgba(5,2,20,0.9)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}
    >
      <div style={{ display: 'flex', width: 'fit-content', animation: 'ticker-scroll 40s linear infinite', animationPlayState: paused ? 'paused' : 'running' }}>
        {kpis.map((k, i) => renderKpi(k, i, 'a'))}
        {kpis.map((k, i) => renderKpi(k, i, 'b'))}
      </div>
    </div>
  );
};

export default KpiTicker;
