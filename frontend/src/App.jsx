import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'sonner';
import { useDashboardStore } from './store/dashboardStore';
import { interpretQueryFromBackend } from './lib/queryInterpreter';
import LiveBackground from './components/LiveBackground';
import Header from './components/Header';
import KpiTicker from './components/KpiTicker';
import QueryInput from './components/QueryInput';
import LoadingSequence from './components/LoadingSequence';
import Dashboard from './components/Dashboard';
import ChatSidebar from './components/ChatSidebar';
import QueryHistorySidebar from './components/QueryHistorySidebar';
import UploadModal from './components/UploadModal';
import ExportFAB from './components/ExportFAB';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import ProtectedRoute from './ProtectedRoute';
import LoginPage from './LoginPage';

const MainApp = () => {
  const { theme, activeQuery, setActiveQuery, dashboardConfig, setDashboardConfig, isLoading, setIsLoading, addToHistory } = useDashboardStore();

  // Apply theme class to html on mount and on change
  useEffect(() => {
    document.documentElement.className = `theme-${theme}`;
  }, [theme]);

  // Handle query from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const q = urlParams.get('q');
    if (q) handleSubmit(decodeURIComponent(q));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = useCallback(async (queryText) => {
    const clean = (queryText || '').trim();
    if (!clean) return;
    setActiveQuery(clean);
    setIsLoading(true);
    // Call backend API for real data analysis
    const config = await interpretQueryFromBackend(clean);
    setDashboardConfig(config);
  }, [setActiveQuery, setIsLoading, setDashboardConfig]);

  const handleLoadingComplete = useCallback(() => {
    setIsLoading(false);
    if (activeQuery && dashboardConfig) {
      addToHistory(activeQuery, dashboardConfig);
    }
  }, [setIsLoading, activeQuery, dashboardConfig, addToHistory]);

  const handleFollowup = (text) => {
    handleSubmit(text);
  };

  const handleRestoreHistory = (item) => {
    setActiveQuery(item.text);
    setDashboardConfig(item.config);
    setIsLoading(false);
  };

  const isHero = !activeQuery && !dashboardConfig && !isLoading;

  return (
    <div style={{ position: 'relative', minHeight: '100vh', fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      <Toaster theme="dark" position="bottom-right" toastOptions={{ style: { background: 'rgba(10,5,30,0.95)', border: '1px solid rgba(var(--color-primary-rgb),0.3)', color: 'white', backdropFilter: 'blur(12px)' } }} />

      {/* Background Layers */}
      <LiveBackground />

      {/* Header & Ticker */}
      <Header />
      <KpiTicker />

      {/* Main Content */}
      <main style={{ marginTop: 102, padding: '32px 28px', minHeight: 'calc(100vh - 102px)', position: 'relative', zIndex: 10 }}>
        <AnimatePresence mode="wait">
          {isHero ? (
            <motion.div key="hero" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }}>
              <QueryInput onSubmit={handleSubmit} isCompact={false} />
            </motion.div>
          ) : (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <QueryInput onSubmit={handleSubmit} isCompact={true} />
              {isLoading ? (
                <LoadingSequence onComplete={handleLoadingComplete} />
              ) : (
                <Dashboard config={dashboardConfig} onFollowup={handleFollowup} activeQuery={activeQuery} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Sidebars & Modals */}
      <ChatSidebar onQuery={handleSubmit} />
      <QueryHistorySidebar onRestore={handleRestoreHistory} />
      <UploadModal />
      <ExportFAB activeQuery={activeQuery} />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <MainApp />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
