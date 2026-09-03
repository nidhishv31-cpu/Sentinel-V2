import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sliders, X, Sparkles, Check, RefreshCw, Eye, 
  ShieldAlert, Zap, Activity, Sun, Flame, Terminal, Wand2, Type, Apple
} from 'lucide-react';
import { 
  useThemeStore, 
  type ColorPalette, 
  type FontTheme, 
  FONT_DEFINITIONS 
} from '../../store/themeStore';

const PALETTES: { id: ColorPalette; name: string; icon: any; bg: string; primary: string; desc: string }[] = [
  { id: 'dark-premium', name: 'Obsidian Emerald', icon: ShieldAlert, bg: '#06080c', primary: '#10b981', desc: 'Sleek dark cyber defense' },
  { id: 'vibrant', name: 'Cyberpunk Violet', icon: Zap, bg: '#0a0614', primary: '#a855f7', desc: 'Neon violet spatial grid' },
  { id: 'cool-tech', name: 'Electric Cyan', icon: Activity, bg: '#050d18', primary: '#0ea5e9', desc: 'Deep ocean network stream' },
  { id: 'light', name: 'True Light Luxury', icon: Sun, bg: '#f8fafc', primary: '#4f46e5', desc: 'High-contrast frosted white' },
  { id: 'sunset-ops', name: 'Sunset Ops', icon: Flame, bg: '#14080a', primary: '#f43f5e', desc: 'Amber, coral & maroon alarms' },
  { id: 'aurora', name: 'Holographic Aurora', icon: Wand2, bg: '#080718', primary: '#d946ef', desc: 'Iridescent multi-stop gradient' },
  { id: 'ios-dark', name: 'Dark Theme', icon: Sparkles, bg: '#000000', primary: '#0a84ff', desc: 'True black iOS aesthetics' },
  { id: 'apple-light', name: 'Apple Light', icon: Apple, bg: '#ffffff', primary: '#0071e3', desc: 'apple.com clarity — clean, minimal' },
  { id: 'apple-dark', name: 'Apple Dark', icon: Apple, bg: '#000000', primary: '#2997ff', desc: 'macOS Sonoma dark — depth, elegance' },
  { id: 'custom', name: 'Custom Studio', icon: Sliders, bg: '#090d16', primary: '#06b6d4', desc: 'User custom styled profile' }
];

const FONTS_LIST: { id: FontTheme; name: string }[] = [
  { id: 'jakarta', name: 'Plus Jakarta Sans' },
  { id: 'inter', name: 'Inter' },
  { id: 'space', name: 'Space Grotesk' },
  { id: 'anthropic', name: 'Newsreader (Anthropic)' },
  { id: 'jetbrains', name: 'JetBrains Mono' },
  { id: 'roboto', name: 'Roboto' },
  { id: 'outfit', name: 'Outfit' },
  { id: 'sora', name: 'Sora' },
  { id: 'fira', name: 'Fira Code' },
  { id: 'dmsans', name: 'DM Sans' }
];

export const StyleBlenderModal: React.FC = () => {
  const { palette, setPalette, blender, updateBlender, resetBlender, isBlenderOpen, setBlenderOpen } = useThemeStore();

  if (!isBlenderOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="glass-modal w-full max-w-2xl p-6 relative overflow-hidden"
        >
          {/* Top Bar Header */}
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-[var(--color-border-subtle)]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[var(--color-primary-glow)] text-[var(--color-primary)]">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold font-display text-[var(--color-text-primary)]">
                  UI/UX Style Blender & Global Theme Engine
                </h2>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Customize 7 color systems, 10 fonts, glass blur & tactile depth in real time
                </p>
              </div>
            </div>
            <button
              onClick={() => setBlenderOpen(false)}
              className="p-2 rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
            {/* 1. Color Palette System Selector */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[var(--color-primary)]" />
                Select Color Palette (7 Themes)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {PALETTES.map((p) => {
                  const isSelected = palette === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setPalette(p.id)}
                      className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary-glow)] bg-[var(--color-surface-hover)] shadow-lg'
                          : 'border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] hover:border-[var(--color-border)] opacity-80 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm" style={{ background: p.primary }} />
                          <span className="text-xs font-bold text-[var(--color-text-primary)]">{p.name}</span>
                        </div>
                        {isSelected && (
                          <span className="w-4 h-4 rounded-full bg-[var(--color-primary)] text-[var(--color-primary-contrast)] flex items-center justify-center text-xs">
                            <Check className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--color-text-muted)] mt-1.5 truncate">{p.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Glassmorphism & Physics Controls */}
            <div className="glass-panel p-5 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[var(--color-secondary)]" />
                Glass Intensity & Physics
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-[var(--color-text-muted)]">Backdrop Blur</span>
                    <span className="font-mono font-bold text-[var(--color-primary)]">{blender.glassBlur}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="32"
                    value={blender.glassBlur}
                    onChange={(e) => updateBlender({ glassBlur: Number(e.target.value) })}
                    className="w-full accent-[var(--color-primary)] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-[var(--color-text-muted)]">Corner Radius</span>
                    <span className="font-mono font-bold text-[var(--color-primary)]">{blender.radiusBase}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    value={blender.radiusBase}
                    onChange={(e) => updateBlender({ radiusBase: Number(e.target.value) })}
                    className="w-full accent-[var(--color-primary)] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-[var(--color-text-muted)]">Surface Opacity</span>
                    <span className="font-mono font-bold text-[var(--color-primary)]">{Math.round(blender.glassOpacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="0.95"
                    step="0.05"
                    value={blender.glassOpacity}
                    onChange={(e) => updateBlender({ glassOpacity: Number(e.target.value) })}
                    className="w-full accent-[var(--color-primary)] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-[var(--color-text-muted)]">Neomorphic Depth</span>
                    <span className="font-mono font-bold text-[var(--color-primary)]">{blender.neoDepth}px</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="14"
                    value={blender.neoDepth}
                    onChange={(e) => updateBlender({ neoDepth: Number(e.target.value) })}
                    className="w-full accent-[var(--color-primary)] cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* 3. Top 10 Fonts Selector */}
            <div className="glass-panel p-5 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] flex items-center gap-2">
                <Type className="w-4 h-4 text-[var(--color-primary)]" />
                Global Typography (Top 10 Fonts)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {FONTS_LIST.map((f) => {
                  const isSelected = blender.fontFamily === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => updateBlender({ fontFamily: f.id })}
                      className={`p-2.5 rounded-xl border text-center text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold'
                          : 'border-[var(--color-border-subtle)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                      }`}
                    >
                      {f.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between pt-4 mt-6 border-t border-[var(--color-border-subtle)]">
            <button
              onClick={resetBlender}
              className="text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset Default Tokens
            </button>
            <button
              onClick={() => setBlenderOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--color-primary)] text-[var(--color-primary-contrast)] shadow-md cursor-pointer"
            >
              Apply Changes
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default StyleBlenderModal;