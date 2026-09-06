import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Shield, Bell, Palette, Key, Check, 
  RefreshCw, Sliders, Type, Copy, CheckCircle2,
  Moon, Sun, Sparkles, AlertTriangle, ExternalLink,
  Laptop, Eye, Paintbrush, Wand2
} from 'lucide-react';
import { 
  useThemeStore, 
  type ColorPalette, 
  type FontTheme, 
  FONT_DEFINITIONS,
  CUSTOM_PRESETS 
} from '../store/themeStore';
import { useScanStore } from '../store/scanStore';

const SECTIONS = [
  { id: 'appearance',    label: 'Appearance & Themes', icon: Palette },
  { id: 'profile',       label: 'Account Profile',     icon: User    },
  { id: 'security',      label: 'Security & Data',     icon: Shield  },
  { id: 'notifications', label: 'Notifications',       icon: Bell    },
  { id: 'api',           label: 'API Credentials',     icon: Key     },
];

export const THEMES: { id: ColorPalette; name: string; mode: 'dark' | 'light'; bg: string; primary: string; desc: string }[] = [
  { id: 'dark-premium',  name: 'Obsidian Emerald (Default)', mode: 'dark',  bg: '#06080c', primary: '#10b981', desc: 'High-contrast dark theme with emerald highlights' },
  { id: 'google-secops', name: 'Google SecOps (Chromium)',   mode: 'dark',  bg: '#131317', primary: '#4d8efe', desc: 'Material Design 3 cloud command center with Chromium fluid aura' },
  { id: 'sentinel',      name: 'Microsoft Sentinel',         mode: 'dark',  bg: '#0e1321', primary: '#00f5d4', desc: 'Cloud-native SIEM/SOAR cyber defense with liquid glass obsidian waves' },
  { id: 'apple-dark',    name: 'macOS Sonoma Dark',          mode: 'dark',  bg: '#000000', primary: '#2997ff', desc: 'Minimalist deep black with crisp Apple typography' },
  { id: 'apple-light',   name: 'Apple Light Clean',          mode: 'light', bg: '#ffffff', primary: '#0071e3', desc: 'Crisp, high-contrast light theme for bright environments' },
  { id: 'cool-tech',     name: 'Electric Cyan',              mode: 'dark',  bg: '#050d18', primary: '#0ea5e9', desc: 'Deep navy background with vibrant cyan accents' },
  { id: 'vibrant',       name: 'Cyberpunk Violet',           mode: 'dark',  bg: '#0a0614', primary: '#a855f7', desc: 'Neon violet palette tailored for spatial defense' },
  { id: 'sunset-ops',    name: 'Sunset Ops',                 mode: 'dark',  bg: '#14080a', primary: '#f43f5e', desc: 'High-alert rose and amber contrast theme' },
  { id: 'aurora',        name: 'Holographic Aurora',         mode: 'dark',  bg: '#080718', primary: '#d946ef', desc: 'Iridescent multi-stop gradient with holographic depth' },
  { id: 'custom',        name: 'Custom Theme Studio',        mode: 'dark',  bg: '#090d16', primary: '#06b6d4', desc: 'Fully personalized color system with live color picker' }
];

export const PRIMARY_FONTS: { id: FontTheme; name: string; desc: string; sample: string }[] = [
  { id: 'jakarta',    name: 'Plus Jakarta Sans',          desc: 'Modern Neo-Grotesque UI standard with high legibility', sample: 'The quick brown fox jumps over the lazy dog 12345' },
  { id: 'inter',      name: 'Inter',                      desc: 'Global industry standard for crisp, readable UI text', sample: 'The quick brown fox jumps over the lazy dog 12345' },
  { id: 'robotoflex', name: 'Roboto Flex (Google)',       desc: 'Adaptive variable typography with high-density legibility', sample: 'Google SecOps Enterprise Command Center 2026' },
  { id: 'space',      name: 'Space Grotesk (Sentinel)',   desc: 'Futuristic cyber defense monospace & display pairing', sample: 'SIEM//SOAR Cloud-Native Cyber Defense Core 4624' },
  { id: 'sfpro',      name: 'SF Pro',                     desc: 'Apple system typography with optical size balancing', sample: 'The quick brown fox jumps over the lazy dog 12345' },
  { id: 'jetbrains',  name: 'JetBrains Mono',             desc: 'Developer monospace font with high-contrast glyphs', sample: 'CVE-2026-8812: buffer_overflow(payload)' }
];

export const Settings: React.FC<{ initialSection?: string }> = ({ initialSection = 'appearance' }) => {
  const [active, setActive] = useState(initialSection);
  const { 
    palette, setPalette, 
    blender, updateBlender, resetBlender,
    customTheme, updateCustomColors, resetCustomColors
  } = useThemeStore();
  const { clearAll, preferences, updatePreference } = useScanStore();
  
  const [profile, setProfile] = useState({ name: 'Nidhish', email: 'nidhishv31@gmail.com', organization: 'Acme Corp' });
  const [copiedToken, setCopiedToken] = useState(false);
  const [dataCleared, setDataCleared] = useState(false);
  const [showCustomStudio, setShowCustomStudio] = useState(palette === 'custom');

  const copyToClipboard = (val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  useEffect(() => {
    fetch('http://localhost:3001/api/config')
      .then(res => res.json())
      .then(data => {
        if (data.profile && data.profile.email) {
          setProfile(data.profile);
        }
      })
      .catch(() => null);
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-16">
      {/* Header Banner */}
      <div className="glass-card p-6 md:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-[var(--color-border-subtle)] rounded-3xl">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] flex items-center gap-2.5">
            <Palette className="text-[var(--color-primary)]" size={28} />
            Settings & Preferences
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Customize interface themes, custom color pickers, text clarity, and security credentials.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-pulse" />
            Active Theme: <strong className="text-[var(--color-text-primary)] capitalize">{palette}</strong>
          </span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Vertical Navigation Menu */}
        <div className="flex-shrink-0 w-full md:w-64">
          <div className="glass-card p-2 flex flex-row md:flex-col gap-1.5 overflow-x-auto md:overflow-visible sticky top-20 border border-[var(--color-border-subtle)] rounded-2xl">
            {SECTIONS.map(s => {
              const Icon = s.icon;
              const isCurrent = active === s.id;

              return (
                <button 
                  key={s.id} 
                  onClick={() => setActive(s.id)}
                  className={`flex-1 md:flex-initial flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left cursor-pointer whitespace-nowrap min-h-[44px] ${
                    isCurrent
                      ? 'bg-[var(--color-primary)] text-[var(--color-primary-contrast)] font-bold shadow-md'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white/10'
                  }`}
                >
                  <Icon size={18} />
                  <span>{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Settings Content Area */}
        <motion.div 
          className="flex-1 glass-card p-6 md:p-8 border border-[var(--color-border-subtle)] rounded-3xl" 
          key={active}
          initial={{ opacity: 0, y: 6 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.2 }}
        >
          {/* ──────────────── 1. APPEARANCE & THEMES ──────────────── */}
          {active === 'appearance' && (
            <div className="space-y-8">
              {/* Section 1: Themes */}
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border-subtle)] mb-5">
                  <div>
                    <h2 className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                      <Sun className="text-[var(--color-primary)]" size={18} />
                      Color Themes & Palette
                    </h2>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                      Select a visual theme designed for high contrast, or customize your own colors.
                    </p>
                  </div>

                  <button
                    onClick={resetBlender}
                    className="text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border-subtle)] cursor-pointer"
                  >
                    <RefreshCw size={12} /> Reset Defaults
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {THEMES.map((t) => {
                    const isSelected = palette === t.id;

                    return (
                      <div
                        key={t.id}
                        onClick={() => {
                          setPalette(t.id);
                          if (t.id === 'custom') {
                            setShowCustomStudio(true);
                          }
                        }}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                          isSelected
                            ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary-glow)] bg-[var(--color-surface-hover)] shadow-lg'
                            : 'border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] hover:border-[var(--color-border)]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span 
                              className="w-4 h-4 rounded-full border border-white/20 shadow-sm" 
                              style={{ background: t.id === 'custom' ? customTheme.primary : t.primary }} 
                            />
                            <span className="text-sm font-bold text-[var(--color-text-primary)]">{t.name}</span>
                          </div>
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-[var(--color-primary)] text-[var(--color-primary-contrast)] flex items-center justify-center text-xs font-bold">
                              <Check size={12} />
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                          {t.desc}
                        </p>

                        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs font-medium">
                          <span className="text-[var(--color-text-muted)] capitalize">{t.mode} Mode</span>
                          <span style={{ color: t.id === 'custom' ? customTheme.primary : t.primary }} className="font-semibold">
                            {isSelected ? 'Active' : t.id === 'custom' ? 'Open Custom Studio' : 'Apply Theme'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ──────────────── CUSTOM THEME STUDIO ──────────────── */}
              {(palette === 'custom' || showCustomStudio) && (
                <div className="p-6 rounded-3xl bg-[var(--color-surface-2)] border border-[var(--color-primary)] ring-1 ring-[var(--color-primary-glow)] space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--color-border-subtle)] pb-4">
                    <div>
                      <h3 className="text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                        <Paintbrush size={18} className="text-[var(--color-primary)]" />
                        Custom Palette & Color System Studio
                      </h3>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                        Choose custom background, card surfaces, text colors, and brand highlights.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={resetCustomColors}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] bg-black/20 border border-white/10 cursor-pointer flex items-center gap-1.5"
                      >
                        <RefreshCw size={12} /> Reset Colors
                      </button>
                      <button
                        onClick={() => setPalette('custom')}
                        className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5 ${
                          palette === 'custom'
                            ? 'bg-[var(--color-primary)] text-[var(--color-primary-contrast)] shadow-md'
                            : 'bg-emerald-600 text-white hover:bg-emerald-500'
                        }`}
                      >
                        <Check size={13} /> {palette === 'custom' ? 'Custom Theme Active' : 'Apply to Platform'}
                      </button>
                    </div>
                  </div>

                  {/* Starter Presets */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-[var(--color-text-primary)] block">Quick Starter Palettes</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Object.entries(CUSTOM_PRESETS).map(([k, pr]) => (
                        <button
                          key={k}
                          onClick={() => {
                            updateCustomColors(pr.colors);
                            setPalette('custom');
                          }}
                          className="p-3 rounded-xl border border-[var(--color-border-subtle)] bg-black/30 hover:border-[var(--color-primary)] text-left cursor-pointer transition-all space-y-1.5"
                        >
                          <span className="text-xs font-bold text-[var(--color-text-primary)] block truncate">{pr.name}</span>
                          <div className="flex gap-1.5">
                            <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ background: pr.colors.bgBase }} />
                            <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ background: pr.colors.surface }} />
                            <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ background: pr.colors.primary }} />
                            <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ background: pr.colors.secondary }} />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Live Custom Specimen Sandbox Card */}
                  <div 
                    className="p-5 rounded-2xl border shadow-xl space-y-3 transition-all"
                    style={{
                      background: `radial-gradient(circle at 50% 0%, ${customTheme.surface} 0%, ${customTheme.bgBase} 70%)`,
                      borderColor: customTheme.border
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: customTheme.primary }}>
                        Live Custom Theme Preview
                      </span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded-full" style={{ background: customTheme.surfaceSolid, color: customTheme.textPrimary }}>
                        Live Preview
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Inside Box Specimen */}
                      <div 
                        className="p-4 rounded-xl border space-y-2"
                        style={{ 
                          background: customTheme.surface, 
                          borderColor: customTheme.borderSubtle,
                          color: customTheme.textPrimary 
                        }}
                      >
                        <span className="text-xs font-bold block" style={{ color: customTheme.textPrimary }}>
                          Surface Card Example
                        </span>
                        <p className="text-xs" style={{ color: customTheme.textSecondary }}>
                          Secondary text color inside cards and dialogs.
                        </p>
                        <div className="flex gap-2 pt-1">
                          <button
                            className="px-3 py-1.5 rounded-lg text-xs font-bold shadow-md"
                            style={{ 
                              background: customTheme.primary, 
                              color: customTheme.primaryContrast 
                            }}
                          >
                            Primary Button
                          </button>
                          <button
                            className="px-3 py-1.5 rounded-lg text-xs font-bold border"
                            style={{ 
                              background: customTheme.surfaceSolid, 
                              color: customTheme.secondary,
                              borderColor: customTheme.borderSubtle
                            }}
                          >
                            Secondary
                          </button>
                        </div>
                      </div>

                      {/* Overlay Box Specimen */}
                      <div 
                        className="p-4 rounded-xl border space-y-2 shadow-lg"
                        style={{ 
                          background: customTheme.surfaceOverlay, 
                          borderColor: customTheme.border,
                          color: customTheme.textPrimary 
                        }}
                      >
                        <span className="text-xs font-bold block" style={{ color: customTheme.textPrimary }}>
                          Overlay & Alert Tag
                        </span>
                        <p className="text-xs" style={{ color: customTheme.textSecondary }}>
                          Raised elevation layer for alerts and notifications.
                        </p>
                        <div className="flex items-center justify-between p-2 rounded-lg" style={{ background: customTheme.surfaceSolid }}>
                          <span className="text-xs font-bold" style={{ color: customTheme.accent }}>High Severity Tag</span>
                          <span className="text-xs font-mono font-bold" style={{ color: customTheme.primary }}>CVSS 9.8</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Color Pickers Matrix */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Background */}
                    <div className="p-3.5 rounded-xl bg-black/20 border border-white/10 space-y-2.5">
                      <span className="text-xs font-bold text-[var(--color-text-primary)] block">1. Background Base</span>
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-xs text-[var(--color-text-secondary)]">Canvas Base</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="color" 
                            value={customTheme.bgBase} 
                            onChange={e => updateCustomColors({ bgBase: e.target.value })}
                            className="w-7 h-7 rounded-lg cursor-pointer border-0 bg-transparent" 
                          />
                          <input 
                            type="text" 
                            value={customTheme.bgBase} 
                            onChange={e => updateCustomColors({ bgBase: e.target.value })}
                            className="w-20 px-2 py-1 text-xs font-mono rounded-lg bg-black/40 border border-white/10 text-white" 
                          />
                        </div>
                      </div>
                    </div>

                    {/* Card Surface */}
                    <div className="p-3.5 rounded-xl bg-black/20 border border-white/10 space-y-2.5">
                      <span className="text-xs font-bold text-[var(--color-text-primary)] block">2. Card Surface</span>
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-xs text-[var(--color-text-secondary)]">Box Surface</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="color" 
                            value={customTheme.surface} 
                            onChange={e => updateCustomColors({ surface: e.target.value })}
                            className="w-7 h-7 rounded-lg cursor-pointer border-0 bg-transparent" 
                          />
                          <input 
                            type="text" 
                            value={customTheme.surface} 
                            onChange={e => updateCustomColors({ surface: e.target.value })}
                            className="w-20 px-2 py-1 text-xs font-mono rounded-lg bg-black/40 border border-white/10 text-white" 
                          />
                        </div>
                      </div>
                    </div>

                    {/* Primary Accent */}
                    <div className="p-3.5 rounded-xl bg-black/20 border border-white/10 space-y-2.5">
                      <span className="text-xs font-bold text-[var(--color-text-primary)] block">3. Primary Brand Accent</span>
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-xs text-[var(--color-text-secondary)]">Primary Accent</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="color" 
                            value={customTheme.primary} 
                            onChange={e => updateCustomColors({ primary: e.target.value })}
                            className="w-7 h-7 rounded-lg cursor-pointer border-0 bg-transparent" 
                          />
                          <input 
                            type="text" 
                            value={customTheme.primary} 
                            onChange={e => updateCustomColors({ primary: e.target.value })}
                            className="w-20 px-2 py-1 text-xs font-mono rounded-lg bg-black/40 border border-white/10 text-white" 
                          />
                        </div>
                      </div>
                    </div>

                    {/* Secondary Accent */}
                    <div className="p-3.5 rounded-xl bg-black/20 border border-white/10 space-y-2.5">
                      <span className="text-xs font-bold text-[var(--color-text-primary)] block">4. Secondary Accent</span>
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-xs text-[var(--color-text-secondary)]">Secondary Accent</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="color" 
                            value={customTheme.secondary} 
                            onChange={e => updateCustomColors({ secondary: e.target.value })}
                            className="w-7 h-7 rounded-lg cursor-pointer border-0 bg-transparent" 
                          />
                          <input 
                            type="text" 
                            value={customTheme.secondary} 
                            onChange={e => updateCustomColors({ secondary: e.target.value })}
                            className="w-20 px-2 py-1 text-xs font-mono rounded-lg bg-black/40 border border-white/10 text-white" 
                          />
                        </div>
                      </div>
                    </div>

                    {/* Text Primary */}
                    <div className="p-3.5 rounded-xl bg-black/20 border border-white/10 space-y-2.5">
                      <span className="text-xs font-bold text-[var(--color-text-primary)] block">5. Text Primary</span>
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-xs text-[var(--color-text-secondary)]">Headings & Titles</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="color" 
                            value={customTheme.textPrimary} 
                            onChange={e => updateCustomColors({ textPrimary: e.target.value })}
                            className="w-7 h-7 rounded-lg cursor-pointer border-0 bg-transparent" 
                          />
                          <input 
                            type="text" 
                            value={customTheme.textPrimary} 
                            onChange={e => updateCustomColors({ textPrimary: e.target.value })}
                            className="w-20 px-2 py-1 text-xs font-mono rounded-lg bg-black/40 border border-white/10 text-white" 
                          />
                        </div>
                      </div>
                    </div>

                    {/* Border & Highlight */}
                    <div className="p-3.5 rounded-xl bg-black/20 border border-white/10 space-y-2.5">
                      <span className="text-xs font-bold text-[var(--color-text-primary)] block">6. Border Accent</span>
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-xs text-[var(--color-text-secondary)]">Border Line</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="color" 
                            value={customTheme.border} 
                            onChange={e => updateCustomColors({ border: e.target.value })}
                            className="w-7 h-7 rounded-lg cursor-pointer border-0 bg-transparent" 
                          />
                          <input 
                            type="text" 
                            value={customTheme.border} 
                            onChange={e => updateCustomColors({ border: e.target.value })}
                            className="w-20 px-2 py-1 text-xs font-mono rounded-lg bg-black/40 border border-white/10 text-white" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Section 2: Typography & Clarity */}
              <div className="pt-4 border-t border-[var(--color-border-subtle)]">
                <div className="pb-4 mb-4">
                  <h2 className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                    <Type className="text-[var(--color-primary)]" size={18} />
                    Typography & Font Family
                  </h2>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                    Choose the primary typeface for headers, tables, and security metrics.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {PRIMARY_FONTS.map((f) => {
                    const isSelected = blender.fontFamily === f.id;
                    const fontDef = FONT_DEFINITIONS[f.id] || FONT_DEFINITIONS.jakarta;

                    return (
                      <div
                        key={f.id}
                        onClick={() => updateBlender({ fontFamily: f.id })}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                          isSelected
                            ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary-glow)] bg-[var(--color-surface-hover)] shadow-md'
                            : 'border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] hover:border-[var(--color-border)]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-[var(--color-text-primary)]">{f.name}</span>
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-[var(--color-primary)] text-[var(--color-primary-contrast)] flex items-center justify-center text-xs font-bold">
                              <Check size={12} />
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-[var(--color-text-secondary)]">{f.desc}</p>
                        
                        <div className="p-2.5 rounded-xl bg-black/20 border border-white/5" style={{ fontFamily: fontDef.body }}>
                          <p className="text-xs text-[var(--color-text-primary)] font-medium truncate">
                            {f.sample}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section 3: Interface Controls */}
              <div className="pt-4 border-t border-[var(--color-border-subtle)]">
                <div className="pb-4 mb-4">
                  <h2 className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                    <Sliders className="text-[var(--color-primary)]" size={18} />
                    Interface Display Controls
                  </h2>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                    Adjust corner smoothing and background glass blur strength.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-5 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border-subtle)]">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-[var(--color-text-primary)]">Border Corner Radius</span>
                      <span className="font-mono text-[var(--color-primary)]">{blender.radiusBase}px</span>
                    </div>
                    <input
                      type="range"
                      min="4"
                      max="24"
                      value={blender.radiusBase}
                      onChange={(e) => updateBlender({ radiusBase: Number(e.target.value) })}
                      className="w-full accent-[var(--color-primary)] cursor-pointer"
                    />
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Adjusts curvature across all cards and modal windows.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-[var(--color-text-primary)]">Backdrop Blur Strength</span>
                      <span className="font-mono text-[var(--color-primary)]">{blender.glassBlur}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="32"
                      value={blender.glassBlur}
                      onChange={(e) => updateBlender({ glassBlur: Number(e.target.value) })}
                      className="w-full accent-[var(--color-primary)] cursor-pointer"
                    />
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Controls the depth effect on frosted glass panels.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────── 2. ACCOUNT PROFILE ──────────────── */}
          {active === 'profile' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-[var(--color-text-primary)]">Account Profile</h2>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                  Your identity and organization permissions for audit logging.
                </p>
              </div>

              <div className="space-y-4 max-w-xl">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-[var(--color-text-secondary)]">Full Name</label>
                  <input 
                    type="text" 
                    value={profile.name} 
                    onChange={e => setProfile({ ...profile, name: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-[var(--color-text-secondary)]">Email Address</label>
                  <input 
                    type="email" 
                    value={profile.email} 
                    onChange={e => setProfile({ ...profile, email: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-[var(--color-text-secondary)]">Organization</label>
                  <input 
                    type="text" 
                    value={profile.organization} 
                    onChange={e => setProfile({ ...profile, organization: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]" 
                  />
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => alert('Profile updated successfully.')}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[var(--color-primary)] text-[var(--color-primary-contrast)] hover:opacity-90 transition-all cursor-pointer shadow-sm"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────── 3. SECURITY & DATA ──────────────── */}
          {active === 'security' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-[var(--color-text-primary)]">Security & Data Management</h2>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                  Manage authentication enforcement and local workspace data retention.
                </p>
              </div>

              <div className="space-y-4 max-w-xl">
                <div className="p-4 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border-subtle)] flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold text-[var(--color-text-primary)] block">SSO Authentication</span>
                    <span className="text-xs text-[var(--color-text-secondary)]">Single Sign-On is active and verified for this session.</span>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Active
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/30 space-y-3">
                  <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                    <AlertTriangle size={16} />
                    Danger Zone: Reset Workspace Data
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    Permanently delete all stored scan history, temporary logs, and cached findings. This action cannot be undone.
                  </p>
                  <button 
                    onClick={() => { 
                      if (confirm('Are you sure you want to delete all scan history and local cache?')) {
                        clearAll();
                        setDataCleared(true);
                        setTimeout(() => setDataCleared(false), 3000);
                      }
                    }}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition-all cursor-pointer shadow-sm"
                  >
                    {dataCleared ? 'Data Cleared Successfully' : 'Clear All Workspace Data'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────── 4. NOTIFICATIONS ──────────────── */}
          {active === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-[var(--color-text-primary)]">Notification Channels</h2>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                  Configure real-time notifications for completed scans and critical vulnerability discoveries.
                </p>
              </div>

              <div className="space-y-3 max-w-xl">
                {[
                  { label: 'Email alerts on critical severity findings', desc: 'Sends immediate alert when CVSS >= 9.0 is detected', key: 'emailCritical' as const },
                  { label: 'Email summary on scan completion', desc: 'Sends full summary report when a scan completes', key: 'emailCompletion' as const },
                  { label: 'Slack & Webhook notifications', desc: 'Dispatches payload to configured incoming webhook URL', key: 'slackAlerts' as const },
                  { label: 'Weekly posture digest report', desc: 'Weekly analytics recap of resolved vs active CVEs', key: 'weeklyDigest' as const },
                ].map(pref => {
                  const isOn = preferences[pref.key];
                  const toggle = () => updatePreference(pref.key, !isOn);

                  return (
                    <div key={pref.key} className="p-4 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border-subtle)] flex items-center justify-between gap-4">
                      <div>
                        <span className="text-sm font-semibold text-[var(--color-text-primary)] block">{pref.label}</span>
                        <span className="text-xs text-[var(--color-text-secondary)]">{pref.desc}</span>
                      </div>
                      
                      <button
                        onClick={toggle}
                        className={`w-12 h-6 rounded-full transition-all relative cursor-pointer flex-shrink-0 ${
                          isOn ? 'bg-[var(--color-primary)]' : 'bg-black/40 border border-white/10'
                        }`}
                      >
                        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                          isOn ? 'left-[26px]' : 'left-0.5'
                        }`} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ──────────────── 5. API CREDENTIALS ──────────────── */}
          {active === 'api' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-[var(--color-text-primary)]">API Token Credentials</h2>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                  Use this secret key to trigger pipeline runs and ingest SARIF reports from CI/CD workflows.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border-subtle)] space-y-4 max-w-xl">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[var(--color-text-primary)]">Production CI/CD API Key</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                    Active
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between gap-3">
                  <code className="text-xs font-mono text-[var(--color-primary)] truncate">
                    vulnscan_live_9fca773e88241a9204b12
                  </code>
                  <button
                    onClick={() => copyToClipboard('vulnscan_live_9fca773e88241a9204b12')}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold flex-shrink-0"
                  >
                    {copiedToken ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    <span>{copiedToken ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <p className="text-xs text-[var(--color-text-muted)]">
                  Keep your API keys secret. Do not commit tokens into public version control.
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;