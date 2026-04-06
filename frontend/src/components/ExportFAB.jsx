import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileDown, Image as ImageIcon, Link2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';

const ExportFAB = ({ activeQuery }) => {
  const [expanded, setExpanded] = useState(false);
  const timeoutRef = useRef(null);

  // Use timeout-based hover to prevent flicker when moving between buttons
  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setExpanded(true);
  };
  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setExpanded(false), 300);
  };

  const handleClick = () => {
    setExpanded(prev => !prev);
  };

  const exportPDF = async () => {
    const el = document.getElementById('dashboard-output');
    if (!el) return toast.error('No dashboard to export');
    toast.info('Preparing PDF...');
    setExpanded(false);
    try {
      const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#020010', useCORS: true });
      const pdf = new jsPDF({ orientation: 'landscape' });
      const w = pdf.internal.pageSize.getWidth();
      const h = (canvas.height * w) / canvas.width;
      // Handle multi-page if content is taller than page
      const pageH = pdf.internal.pageSize.getHeight();
      if (h > pageH) {
        let yOffset = 0;
        while (yOffset < h) {
          if (yOffset > 0) pdf.addPage();
          pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, -yOffset, w, h);
          yOffset += pageH;
        }
      } else {
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, w, h);
      }
      pdf.save(`queryiq-dashboard-${Date.now()}.pdf`);
      toast.success('PDF saved!');
    } catch (err) {
      console.error('PDF export failed:', err);
      toast.error('PDF export failed');
    }
  };

  const exportPNG = async () => {
    const el = document.getElementById('dashboard-output');
    if (!el) return toast.error('No dashboard to export');
    toast.info('Capturing...');
    setExpanded(false);
    try {
      const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#020010', useCORS: true });
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `queryiq-dashboard-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success('PNG saved!');
    } catch (err) {
      console.error('PNG export failed:', err);
      toast.error('PNG export failed');
    }
  };

  const shareLink = () => {
    if (!activeQuery) return toast.error('No query to share');
    setExpanded(false);
    const url = new URL(window.location.href);
    url.searchParams.set('q', activeQuery);
    navigator.clipboard.writeText(url.toString());
    toast.success('Share link copied!');
  };

  if (!activeQuery) return null;

  const buttons = [
    { action: exportPDF, icon: FileDown, label: 'Export PDF', bg: 'rgba(239,68,68,0.2)', border: 'rgba(239,68,68,0.4)', color: '#F87171' },
    { action: exportPNG, icon: ImageIcon, label: 'Export PNG', bg: 'rgba(79,158,255,0.2)', border: 'rgba(79,158,255,0.4)', color: '#4F9EFF' },
    { action: shareLink, icon: Link2, label: 'Share Link', bg: 'rgba(167,139,250,0.2)', border: 'rgba(167,139,250,0.4)', color: '#A78BFA' },
  ];

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'fixed', bottom: 28, left: 28, zIndex: 200,
        display: 'flex', flexDirection: 'column-reverse', alignItems: 'center', gap: 10,
      }}
    >
      {/* Main trigger button */}
      <button
        onClick={handleClick}
        style={{
          width: 48, height: 48, borderRadius: '50%',
          background: expanded
            ? 'linear-gradient(135deg, rgba(79,158,255,0.3), rgba(167,139,250,0.3))'
            : 'rgba(255,255,255,0.06)',
          border: expanded
            ? '1px solid rgba(79,158,255,0.5)'
            : '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
        }}
      >
        <FileDown size={20} color="white" />
      </button>

      {/* Action buttons */}
      <AnimatePresence>
        {expanded && buttons.map((btn, i) => (
          <motion.div
            key={btn.label}
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.8 }}
            transition={{ delay: i * 0.06, duration: 0.2 }}
            style={{ position: 'relative' }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                btn.action();
              }}
              title={btn.label}
              style={{
                width: 44, height: 44, borderRadius: '50%',
                background: btn.bg, border: `1px solid ${btn.border}`,
                backdropFilter: 'blur(10px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: 'none',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'scale(1.15)';
                e.currentTarget.style.boxShadow = `0 0 16px ${btn.border}`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <btn.icon size={18} color={btn.color} />
            </button>
            <span style={{
              position: 'absolute', left: 56, top: '50%', transform: 'translateY(-50%)',
              whiteSpace: 'nowrap', fontSize: 12, fontWeight: 500, color: 'white',
              background: 'rgba(0,0,0,0.85)', padding: '5px 12px', borderRadius: 8,
              pointerEvents: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}>
              {btn.label}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ExportFAB;
