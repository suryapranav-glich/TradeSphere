import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart2, Table as TableIcon, Download, Sparkles } from 'lucide-react';
import { chartMap } from './charts/AllCharts';

const ACCENT_GRADIENTS = {
  line: 'linear-gradient(90deg, #4F9EFF, #22D3EE)', area: 'linear-gradient(90deg, #4F9EFF, #22D3EE)',
  bar: 'linear-gradient(90deg, #A78BFA, #7C3AED)', hbar: 'linear-gradient(90deg, #A78BFA, #7C3AED)',
  pie: 'linear-gradient(90deg, #34D399, #059669)', donut: 'linear-gradient(90deg, #34D399, #059669)',
  funnel: 'linear-gradient(90deg, #4F9EFF, #A78BFA)', radar: 'linear-gradient(90deg, #FBBF24, #F59E0B)',
  gauge: 'linear-gradient(90deg, #F87171, #EF4444)', geo: 'linear-gradient(90deg, #22D3EE, #0891B2)',
  composed: 'linear-gradient(90deg, #4F9EFF, #A78BFA)', bubble: 'linear-gradient(90deg, #34D399, #22D3EE)',
  scatter: 'linear-gradient(90deg, #34D399, #22D3EE)', waterfall: 'linear-gradient(90deg, #34D399, #F87171)',
  treemap: 'linear-gradient(90deg, #FBBF24, #A78BFA)',
};

const ChartCard = ({ chart, delay = 0 }) => {
  const [view, setView] = useState('chart');
  const [insightText, setInsightText] = useState('');
  const ChartComp = chartMap[chart.type];

  // Typewriter insight animation
  useEffect(() => {
    if (!chart.insight) return;
    const timeout = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        i++;
        setInsightText(chart.insight.slice(0, i));
        if (i >= chart.insight.length) clearInterval(interval);
      }, 30);
      return () => clearInterval(interval);
    }, 500 + delay * 100);
    return () => clearTimeout(timeout);
  }, [chart.insight, delay]);

  const handleCSV = () => {
    if (!chart.data?.length) return;
    const isArray = Array.isArray(chart.data);
    const rows = isArray ? chart.data : [];
    if (!rows.length) return;
    const keys = Object.keys(rows[0]);
    const csv = [keys.join(','), ...rows.map(r => keys.map(k => r[k]).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `queryiq-${chart.title.replace(/\s+/g, '-').toLowerCase()}-data.csv`;
    a.click();
  };

  const renderTable = () => {
    const rows = Array.isArray(chart.data) ? chart.data : [];
    if (!rows.length) return <div style={{ padding: 20, color: 'var(--color-dim)' }}>No data</div>;
    const keys = Object.keys(rows[0]);
    return (
      <div style={{ overflowY: 'auto', maxHeight: 240 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'rgba(var(--color-primary-rgb),0.15)' }}>
              {keys.map(k => <th key={k} style={{ padding: '10px 12px', color: 'var(--color-primary)', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.05em', textAlign: 'left' }}>{k}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                {keys.map(k => <td key={k} style={{ padding: '9px 12px' }}>{typeof r[k] === 'number' ? r[k].toLocaleString() : r[k]}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: delay * 0.1, duration: 0.5, ease: 'easeOut' }} className="glass-card" style={{ overflow: 'hidden' }}>
      {/* Top accent */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: ACCENT_GRADIENTS[chart.type] || ACCENT_GRADIENTS.bar, borderRadius: '20px 20px 0 0' }} />

      {/* Header */}
      <div style={{ padding: '18px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)' }}>{chart.title}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 10, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, letterSpacing: 0.5, background: 'rgba(var(--color-primary-rgb),0.15)', color: 'var(--color-primary)' }}>
            {chart.type.toUpperCase()}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 2, background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 2 }}>
          <button onClick={() => setView('chart')} style={{ width: 28, height: 28, borderRadius: 6, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: view === 'chart' ? 'rgba(var(--color-primary-rgb),0.2)' : 'transparent' }}>
            <BarChart2 size={14} color={view === 'chart' ? 'var(--color-primary)' : '#475569'} />
          </button>
          <button onClick={() => setView('table')} style={{ width: 28, height: 28, borderRadius: 6, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: view === 'table' ? 'rgba(var(--color-primary-rgb),0.2)' : 'transparent' }}>
            <TableIcon size={14} color={view === 'table' ? 'var(--color-primary)' : '#475569'} />
          </button>
        </div>
      </div>

      {/* Chart/Table Area */}
      <div style={{ padding: '16px 16px 8px' }}>
        <AnimatePresence mode="wait">
          {view === 'chart' ? (
            <motion.div key="chart" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}>
              {ChartComp ? <ChartComp {...chart} /> : <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-dim)' }}>Chart type not available</div>}
            </motion.div>
          ) : (
            <motion.div key="table" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}>
              {renderTable()}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button onClick={handleCSV} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, fontSize: 12, color: 'var(--color-muted)', cursor: 'pointer' }}>
                  <Download size={12} /> Download CSV
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* AI Insight Strip */}
      {chart.insight && (
        <div style={{ background: 'rgba(var(--color-primary-rgb),0.05)', borderTop: '1px solid rgba(var(--color-primary-rgb),0.1)', borderLeft: '3px solid var(--color-primary)', padding: '10px 16px', display: 'flex', alignItems: 'flex-start', gap: 10, borderRadius: '0 0 20px 20px' }}>
          <Sparkles size={14} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: 2 }} />
          <span style={{ fontSize: 12, fontStyle: 'italic', color: 'var(--color-muted)', lineHeight: 1.5 }}>
            {insightText}<span style={{ animation: insightText.length < (chart.insight?.length || 0) ? 'blink-cursor 0.8s infinite' : 'none', opacity: insightText.length < (chart.insight?.length || 0) ? 1 : 0 }}>|</span>
          </span>
        </div>
      )}
    </motion.div>
  );
};

export default ChartCard;
