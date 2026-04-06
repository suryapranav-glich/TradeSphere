import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';
import { useDashboardStore } from '../store/dashboardStore';

const ChatSidebar = ({ onQuery }) => {
  const { isChatOpen, setChatOpen } = useDashboardStore();
  const [messages, setMessages] = useState([{ id: 1, type: 'ai', text: "Hi! I'm your AI data assistant. Ask me anything about this dashboard or type a new query." }]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, typing]);

  const send = async (e) => {
    e?.preventDefault();
    if (!input.trim()) return;
    const userMsg = { id: Date.now(), type: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    const q = input;
    setInput('');
    setTyping(true);

    try {
      const res = await fetch('http://localhost:8000/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: q }) });
      const data = await res.json();
      setMessages(prev => [...prev, { id: Date.now(), type: 'ai', text: data.reply || "I couldn't process that." }]);

      // Only trigger the main dashboard query if the chat response is NOT off-topic
      if (!data.off_topic) {
        const isDataQuery = /show|display|what|how|generate|chart|graph|plot|revenue|roi|conversions|customers|campaign/i.test(q);
        if (isDataQuery && onQuery) {
          onQuery(q);
        }
      }
    } catch {
      setMessages(prev => [...prev, { id: Date.now(), type: 'ai', text: "Network error. Please check your connection." }]);
    } finally { setTyping(false); }
  };

  return (
    <>
      {/* Toggle */}
      {!isChatOpen && (
        <button onClick={() => setChatOpen(true)} style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 200, width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pulse-button 2s infinite' }}>
          <MessageCircle size={22} color="white" />
        </button>
      )}

      <AnimatePresence>
        {isChatOpen && (
          <motion.div initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 380, zIndex: 150, background: 'rgba(8,4,24,0.97)', backdropFilter: 'blur(40px)', borderLeft: '1px solid rgba(var(--color-primary-rgb),0.15)', boxShadow: '-20px 0 60px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Sparkles size={14} color="white" /></div>
                <span style={{ fontSize: 15, fontWeight: 500, color: 'white' }}>Chat with Dashboard</span>
              </div>
              <button onClick={() => setChatOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={18} color="var(--color-muted)" /></button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {messages.map(m => (
                <motion.div key={m.id} initial={{ opacity: 0, x: m.type === 'user' ? 40 : -40 }} animate={{ opacity: 1, x: 0 }}
                  style={{ display: 'flex', justifyContent: m.type === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 8 }}>
                  {m.type === 'ai' && <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Sparkles size={11} color="white" /></div>}
                  <div style={{ maxWidth: m.type === 'user' ? '80%' : '85%', padding: '10px 14px', borderRadius: m.type === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px', background: m.type === 'user' ? 'linear-gradient(135deg, #1d4ed8, var(--color-secondary))' : 'rgba(15,10,40,0.8)', border: m.type === 'ai' ? '1px solid rgba(var(--color-primary-rgb),0.15)' : 'none', fontSize: 14, color: m.type === 'user' ? 'white' : '#CBD5E1', lineHeight: 1.5 }}>
                    {m.text}
                  </div>
                </motion.div>
              ))}
              {typing && (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Sparkles size={11} color="white" /></div>
                  <div style={{ padding: '10px 18px', borderRadius: '18px 18px 18px 4px', background: 'rgba(15,10,40,0.8)', border: '1px solid rgba(var(--color-primary-rgb),0.15)', display: 'flex', gap: 4, alignItems: 'center' }}>
                    {[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(var(--color-primary-rgb),0.8)', animation: `dot-bounce 1.4s ease-in-out ${i * 0.2}s infinite` }} />)}
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <form onSubmit={send} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask a follow-up question..."
                  style={{ flex: 1, height: 40, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '0 16px', fontSize: 14, color: 'var(--color-text)', outline: 'none' }} />
                <button type="submit" style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <Send size={16} color="white" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatSidebar;
