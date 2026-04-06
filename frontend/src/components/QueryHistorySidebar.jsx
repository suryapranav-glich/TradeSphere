import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Trash2, Search, Star, X } from 'lucide-react';
import { useDashboardStore } from '../store/dashboardStore';

const QueryHistorySidebar = ({ onRestore }) => {
  const { queryHistory, clearHistory, toggleStar, isHistoryOpen, setHistoryOpen } = useDashboardStore();

  return (
    <>
      {/* Toggle Tab */}
      <div
        onClick={() => setHistoryOpen(true)}
        style={{ position: 'fixed', left: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 40, width: 32, height: 80, background: 'rgba(15,10,40,0.9)', border: '1px solid rgba(var(--color-primary-rgb),0.2)', borderLeft: 'none', borderRadius: '0 12px 12px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'width 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.width = '36px'}
        onMouseLeave={e => e.currentTarget.style.width = '32px'}
      >
        <Clock size={16} color="var(--color-primary)" />
      </div>

      <AnimatePresence>
        {isHistoryOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setHistoryOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 140 }} />
            <motion.div initial={{ x: -360 }} animate={{ x: 0 }} exit={{ x: -360 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: 320, zIndex: 150, background: 'rgba(8,4,24,0.97)', backdropFilter: 'blur(40px)', borderRight: '1px solid rgba(var(--color-primary-rgb),0.15)', display: 'flex', flexDirection: 'column' }}>
              {/* Header */}
              <div style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock size={18} color="var(--color-primary)" />
                  <span style={{ fontSize: 16, fontWeight: 500, color: 'white' }}>Query History</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {queryHistory.length > 0 && <button onClick={clearHistory} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><Trash2 size={16} color="var(--color-muted)" /></button>}
                  <button onClick={() => setHistoryOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={16} color="var(--color-muted)" /></button>
                </div>
              </div>

              {/* Items */}
              <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
                {queryHistory.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-dim)', opacity: 0.6 }}>
                    <Search size={48} style={{ marginBottom: 12 }} />
                    <p style={{ fontSize: 14 }}>No queries yet</p>
                    <p style={{ fontSize: 12, marginTop: 4 }}>Your query history will appear here</p>
                  </div>
                ) : (
                  <>
                    {/* Starred first */}
                    {queryHistory.filter(q => q.starred).map((item, i) => (
                      <HistoryItem key={item.id} item={item} idx={i} onRestore={onRestore} toggleStar={toggleStar} />
                    ))}
                    {queryHistory.filter(q => q.starred).length > 0 && <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '8px 0' }} />}
                    {queryHistory.filter(q => !q.starred).map((item, i) => (
                      <HistoryItem key={item.id} item={item} idx={i} onRestore={onRestore} toggleStar={toggleStar} />
                    ))}
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

const HistoryItem = ({ item, idx, onRestore, toggleStar }) => (
  <div onClick={() => onRestore(item)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s', borderLeft: '2px solid transparent', marginBottom: 4 }}
    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderLeftColor = 'var(--color-primary)'; }}
    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderLeftColor = 'transparent'; }}
  >
    <div style={{ width: 24, height: 24, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--color-dim)', flexShrink: 0 }}>{idx + 1}</div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ fontSize: 13, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{item.text}</p>
      <p style={{ fontSize: 11, color: 'var(--color-dim)', marginTop: 2 }}>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
    </div>
    <button onClick={e => { e.stopPropagation(); toggleStar(item.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
      <Star size={14} color={item.starred ? 'var(--color-warning)' : 'var(--color-dim)'} fill={item.starred ? 'var(--color-warning)' : 'none'} />
    </button>
  </div>
);

export default QueryHistorySidebar;
