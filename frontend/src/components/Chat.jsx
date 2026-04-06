import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Minimize2, X, MessageCircle, FileText } from 'lucide-react';

const Chat = ({ onQuery, loading }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hii! I am your AI Marketing Analyst. Ask me anything about your campaign data, e.g., "Show ROI by Channel".' }
  ]);
  const [input, setInput] = useState('');
  const chatBottomRef = useRef(null);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isOpen, isMinimized]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    const query = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: query }]);
    setInput('');
    
    // First check with chat API if query is relevant
    try {
      const chatRes = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const chatData = await chatRes.json();
      
      if (chatData.off_topic) {
        // Show the guardrail message in chat, don't trigger dashboard
        setMessages(prev => [...prev, { role: 'ai', text: chatData.reply }]);
        return;
      }
    } catch (_) {
      // If chat check fails, proceed with dashboard query anyway
    }

    await onQuery(query);
    
    setMessages(prev => [...prev, { role: 'ai', text: `Here is the data visualization for "${query}". You can ask follow-up questions.` }]);
  };

  const handleClose = () => {
    setIsOpen(false);
    // Remove data up to now
    setMessages([{ role: 'ai', text: 'Hii! I am your AI Marketing Analyst. Ask me anything about your campaign data, e.g., "Show ROI by Channel".' }]);
    setIsMinimized(false);
  };

  const summarizeChat = async () => {
      // Create a prompt out of chat history
      const history = messages.map(m => `${m.role}: ${m.text}`).join('\n');
      setMessages(prev => [...prev, { role: 'user', text: 'Please summarize our chat so far.' }]);
      try {
          const res = await fetch('http://localhost:8000/api/insights', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ query: 'Summarize this conversation: ' + history.substring(0, 1000) })
          });
          const data = await res.json();
          setMessages(prev => [...prev, { role: 'ai', text: data.recommendation || "Summary generated based on our discussion." }]);
      } catch (e) {
          setMessages(prev => [...prev, { role: 'ai', text: "Chat summary: We have been discussing your marketing data. Unfortunately backend connection failed to generate a deeper summary." }]);
      }
  };

  if (!isOpen) {
    return (
      <button className="floating-chat-button" onClick={() => setIsOpen(true)}>
        <MessageCircle size={28} />
      </button>
    );
  }

  return (
    <div className={`floating-chat-widget ${isMinimized ? 'minimized' : ''}`}>
      <div 
        style={{ padding: '16px 24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-tertiary)', cursor: isMinimized ? 'pointer' : 'default' }}
        onClick={() => { if(isMinimized) setIsMinimized(false); }}
      >
        <h3 style={{ fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}>
           <Bot size={20} style={{ color: 'var(--accent-secondary)' }} />
           AI Analyst
        </h3>
        <div className="chat-header-controls">
          {!isMinimized && (
              <button title="AI Summary" onClick={summarizeChat} className="chat-control-btn" style={{ color: 'var(--accent-primary)' }}>
                <FileText size={18} />
              </button>
          )}
          <button title="Minimize" onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }} className="chat-control-btn">
            <Minimize2 size={18} />
          </button>
          <button title="Close" onClick={(e) => { e.stopPropagation(); handleClose(); }} className="chat-control-btn" style={{ color: 'var(--danger-color)' }}>
            <X size={18} />
          </button>
        </div>
      </div>
      
      {!isMinimized && (
        <>
          <div className="chat-history" style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', marginBottom: '16px' }}>
                <div style={{ 
                  width: '32px', height: '32px', borderRadius: '50%', background: msg.role === 'user' ? 'var(--bg-tertiary)' : 'var(--accent-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  {msg.role === 'user' ? <User size={16} color="var(--text-secondary)" /> : <Bot size={16} color="white" />}
                </div>
                <div className={`chat-message ${msg.role}`}>
                   {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                 <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Bot size={16} color="white" />
                 </div>
                 <div className="chat-message ai" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                   <span style={{ width: 6, height: 6, background: 'var(--text-muted)', borderRadius: '50%', animation: 'pulse 1s infinite' }}></span>
                   <span style={{ width: 6, height: 6, background: 'var(--text-muted)', borderRadius: '50%', animation: 'pulse 1s infinite 200ms' }}></span>
                   <span style={{ width: 6, height: 6, background: 'var(--text-muted)', borderRadius: '50%', animation: 'pulse 1s infinite 400ms' }}></span>
                 </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--glass-border)', background: 'var(--bg-tertiary)' }}>
            <form onSubmit={handleSubmit} className="chat-input-wrapper">
              <input 
                className="chat-input"
                type="text"
                placeholder="Message AI Analyst..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
              />
              <button type="submit" className="chat-send-btn" disabled={loading || !input.trim()}>
                <Send size={18} />
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default Chat;
