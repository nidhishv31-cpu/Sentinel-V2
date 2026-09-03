import { create } from 'zustand';
import type { SeverityLevel } from '../config/severity';

interface UIStore {
  sidebarCollapsed: boolean;
  isMobileDrawerOpen: boolean;
  activeSeverityFilters: SeverityLevel[];
  activeTimeRange: '24h' | '7d' | '30d' | 'all';
  searchQuery: string;

  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  openMobileDrawer: () => void;
  closeMobileDrawer: () => void;
  toggleMobileDrawer: () => void;
  toggleSeverityFilter: (s: SeverityLevel) => void;
  clearSeverityFilters: () => void;
  setTimeRange: (r: '24h' | '7d' | '30d' | 'all') => void;
  setSearchQuery: (q: string) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarCollapsed: false,
  isMobileDrawerOpen: false,
  activeSeverityFilters: [],
  activeTimeRange: '24h',
  searchQuery: '',

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),

  openMobileDrawer: () => set({ isMobileDrawerOpen: true }),
  closeMobileDrawer: () => set({ isMobileDrawerOpen: false }),
  toggleMobileDrawer: () => set((s) => ({ isMobileDrawerOpen: !s.isMobileDrawerOpen })),

  toggleSeverityFilter: (sev) =>
    set((s) => ({
      activeSeverityFilters: s.activeSeverityFilters.includes(sev)
        ? s.activeSeverityFilters.filter((x) => x !== sev)
        : [...s.activeSeverityFilters, sev],
    })),

  clearSeverityFilters: () => set({ activeSeverityFilters: [] }),
  setTimeRange: (r) => set({ activeTimeRange: r }),
  setSearchQuery: (q) => set({ searchQuery: q }),
}));
