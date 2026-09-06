import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Menu, Search, RefreshCw, Bell,
  ShieldAlert, Plus, Settings as SettingsIcon, X, Sliders
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../store/uiStore';
import { useThemeStore } from '../../store/themeStore';
import { useQueryClient } from '@tanstack/react-query';

const ROUTE_LABELS: Record<string, string> = {
  '/':              'Overview Dashboard',
  '/scans':         'Security Scans Engine',
  '/scans/active':  'Active Security Scans',
  '/scans/scheduled': 'Scheduled Scans',
  '/scans/history': 'Scan History & Reports',
  '/findings':      'Vulnerability Findings',
  '/repeater':      'HTTP Request Repeater',
  '/diff':          'Baseline Diff & Flakiness Tracking',
  '/zenmap':        'Web Zenmap & Nmap Studio',
  '/recon':         'Target Reconnaissance',
  '/live-capture':  'Live Packet Capture',
  '/trace-ingest':  'Trace File Ingest',
  '/forensics':     'Packet Forensics Studio',
  '/dast':          'DAST & Scanner Engines',
  '/log-ingest':    'Log Ingest & Threat Parser',
  '/automation':    'Security Automation & Cron',
  '/reports':       'Executive Security Reports',
  '/integrations':  'Integrations & Notifications Hub',
  '/settings':      'Appearance & System Settings',
  '/landing':       'Landing Overview',
  '/design-system': 'Design System',
};

function formatRouteLabel(pathname: string): string {
  if (ROUTE_LABELS[pathname]) return ROUTE_LABELS[pathname];
  return pathname
    .replace(/^\//, '')
    .split('/')
    .map(segment => segment.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '))
    .join(' → ');
}

function useClickOutside(ref: React.RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, onClose]);
}

export const TopBar: React.FC = () => {
  const { toggleSidebar, toggleMobileDrawer, searchQuery, setSearchQuery } = useUIStore();
  const { setBlenderOpen } = useThemeStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useClickOutside(notifRef, () => setNotifOpen(false));
  useClickOutside(searchRef, () => setSearchOpen(false));

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const currentLabel = formatRouteLabel(location.pathname);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 h-14 md:h-16 flex items-center justify-between px-3 md:px-4 gap-2 md:gap-3 border-b border-[var(--color-border-subtle)] backdrop-blur-xl shadow-sm"
      style={{
        height: 'var(--topbar-height, 56px)',
        background: 'var(--color-surface)',
      }}
    >
      {/* ── Left ─────────────────────────────── */}
      <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-shrink-0">
        {/* Mobile hamburger */}
        <button
          onClick={toggleMobileDrawer}
          className="md:hidden p-2 rounded-xl transition-colors hover:bg-white/10 active:scale-95 text-[var(--color-text-muted)] cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        {/* Desktop sidebar toggle — hidden since sidebar has its own toggle now */}

        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 group cursor-pointer"
          aria-label="VulnScan Logo"
        >
          <span className="flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] text-white shadow-lg shadow-[var(--color-primary-glow)] transition-transform group-hover:scale-105 flex-shrink-0">
            <ShieldAlert size={16} />
          </span>
          <div className="flex flex-col text-left">
            <span className="font-extrabold text-xs md:text-sm tracking-tight font-display text-[var(--color-text-primary)]">
              Vuln<span className="text-[var(--color-primary)]">Scan</span>
            </span>
            <span className="text-[9px] font-bold tracking-widest uppercase text-[var(--color-text-muted)] hidden sm:block">
              Vulnerability Intelligence
            </span>
          </div>
        </button>

        {/* Breadcrumb — hidden on mobile */}
        <div className="hidden lg:flex items-center gap-2 text-xs border-l border-[var(--color-border-subtle)] pl-3 ml-2">
          <span className="font-semibold text-[var(--color-text-primary)] truncate max-w-[240px]">{currentLabel}</span>
        </div>
      </div>

      {/* ── Right Actions ────────────────────── */}
      <div className="flex items-center gap-1 md:gap-2">
        {/* Mobile search toggle */}
        <div className="relative md:hidden" ref={searchRef}>
          <button
            onClick={() => setSearchOpen(v => !v)}
            className="p-2 rounded-xl transition-colors hover:bg-white/10 active:scale-95 text-[var(--color-text-muted)] cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Search"
          >
            {searchOpen ? <X size={16} /> : <Search size={16} />}
          </button>

          <AnimatePresence>
            {searchOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-[calc(100vw-24px)] max-w-sm z-50"
              >
                <input
                  type="text"
                  placeholder="Search findings, scans, IPs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full pl-4 pr-3 py-3 rounded-xl text-sm bg-[var(--color-surface-2)] border border-[var(--color-border-subtle)] placeholder-[var(--color-text-muted)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all font-sans shadow-lg"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Desktop search */}
        <div className="relative hidden md:block">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Quick search findings, scans, IP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-56 lg:w-72 pl-8 pr-3 py-1.5 rounded-xl text-xs bg-[var(--color-surface-2)] border border-[var(--color-border-subtle)] placeholder-[var(--color-text-muted)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] transition-all font-sans"
          />
        </div>

        {/* Refresh */}
        <button
          onClick={handleRefresh}
          className={`p-2 rounded-xl transition-all hover:bg-white/10 active:scale-95 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center ${
            isRefreshing ? 'animate-spin text-[var(--color-primary)]' : ''
          }`}
          title="Refresh dashboard metrics"
        >
          <RefreshCw size={15} />
        </button>

        {/* Quick New Scan */}
        <button
          onClick={() => navigate('/scans')}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[var(--color-primary-contrast)] bg-[var(--color-primary)] hover:opacity-90 shadow-md shadow-[var(--color-primary-glow)] transition-all active:scale-95 cursor-pointer min-h-[36px]"
        >
          <Plus size={13} />
          <span>New Scan</span>
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative p-2 rounded-xl transition-colors hover:bg-white/10 active:scale-95 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Notifications"
          >
            <Bell size={16} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--sev-critical)] animate-pulse ring-2 ring-[var(--color-surface)]" />
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-[calc(100vw-24px)] max-w-sm md:w-80 rounded-2xl glass-card border border-[var(--color-border-subtle)] shadow-2xl p-4 z-50 bg-[var(--color-surface-solid)]"
              >
                <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border-subtle)]">
                  <span className="font-bold text-xs text-[var(--color-text-primary)]">System Alerts</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[var(--sev-critical)]/15 text-[var(--sev-critical)] font-semibold">
                    1 Critical Alert
                  </span>
                </div>
                <div className="mt-3 space-y-2">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--sev-critical)] flex-shrink-0" />
                      <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                        High Frequency Failed Logins
                      </span>
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)] pl-3">
                      Threshold breached on IP 192.168.1.105 (42 auth attempts)
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Theme Blender */}
        <button
          onClick={() => setBlenderOpen(true)}
          className="p-2 rounded-xl transition-colors hover:bg-white/10 active:scale-95 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Theme & Style Blender"
          title="UI/UX Theme Blender"
        >
          <Sliders size={16} />
        </button>

        {/* Settings */}
        <button
          onClick={() => navigate('/settings')}
          className="p-2 rounded-xl transition-colors hover:bg-white/10 active:scale-95 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer min-h-[44px] min-w-[44px] hidden sm:flex items-center justify-center"
          aria-label="Settings"
          title="System Settings"
        >
          <SettingsIcon size={16} />
        </button>
      </div>
    </header>
  );
};