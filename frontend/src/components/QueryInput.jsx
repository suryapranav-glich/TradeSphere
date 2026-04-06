import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, TrendingUp, BarChart2, Map, Filter, Target, AlertCircle } from 'lucide-react';

const PLACEHOLDERS = [
  "Show me revenue by campaign type...",
  "Which channels have the highest ROI?",
  "Compare customer segments by conversions...",
  "Show the top 10 campaigns by revenue...",
  "What is the average acquisition cost by target audience?",
];

const CHIPS = [
  { label: "Revenue by Campaign Type", icon: TrendingUp, color: "var(--color-success)" },
  { label: "Top channels by ROI", icon: BarChart2, color: "var(--color-primary)" },
  { label: "Customer segment breakdown", icon: Map, color: "var(--color-secondary)" },
  { label: "Conversions by target audience", icon: Filter, color: "var(--color-warning)" },
  { label: "Campaign performance scorecard", icon: Target, color: "var(--color-danger)" },
];

const QueryInput = ({ onSubmit, isCompact }) => {
  const [query, setQuery] = useState('');
  const [phIdx, setPhIdx] = useState(0);
  const [shake, setShake] = useState(false);
  const [warning, setWarning] = useState('');

  useEffect(() => {
    const t = setInterval(() => setPhIdx(p => (p + 1) % PLACEHOLDERS.length), 3000);
    return () => clearInterval(t);
  }, []);

  const submit = (text) => {
    const q = (text || query).trim();
    if (!q) { setShake(true); setTimeout(() => setShake(false), 600); return; }
    if (q.split(/\s+/).length < 3) { setWarning('Try being more specific — include a metric and a dimension'); setTimeout(() => setWarning(''), 4000); return; }
    onSubmit(q);
    setQuery('');
  };

  if (isCompact) {
    return (
      <div style={{ width: '100%', maxWidth: 760, margin: '0 auto 20px' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', background: 'var(--bg-input)', border: '1px solid rgba(var(--color-primary-rgb),0.3)', borderRadius: 12, height: 48, padding: '0 8px 0 42px' }}>
          <Sparkles size={16} style={{ position: 'absolute', left: 14, color: 'var(--color-primary)' }} />
          <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} placeholder="Ask another question..." style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', color: 'var(--color-text)', fontSize: 14 }} />
          <button onClick={() => submit()} style={{ height: 36, padding: '0 14px', background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', border: 'none', borderRadius: 8, color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}>
            <Send size={14} /> Go
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 200px)', gap: 32 }}>
      {/* Hero Title */}
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: 42, fontWeight: 700, background: 'linear-gradient(135deg, #FFFFFF 0%, var(--color-muted) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1.2, marginBottom: 8 }}>
          What would you like to explore today?
        </h1>
        <p style={{ fontSize: 16, color: 'rgba(148,163,184,0.7)' }}>Powered by AI — just type in plain English</p>
      </div>

      {/* Search Bar */}
      <div style={{ width: '100%', maxWidth: 760, position: 'relative' }}>
        {/* Glow ring */}
        <div style={{ position: 'absolute', inset: -3, borderRadius: 20, animation: 'glow-pulse 3s ease-in-out infinite', pointerEvents: 'none', zIndex: 0 }} />

        <motion.div animate={{ x: shake ? [0, 12, -12, 12, -12, 8, -8, 4, -4, 0] : 0 }} transition={{ duration: 0.6 }}
          style={{ position: 'relative', display: 'flex', alignItems: 'center', height: 64, background: 'var(--bg-input)', backdropFilter: 'blur(20px)', border: shake ? '1px solid var(--color-danger)' : '1px solid rgba(var(--color-primary-rgb),0.3)', borderRadius: 16, padding: '0 8px 0 56px', zIndex: 1, transition: 'border-color 0.3s' }}
        >
          {/* Sparkle icon */}
          <div style={{ position: 'absolute', left: 18, top: '50%', animation: 'sparkle-spin 4s linear infinite', color: 'var(--color-primary)' }}>
            <Sparkles size={20} />
          </div>

          {/* Input with cycling placeholder */}
          <div style={{ flex: 1, position: 'relative', height: '100%' }}>
            <AnimatePresence mode="wait">
              {!query && (
                <motion.div key={phIdx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', color: 'var(--color-dim)', fontSize: 16, pointerEvents: 'none' }}
                >
                  {PLACEHOLDERS[phIdx]}
                </motion.div>
              )}
            </AnimatePresence>
            <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none', background: 'transparent', outline: 'none', color: 'var(--color-text)', fontSize: 16 }}
            />
          </div>

          {/* Submit button */}
          <button onClick={() => submit()} style={{ height: 48, padding: '0 20px', background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)', borderRadius: 12, border: 'none', display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: 'white', cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0 }}>
            <Send size={16} /> Generate
          </button>
        </motion.div>

        {/* Warning */}
        <AnimatePresence>
          {warning && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, padding: '8px 12px', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 8, fontSize: 13, color: 'var(--color-warning)' }}>
              <AlertCircle size={14} /> {warning}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Suggestion Chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10 }}>
        {CHIPS.map((chip, i) => (
          <motion.button key={chip.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.08 }}
            onClick={() => { setQuery(chip.label); submit(chip.label); }}
            style={{ height: 36, padding: '0 16px', background: 'rgba(var(--color-primary-rgb),0.08)', border: '1px solid rgba(var(--color-primary-rgb),0.2)', borderRadius: 20, fontSize: 13, color: 'var(--color-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(var(--color-primary-rgb),0.15)'; e.currentTarget.style.color = 'var(--color-text)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(var(--color-primary-rgb),0.08)'; e.currentTarget.style.color = 'var(--color-muted)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <chip.icon size={14} color={chip.color} /> {chip.label}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default QueryInput;
