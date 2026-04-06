import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useDashboardStore = create(
  persist(
    (set, get) => ({
      // Theme
      theme: 'midnight',
      setTheme: (theme) => {
        document.documentElement.className = `theme-${theme}`;
        set({ theme });
      },

      // Query state
      activeQuery: null,
      setActiveQuery: (q) => set({ activeQuery: q }),

      dashboardConfig: null,
      setDashboardConfig: (config) => set({ dashboardConfig: config }),

      isLoading: false,
      setIsLoading: (v) => set({ isLoading: v }),

      // History
      queryHistory: [],
      addToHistory: (query, config) =>
        set((state) => {
          const item = {
            id: Date.now(),
            text: query,
            timestamp: new Date().toISOString(),
            config,
            starred: false,
          };
          return { queryHistory: [item, ...state.queryHistory].slice(0, 10) };
        }),
      clearHistory: () => set({ queryHistory: [] }),
      toggleStar: (id) =>
        set((state) => ({
          queryHistory: state.queryHistory.map((h) =>
            h.id === id ? { ...h, starred: !h.starred } : h
          ),
        })),

      // UI panels
      isChatOpen: false,
      setChatOpen: (v) => set({ isChatOpen: v }),
      isHistoryOpen: false,
      setHistoryOpen: (v) => set({ isHistoryOpen: v }),
      isUploadOpen: false,
      setUploadOpen: (v) => set({ isUploadOpen: v }),
    }),
    {
      name: 'queryiq-storage',
      partialize: (state) => ({
        theme: state.theme,
        queryHistory: state.queryHistory,
      }),
    }
  )
);
