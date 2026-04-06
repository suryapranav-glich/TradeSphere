import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, X, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';
import { useDashboardStore } from '../store/dashboardStore';
import { toast } from 'sonner';

const UploadModal = () => {
  const { isUploadOpen, setUploadOpen } = useDashboardStore();
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, uploading, done, error
  const [error, setError] = useState(null);

  const uploadFile = async (f) => {
    setFile(f);
    setStatus('uploading');
    setError(null);

    const formData = new FormData();
    formData.append('file', f);

    try {
      const response = await fetch('http://localhost:8000/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Upload failed');
      }

      const result = await response.json();
      setStatus('done');
      toast.success(result.message || 'File uploaded successfully!');
    } catch (err) {
      console.error('Upload error:', err);
      setStatus('error');
      setError(err.message);
      toast.error(err.message);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) {
      const ext = f.name.split('.').pop().toLowerCase();
      if (['csv', 'json', 'xlsx', 'xls'].includes(ext)) {
        uploadFile(f);
      } else {
        toast.error('Supported formats: .csv, .json, .xlsx');
      }
    }
  };

  const handleSelect = (e) => {
    const f = e.target.files[0];
    if (f) uploadFile(f);
  };

  const close = () => {
    setUploadOpen(false);
    setTimeout(() => {
      setFile(null);
      setStatus('idle');
      setError(null);
    }, 400);
  };

  return (
    <AnimatePresence>
      {isUploadOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }} />
          <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            style={{ position: 'relative', width: 560, maxWidth: '90vw', background: 'rgba(10,6,30,0.97)', border: '1px solid rgba(var(--color-primary-rgb),0.2)', borderRadius: 24, padding: 32, boxShadow: '0 40px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)' }}>
            <button onClick={close} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={20} color="var(--color-muted)" /></button>
            <h2 style={{ fontSize: 20, fontWeight: 700 }} className="gradient-text">Upload Your Dataset</h2>

            {status === 'idle' || status === 'error' ? (
              <div onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={handleDrop}
                style={{ marginTop: 24, border: `2px dashed ${dragging ? 'var(--color-primary)' : status === 'error' ? 'var(--color-danger)' : 'rgba(var(--color-primary-rgb),0.3)'}`, borderRadius: 16, padding: '48px 24px', textAlign: 'center', background: dragging ? 'rgba(var(--color-primary-rgb),0.08)' : 'rgba(var(--color-primary-rgb),0.03)', transition: 'all 0.2s', transform: dragging ? 'scale(1.02)' : 'scale(1)' }}>
                <UploadCloud size={48} color={status === 'error' ? 'var(--color-danger)' : "var(--color-primary)"} style={{ marginBottom: 16, animation: 'float-icon 3s ease-in-out infinite' }} />
                <p style={{ fontSize: 16, color: 'var(--color-text)', marginBottom: 4 }}>
                  {status === 'error' ? 'Something went wrong' : 'Drop your CSV, JSON or Excel file here'}
                </p>
                <label style={{ fontSize: 14, color: 'var(--color-primary)', textDecoration: 'underline', cursor: 'pointer' }}>
                  or click to browse
                  <input type="file" accept=".csv,.json,.xlsx,.xls" onChange={handleSelect} style={{ display: 'none' }} />
                </label>
                {status === 'error' && <p style={{ fontSize: 12, color: 'var(--color-danger)', marginTop: 8 }}>{error}</p>}
                <p style={{ fontSize: 12, color: 'var(--color-dim)', marginTop: 8 }}>Supports .csv, .json, .xlsx</p>
              </div>
            ) : (
              <div style={{ marginTop: 24, padding: 20, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ padding: 12, background: 'rgba(var(--color-primary-rgb),0.1)', borderRadius: 12 }}><FileSpreadsheet size={28} color="var(--color-primary)" /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ fontSize: 15, fontWeight: 500, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file?.name}</h4>
                    <p style={{ fontSize: 13, color: 'var(--color-muted)' }}>{(file?.size / 1024).toFixed(1)} KB</p>
                  </div>
                  {status === 'done' && <CheckCircle2 size={22} color="var(--color-success)" />}
                </div>
                {status === 'uploading' && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--color-muted)', marginBottom: 4 }}><span>Processing...</span></div>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                      <motion.div initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 1.5 }} style={{ height: '100%', background: 'var(--color-primary)', boxShadow: '0 0 8px var(--color-primary)' }} />
                    </div>
                  </div>
                )}
              </div>
            )}

            <button onClick={close}
              disabled={status !== 'done' && status !== 'error'}
              style={{ marginTop: 24, width: '100%', height: 48, borderRadius: 12, border: 'none', fontSize: 15, fontWeight: 600, cursor: (status === 'done' || status === 'error') ? 'pointer' : 'not-allowed', background: status === 'done' ? 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' : status === 'error' ? 'var(--color-danger)' : 'rgba(255,255,255,0.05)', color: (status === 'done' || status === 'error') ? 'white' : 'var(--color-dim)', opacity: (status === 'done' || status === 'error') ? 1 : 0.4, transition: 'all 0.2s' }}>
              {status === 'error' ? 'Try Again' : 'Close'}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default UploadModal;

