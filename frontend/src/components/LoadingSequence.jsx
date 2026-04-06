import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain } from 'lucide-react';

const CODE_LINES = [
  { tokens: [{ t: 'df', c: 'white' }, { t: '.groupby', c: 'var(--color-primary)' }, { t: "(", c: 'var(--color-dim)' }, { t: "'region'", c: 'var(--color-success)' }, { t: ")", c: 'var(--color-dim)' }] },
  { tokens: [{ t: "  .agg", c: 'var(--color-primary)' }, { t: "({'revenue'", c: 'var(--color-success)' }, { t: ": 'sum'})", c: 'var(--color-dim)' }] },
  { tokens: [{ t: "  .sort_values", c: 'var(--color-primary)' }, { t: "('revenue',", c: 'var(--color-success)' }] },
  { tokens: [{ t: "    ascending=", c: 'var(--color-dim)' }, { t: "False", c: 'var(--color-warning)' }, { t: ")", c: 'var(--color-dim)' }] },
  { tokens: [{ t: "  .reset_index", c: 'var(--color-primary)' }, { t: "()", c: 'var(--color-dim)' }] },
];

const LoadingSequence = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [codeText, setCodeText] = useState('');

  useEffect(() => {
    const fullCode = CODE_LINES.map(l => l.tokens.map(t => t.t).join('')).join('\n');
    let idx = 0;
    // Step 1: 800ms
    const t1 = setTimeout(() => setStep(2), 800);
    // Step 2: type code over ~1.5s
    const t2 = setTimeout(() => {
      const typing = setInterval(() => {
        idx++;
        setCodeText(fullCode.slice(0, idx));
        if (idx >= fullCode.length) clearInterval(typing);
      }, 25);
    }, 800);
    const t3 = setTimeout(() => setStep(3), 2300);
    const t4 = setTimeout(() => setStep(4), 3300);
    const t5 = setTimeout(() => { setStep(5); onComplete(); }, 3800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); };
  }, [onComplete]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 24 }}>
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            <div style={{ position: 'relative', width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(var(--color-primary-rgb),0.1)', border: '2px solid rgba(var(--color-primary-rgb),0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Brain size={32} color="var(--color-primary)" />
              </div>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid rgba(var(--color-primary-rgb),0.4)', animation: 'ripple 2s ease-out infinite' }} />
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid rgba(var(--color-primary-rgb),0.4)', animation: 'ripple 2s ease-out infinite 1s' }} />
            </div>
            <span style={{ fontSize: 15, color: 'var(--color-muted)' }}>Understanding your query...</span>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%', maxWidth: 500 }}>
            <span style={{ fontSize: 15, color: 'var(--color-muted)' }}>Generating data queries...</span>
            <div style={{ width: '100%', background: 'rgba(10,5,25,0.9)', border: '1px solid rgba(var(--color-primary-rgb),0.2)', borderRadius: 12, padding: 20, fontFamily: "'Courier New', monospace", fontSize: 13 }}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--color-danger)' }} />
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--color-warning)' }} />
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--color-success)' }} />
                <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--color-dim)' }}>pandas_query.py</span>
              </div>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', color: 'var(--color-success)', lineHeight: 1.6 }}>
                {codeText}<span style={{ animation: 'blink-cursor 0.8s infinite', color: 'var(--color-success)' }}>▊</span>
              </pre>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="s3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: '100%', maxWidth: 480 }}>
            <span style={{ fontSize: 15, color: 'var(--color-muted)' }}>Fetching your data...</span>
            <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
              <motion.div initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 1, ease: 'easeInOut' }} style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary), var(--color-primary))', backgroundSize: '200% 100%', animation: 'gradient-shift 2s linear infinite' }} />
            </div>
            <span style={{ fontSize: 13, color: 'var(--color-dim)' }}>Processing 1,240 rows...</span>
          </motion.div>
        )}

        {step >= 4 && (
          <motion.div key="s4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20, width: '100%' }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="glass-card" style={{ height: 300, overflow: 'hidden', position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent 0%, rgba(var(--color-primary-rgb),0.06) 50%, transparent 100%)', animation: 'shimmer-sweep 1.5s infinite' }} />
                <div style={{ padding: 20 }}>
                  <div style={{ width: '60%', height: 12, background: 'rgba(255,255,255,0.08)', borderRadius: 6, marginBottom: 16 }} />
                  <div style={{ width: '40%', height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, marginBottom: 32 }} />
                  <div style={{ width: '100%', height: 180, background: 'rgba(255,255,255,0.03)', borderRadius: 8 }} />
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LoadingSequence;
