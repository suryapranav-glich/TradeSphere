import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Sparkles, AlertCircle, X, TrendingUp, TrendingDown, ChevronDown, GitCompare, Code, Copy, Check } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line } from 'recharts';
import ChartCard from './ChartCard';

// ─── AI Summary Card ─────────────────────────────────────
export const AiSummaryCard = ({ summary, followups, onFollowup }) => {
  const [typed, setTyped] = useState('');
  useEffect(() => {
    if (!summary) return;
    let i = 0; setTyped('');
    const iv = setInterval(() => { i++; setTyped(summary.slice(0, i)); if (i >= summary.length) clearInterval(iv); }, 12);
    return () => clearInterval(iv);
  }, [summary]);

  // Parse the typed text into structured lines
  const renderFormattedSummary = () => {
    if (!typed) return null;

    // Split by common separators: • (bullet), \n\n (double newline), \n (newline)
    // First separate the recommendation (after 💡 Recommendation:)
    const recMatch = typed.match(/(.*?)(💡\s*Recommendation:?\s*)(.*)/s);
    
    let insightsPart = typed;
    let recommendationLabel = '';
    let recommendationText = '';
    
    if (recMatch) {
      insightsPart = recMatch[1].trim();
      recommendationLabel = recMatch[2].trim();
      recommendationText = recMatch[3].trim();
    }

    // Split insights by bullet points (•) or newlines
    let insights = insightsPart
      .split(/\s*[•]\s*/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    // If no bullet split worked, try newline split
    if (insights.length <= 1 && insightsPart.includes('\n')) {
      insights = insightsPart.split('\n').map(s => s.trim()).filter(s => s.length > 0);
    }

    return (
      <div style={{ fontSize: 15, lineHeight: 1.8, color: '#CBD5E1', marginBottom: 16 }}>
        {/* Insight bullet points */}
        {insights.map((insight, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
            <span style={{ color: 'var(--color-primary)', fontSize: 16, lineHeight: '24px', flexShrink: 0 }}>•</span>
            <span>{insight}</span>
          </div>
        ))}

        {/* Recommendation - on its own highlighted line */}
        {recommendationLabel && (
          <div style={{
            marginTop: 14, padding: '10px 14px', borderRadius: 10,
            background: 'rgba(var(--color-primary-rgb),0.08)',
            border: '1px solid rgba(var(--color-primary-rgb),0.15)',
            display: 'flex', alignItems: 'flex-start', gap: 8,
          }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
            <div>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Recommendation</span>
              <p style={{ margin: '4px 0 0', fontSize: 14, color: '#E2E8F0', lineHeight: 1.6 }}>{recommendationText}</p>
            </div>
          </div>
        )}

        {/* Typing cursor */}
        <span style={{ animation: typed.length < (summary?.length || 0) ? 'blink-cursor 0.8s infinite' : 'none', opacity: typed.length < (summary?.length || 0) ? 1 : 0 }}>|</span>
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: 'linear-gradient(180deg, var(--color-primary), var(--color-secondary))' }} />
      <div style={{ padding: 20, paddingLeft: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Brain size={20} color="var(--color-primary)" />
            <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'rgba(var(--color-primary-rgb),0.15)', color: 'var(--color-primary)', letterSpacing: 0.5 }}>AI ANALYSIS</span>
          </div>
          <span style={{ fontSize: 12, color: 'var(--color-dim)' }}>Just now</span>
        </div>
        {renderFormattedSummary()}
        {followups?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {followups.map((f, i) => (
              <button key={i} onClick={() => onFollowup?.(f)} style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, background: 'rgba(var(--color-primary-rgb),0.08)', border: '1px solid rgba(var(--color-primary-rgb),0.2)', color: 'var(--color-muted)', cursor: 'pointer', transition: 'all 0.2s' }}>{f}</button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ─── Generated Query Card ────────────────────────────────
export const GeneratedQueryCard = ({ sql }) => {
  const [copied, setCopied] = useState(false);

  if (!sql) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card" style={{ overflow: 'hidden', marginTop: 16 }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: 'linear-gradient(180deg, var(--color-secondary), #a855f7)' }} />
      <div style={{ padding: 16, paddingLeft: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Code size={18} color="#a855f7" />
            <span style={{ fontSize: 11, fontWeight: 600, color: '#a855f7', letterSpacing: 0.5, textTransform: 'uppercase' }}>Generated SQL Query</span>
          </div>
          <button 
            onClick={handleCopy}
            style={{ 
              display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', 
              borderRadius: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--color-text)', cursor: 'pointer', fontSize: 12, transition: 'all 0.2s'
            }}
          >
            {copied ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <div style={{ 
          background: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 8, 
          fontFamily: 'monospace', fontSize: 13, color: '#e2e8f0',
          border: '1px solid rgba(255,255,255,0.05)', overflowX: 'auto', whiteSpace: 'pre-wrap'
        }}>
          {sql}
        </div>
      </div>
    </motion.div>
  );
};

// ─── Anomaly Alert ────────────────────────────────────────
export const AnomalyAlert = ({ anomaly, onDismiss }) => (
  <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ type: 'spring' }} className="glass-card"
    style={{ gridColumn: '1 / -1', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: `4px solid ${anomaly.severity === 'critical' ? 'var(--color-danger)' : 'var(--color-warning)'}`, animation: anomaly.severity === 'critical' ? 'pulse-button 2s infinite' : 'none' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <AlertCircle size={18} color={anomaly.severity === 'critical' ? 'var(--color-danger)' : 'var(--color-warning)'} />
      <span style={{ fontSize: 14, fontWeight: 500 }}>{anomaly.message}</span>
    </div>
    <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
      <X size={16} color="var(--color-muted)" />
    </button>
  </motion.div>
);

// ─── KPI Card ────────────────────────────────────────────
export const KpiCard = ({ kpi, delay = 0 }) => {
  const sparkData = (kpi.sparkline || []).map((v, i) => ({ v }));
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: delay * 0.1 }} className="glass-card" style={{ height: 160, padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))', borderRadius: '20px 20px 0 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--color-dim)' }}>{kpi.label}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: kpi.trend >= 0 ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)', color: kpi.trend >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
          {kpi.trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {kpi.trend >= 0 ? '+' : ''}{kpi.trend}%
        </span>
      </div>
      <div style={{ fontSize: 40, fontWeight: 700, background: 'linear-gradient(135deg, #FFFFFF, var(--color-muted))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1 }}>{kpi.value}</div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', height: 30 }}>
        {sparkData.length > 1 && (
          <div style={{ width: 80 }}>
            <ResponsiveContainer width="100%" height={30}>
              <LineChart data={sparkData}>
                <Line type="monotone" dataKey="v" stroke={kpi.trend >= 0 ? 'var(--color-success)' : 'var(--color-danger)'} strokeWidth={1.5} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ─── Section Header ───────────────────────────────────────
const SectionHeader = ({ icon: Icon, label, count }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, marginTop: 32 }}
  >
    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, rgba(var(--color-primary-rgb),0.2), rgba(var(--color-secondary-rgb),0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={18} color="var(--color-primary)" />
    </div>
    <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)', letterSpacing: 0.3 }}>{label}</span>
    {count > 0 && (
      <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'rgba(var(--color-primary-rgb),0.12)', color: 'var(--color-primary)' }}>{count}</span>
    )}
    <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(var(--color-primary-rgb),0.2), transparent)', marginLeft: 8 }} />
  </motion.div>
);

// ─── Period labels for filter queries ─────────────────────
const PERIOD_LABELS = {
  '7D': 'in the last 7 days',
  '1M': 'in the last 1 month',
  '3M': 'in the last 3 months',
  '6M': 'in the last 6 months',
  '1Y': 'in the last 1 year',
  'All': '',
};



// ─── Dashboard ────────────────────────────────────────────
const Dashboard = ({ config, onFollowup, activeQuery }) => {
  const [dismissedAnomalies, setDismissedAnomalies] = useState(new Set());
  const [activePeriod, setActivePeriod] = useState('All');
  const [activeRegion, setActiveRegion] = useState('');
  const [regionDropdownOpen, setRegionDropdownOpen] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [filterLoading, setFilterLoading] = useState(false);
  const regionRef = useRef(null);



  if (!config) return null;

  const hasCharts = config.charts?.length > 0;
  const hasKpis = config.kpis?.length > 0;
  const isInvalidQuery = config.title === 'Query Not Related' || (!hasCharts && !hasKpis && config.summary?.includes('Invalid query'));

  // Build a filtered query string from the base query + selected filters
  const buildFilteredQuery = (period, region, compare) => {
    // Use the original query from config.title (which stores the user's query text)
    let base = activeQuery || config.title || '';
    // Strip any previous filter suffixes we may have appended
    base = base.replace(/\s*(in the last \d+\s*(days?|months?|years?))/gi, '').trim();
    base = base.replace(/\s*for (Working Women|Premium Shoppers|Youth|College Students|Tier 2 City Customers)/gi, '').trim();
    base = base.replace(/\s*compared across segments/gi, '').trim();

    let q = base;
    if (period !== 'All' && PERIOD_LABELS[period]) {
      q += ` ${PERIOD_LABELS[period]}`;
    }

    if (compare) {
      q += ` compared across segments`;
    }
    return q.trim();
  };

  const applyFilter = (period, region, compare) => {
    const q = buildFilteredQuery(period, region, compare);
    if (onFollowup && q) {
      setFilterLoading(true);
      onFollowup(q);
      // The loading state will be cleared when new config arrives
      setTimeout(() => setFilterLoading(false), 800);
    }
  };

  const handlePeriodClick = (p) => {
    setActivePeriod(p);
    applyFilter(p, activeRegion, compareMode);
  };



  const handleCompareToggle = () => {
    const next = !compareMode;
    setCompareMode(next);
    applyFilter(activePeriod, activeRegion, next);
  };

  // Shared button styles
  const periodBtnStyle = (p) => ({
    height: 32,
    padding: '0 14px',
    borderRadius: 20,
    fontSize: 13,
    fontWeight: activePeriod === p ? 600 : 400,
    border: activePeriod === p
      ? '1px solid rgba(var(--color-primary-rgb),0.5)'
      : '1px solid rgba(255,255,255,0.08)',
    background: activePeriod === p
      ? 'linear-gradient(135deg, rgba(var(--color-primary-rgb),0.18), rgba(var(--color-secondary-rgb),0.18))'
      : 'rgba(255,255,255,0.05)',
    color: activePeriod === p ? 'var(--color-text)' : 'var(--color-dim)',
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    transform: activePeriod === p ? 'scale(1.05)' : 'scale(1)',
  });

  return (
    <div style={{ width: '100%', maxWidth: 1400, margin: '0 auto', paddingBottom: 60 }}>
      {/* Filter Bar */}
      <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="glass-card"
        style={{ height: 56, display: 'flex', alignItems: 'center', padding: '0 20px', gap: 10, marginBottom: 20, borderRadius: 16, position: 'relative' }}>

        {/* Loading overlay */}
        <AnimatePresence>
          {filterLoading && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'absolute', inset: 0, borderRadius: 16, background: 'rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}
            >
              <div style={{ width: 20, height: 20, border: '2px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
            </motion.div>
          )}
        </AnimatePresence>

        <span style={{ fontSize: 12, color: 'var(--color-dim)', fontWeight: 500 }}>Period:</span>
        {['7D','1M','3M','6M','1Y','All'].map((p) => (
          <button key={p} onClick={() => handlePeriodClick(p)} style={periodBtnStyle(p)}>{p}</button>
        ))}

        <div style={{ flex: 1 }} />



        {/* Compare Button */}
        <button
          onClick={handleCompareToggle}
          style={{
            height: 32, padding: '0 14px', borderRadius: 20, fontSize: 13,
            border: compareMode ? '1px solid rgba(var(--color-primary-rgb),0.5)' : '1px solid rgba(255,255,255,0.08)',
            background: compareMode ? 'linear-gradient(135deg, rgba(var(--color-primary-rgb),0.18), rgba(var(--color-secondary-rgb),0.18))' : 'rgba(255,255,255,0.05)',
            color: compareMode ? 'var(--color-text)' : 'var(--color-dim)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.25s ease',
            fontWeight: compareMode ? 600 : 400,
          }}
        >
          <GitCompare size={14} />
          Compare
        </button>
      </motion.div>

      {/* Active filters indicator */}
      {(activePeriod !== 'All' || activeRegion !== 'All Regions' || compareMode) && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}
        >
          <span style={{ fontSize: 11, color: 'var(--color-dim)', textTransform: 'uppercase', letterSpacing: 1 }}>Active filters:</span>
          {activePeriod !== 'All' && (
            <span style={{
              padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
              background: 'rgba(var(--color-primary-rgb),0.12)', color: 'var(--color-primary)',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              {activePeriod}
              <X size={10} style={{ cursor: 'pointer' }} onClick={() => { setActivePeriod('All'); applyFilter('All', activeRegion, compareMode); }} />
            </span>
          )}

          {compareMode && (
            <span style={{
              padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
              background: 'rgba(52,211,153,0.12)', color: 'var(--color-success, #34d399)',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              Compare
              <X size={10} style={{ cursor: 'pointer' }} onClick={() => { setCompareMode(false); applyFilter(activePeriod, activeRegion, false); }} />
            </span>
          )}
          <button
            onClick={() => { setActivePeriod('All'); setCompareMode(false); applyFilter('All', '', false); }}
            style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: 'var(--color-danger, #f87171)', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            Clear all
          </button>
        </motion.div>
      )}

      {/* ═══ SECTION 1: AI Analysis ═══ */}
      <div id="dashboard-output">
        <SectionHeader icon={Brain} label="AI Analysis" />
        <AiSummaryCard summary={config.summary} followups={config.suggestedFollowups} onFollowup={onFollowup} />
        <GeneratedQueryCard sql={config.sql} />

        {/* Invalid Query Error Card */}
        {isInvalidQuery && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="glass-card"
            style={{ marginTop: 20, overflow: 'hidden', borderLeft: '4px solid var(--color-danger, #f87171)' }}
          >
            <div style={{ padding: 24, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: 'rgba(248,113,113,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <AlertCircle size={24} color="var(--color-danger, #f87171)" />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-danger, #f87171)', margin: '0 0 8px' }}>
                  Invalid Query
                </h3>
                <p style={{ fontSize: 14, color: '#CBD5E1', lineHeight: 1.7, margin: '0 0 12px' }}>
                  This query is not related to the digital marketing campaigns database. Please try asking about:
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {['Campaigns', 'Revenue', 'ROI', 'Channels', 'Conversions', 'Audience Segments'].map(tag => (
                    <span key={tag} style={{
                      padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                      background: 'rgba(var(--color-primary-rgb),0.1)',
                      border: '1px solid rgba(var(--color-primary-rgb),0.2)',
                      color: 'var(--color-primary)'
                    }}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Anomalies */}
        <AnimatePresence>
          {config.anomalies?.filter(a => !dismissedAnomalies.has(a.message)).slice(0, 2).map((a, i) => (
            <AnomalyAlert key={a.message} anomaly={a} onDismiss={() => setDismissedAnomalies(prev => new Set(prev).add(a.message))} />
          ))}
        </AnimatePresence>

      {/* ═══ SECTION 2: Visualizations ═══ */}
      {!isInvalidQuery && hasCharts && (
        <div>
          <SectionHeader icon={Sparkles} label="Visualizations" count={config.charts.length} />
          <div style={{ display: 'grid', gridTemplateColumns: config.charts.length === 1 ? '1fr' : 'repeat(auto-fill, minmax(420px, 1fr))', gap: 20 }}>
            {config.charts.map((c, i) => (
              <div key={c.id} style={c.type === 'geo' || c.type === 'funnel' ? { gridColumn: '1 / -1' } : {}}>
                <ChartCard chart={c} delay={i} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ SECTION 3: Key Metrics ═══ */}
      {!isInvalidQuery && hasKpis && (
        <div>
          <SectionHeader icon={TrendingUp} label="Key Metrics" count={config.kpis.length} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {config.kpis.map((k, i) => (
              <KpiCard key={i} kpi={k} delay={i} />
            ))}
          </div>
        </div>
      )}
      </div> {/* end dashboard-output */}
    </div>
  );
};

export default Dashboard;
