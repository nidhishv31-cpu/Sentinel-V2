import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Sliders, AlertTriangle, Box, Cpu, Layers, 
  Palette, Eye, CheckCircle2, ShieldAlert, ArrowRight, 
  Zap, Copy, Check, MousePointer, Activity, ToggleLeft, ToggleRight,
  Info, ExternalLink, RefreshCw, Terminal, Sun, Flame, Wand2, Grid3X3, Apple
} from 'lucide-react';

/* ==========================================================================
   1. EMBEDDED EXPANDED DESIGN SYSTEM ENGINE (7 DISTINCT PALETTES)
   ========================================================================== */
export const DESIGN_SYSTEM_STYLES = `
  /* 1. Obsidian Emerald (dark-premium) */
  :root, [data-palette="dark-premium"] {
    --color-bg-base: #06080c;
    --color-bg-gradient: radial-gradient(circle at 50% 0%, #0d131f 0%, #06080c 70%);
    --color-surface-rgb: 18, 24, 38;
    --color-surface-2-rgb: 26, 35, 54;
    --color-surface: rgba(18, 24, 38, 0.75);
    --color-surface-solid: #111724;
    --color-surface-2: rgba(255, 255, 255, 0.04);
    --color-surface-hover: rgba(255, 255, 255, 0.08);
    --color-overlay: rgba(0, 0, 0, 0.4);
    --color-border: rgba(16, 185, 129, 0.3);
    --color-border-subtle: rgba(255, 255, 255, 0.08);

    --color-text-primary: #f1f5f9;
    --color-text-secondary: #94a3b8;
    --color-text-muted: #64748b;
    --color-text-faint: #475569;

    --color-primary: #10b981;
    --color-primary-contrast: #022c22;
    --color-primary-glow: rgba(16, 185, 129, 0.35);
    --color-secondary: #3b82f6;
    --color-secondary-contrast: #ffffff;
    --color-secondary-glow: rgba(59, 130, 246, 0.3);
    --color-accent: #f43f5e;
    --color-accent-contrast: #ffffff;

    --sev-critical: #ef4444;
    --sev-high: #f97316;
    --sev-medium: #eab308;
    --sev-low: #3b82f6;
    --sev-info: #94a3b8;

    --neo-shadow-light: rgba(255, 255, 255, 0.05);
    --neo-shadow-dark: rgba(0, 0, 0, 0.6);
    --radius-base: 14px;
    --noise-opacity: 0.03;
  }

  /* 2. Cyberpunk Violet (vibrant) */
  [data-palette="vibrant"] {
    --color-bg-base: #0a0614;
    --color-bg-gradient: radial-gradient(circle at 20% 15%, rgba(139, 92, 246, 0.22) 0%, rgba(15, 7, 30, 0.95) 45%, #080312 100%);
    --color-surface: rgba(26, 17, 46, 0.75);
    --color-surface-solid: #190f2d;
    --color-surface-2: rgba(255, 255, 255, 0.05);
    --color-surface-hover: rgba(255, 255, 255, 0.09);
    --color-overlay: rgba(0, 0, 0, 0.45);
    --color-border: rgba(168, 85, 247, 0.35);
    --color-border-subtle: rgba(255, 255, 255, 0.1);

    --color-text-primary: #faf5ff;
    --color-text-secondary: #c084fc;
    --color-text-muted: #8b5cf6;
    --color-text-faint: #6b21a8;

    --color-primary: #a855f7;
    --color-primary-contrast: #1e0538;
    --color-primary-glow: rgba(168, 85, 247, 0.4);
    --color-secondary: #06b6d4;
    --color-secondary-contrast: #082f49;
    --color-secondary-glow: rgba(6, 182, 212, 0.35);
    --color-accent: #f43f5e;
    --color-accent-contrast: #ffffff;

    --sev-critical: #ff2a5f;
    --sev-high: #fb923c;
    --sev-medium: #facc15;
    --sev-low: #38bdf8;
    --sev-info: #c084fc;

    --neo-shadow-light: rgba(255, 255, 255, 0.06);
    --neo-shadow-dark: rgba(0, 0, 0, 0.65);
    --radius-base: 16px;
    --noise-opacity: 0.04;
  }

  /* 3. Electric Cyan (cool-tech) */
  [data-palette="cool-tech"] {
    --color-bg-base: #050d18;
    --color-bg-gradient: radial-gradient(circle at 80% 10%, rgba(14, 165, 233, 0.2) 0%, rgba(6, 21, 38, 0.95) 50%, #030811 100%);
    --color-surface: rgba(11, 28, 48, 0.75);
    --color-surface-solid: #0d2238;
    --color-surface-2: rgba(255, 255, 255, 0.04);
    --color-surface-hover: rgba(255, 255, 255, 0.08);
    --color-overlay: rgba(0, 0, 0, 0.4);
    --color-border: rgba(56, 189, 248, 0.35);
    --color-border-subtle: rgba(255, 255, 255, 0.08);

    --color-text-primary: #f0f9ff;
    --color-text-secondary: #7dd3fc;
    --color-text-muted: #38bdf8;
    --color-text-faint: #0369a1;

    --color-primary: #0ea5e9;
    --color-primary-contrast: #082f49;
    --color-primary-glow: rgba(14, 165, 233, 0.4);
    --color-secondary: #10b981;
    --color-secondary-contrast: #022c22;
    --color-secondary-glow: rgba(16, 185, 129, 0.35);
    --color-accent: #f59e0b;
    --color-accent-contrast: #451a03;

    --sev-critical: #ef4444;
    --sev-high: #f97316;
    --sev-medium: #eab308;
    --sev-low: #38bdf8;
    --sev-info: #7dd3fc;

    --neo-shadow-light: rgba(255, 255, 255, 0.05);
    --neo-shadow-dark: rgba(0, 0, 0, 0.6);
    --radius-base: 12px;
    --noise-opacity: 0.03;
  }

  /* 4. True Light Luxury (light) */
  [data-palette="light"] {
    --color-bg-base: #f8fafc;
    --color-bg-gradient: radial-gradient(circle at 10% 20%, rgba(224, 231, 255, 0.7) 0%, #f8fafc 60%, #f1f5f9 100%);
    --color-surface: rgba(255, 255, 255, 0.85);
    --color-surface-solid: #ffffff;
    --color-surface-2: rgba(15, 23, 42, 0.04);
    --color-surface-hover: rgba(15, 23, 42, 0.07);
    --color-overlay: rgba(15, 23, 42, 0.04);
    --color-border: rgba(99, 102, 241, 0.25);
    --color-border-subtle: rgba(15, 23, 42, 0.09);

    --color-text-primary: #0f172a;
    --color-text-secondary: #334155;
    --color-text-muted: #64748b;
    --color-text-faint: #94a3b8;

    --color-primary: #4f46e5;
    --color-primary-contrast: #ffffff;
    --color-primary-glow: rgba(79, 70, 229, 0.25);
    --color-secondary: #0284c7;
    --color-secondary-contrast: #ffffff;
    --color-secondary-glow: rgba(2, 132, 199, 0.2);
    --color-accent: #e11d48;
    --color-accent-contrast: #ffffff;

    --sev-critical: #dc2626;
    --sev-high: #ea580c;
    --sev-medium: #d97706;
    --sev-low: #2563eb;
    --sev-info: #64748b;

    --neo-shadow-light: rgba(255, 255, 255, 0.95);
    --neo-shadow-dark: rgba(148, 163, 184, 0.35);
    --radius-base: 14px;
    --noise-opacity: 0.01;
  }

  /* 5. Sunset Ops (sunset-ops) */
  [data-palette="sunset-ops"] {
    --color-bg-base: #14080a;
    --color-bg-gradient: radial-gradient(circle at 80% 20%, rgba(244, 63, 94, 0.2) 0%, rgba(41, 10, 18, 0.95) 50%, #0d0406 100%);
    --color-surface: rgba(36, 12, 18, 0.78);
    --color-surface-solid: #260c13;
    --color-surface-2: rgba(255, 255, 255, 0.04);
    --color-surface-hover: rgba(255, 255, 255, 0.08);
    --color-overlay: rgba(0, 0, 0, 0.45);
    --color-border: rgba(244, 63, 94, 0.35);
    --color-border-subtle: rgba(255, 255, 255, 0.09);

    --color-text-primary: #fff1f2;
    --color-text-secondary: #fecdd3;
    --color-text-muted: #fb7185;
    --color-text-faint: #be123c;

    --color-primary: #f43f5e;
    --color-primary-contrast: #ffffff;
    --color-primary-glow: rgba(244, 63, 94, 0.4);
    --color-secondary: #f97316;
    --color-secondary-contrast: #ffffff;
    --color-secondary-glow: rgba(249, 115, 22, 0.35);
    --color-accent: #fbbf24;
    --color-accent-contrast: #451a03;

    --sev-critical: #ff1f4b;
    --sev-high: #ff781f;
    --sev-medium: #f59e0b;
    --sev-low: #fb7185;
    --sev-info: #fda4af;

    --neo-shadow-light: rgba(255, 255, 255, 0.05);
    --neo-shadow-dark: rgba(0, 0, 0, 0.7);
    --radius-base: 14px;
    --noise-opacity: 0.04;
  }

  /* 6. High-Contrast Terminal (terminal) */
  [data-palette="terminal"] {
    --color-bg-base: #030503;
    --color-bg-gradient: linear-gradient(180deg, #020802 0%, #030503 100%);
    --color-surface: rgba(4, 16, 6, 0.9);
    --color-surface-solid: #041406;
    --color-surface-2: rgba(34, 197, 94, 0.05);
    --color-surface-hover: rgba(34, 197, 94, 0.12);
    --color-overlay: rgba(0, 0, 0, 0.6);
    --color-border: #22c55e;
    --color-border-subtle: rgba(34, 197, 94, 0.25);

    --color-text-primary: #4ade80;
    --color-text-secondary: #22c55e;
    --color-text-muted: #15803d;
    --color-text-faint: #166534;

    --color-primary: #22c55e;
    --color-primary-contrast: #000000;
    --color-primary-glow: rgba(34, 197, 94, 0.5);
    --color-secondary: #10b981;
    --color-secondary-contrast: #000000;
    --color-secondary-glow: rgba(16, 185, 129, 0.4);
    --color-accent: #eab308;
    --color-accent-contrast: #000000;

    --sev-critical: #ef4444;
    --sev-high: #f97316;
    --sev-medium: #eab308;
    --sev-low: #22c55e;
    --sev-info: #4ade80;

    --neo-shadow-light: rgba(34, 197, 94, 0.06);
    --neo-shadow-dark: rgba(0, 0, 0, 0.85);
    --radius-base: 2px;
    --noise-opacity: 0.08;
  }

  /* 7. Holographic Aurora (aurora) */
  [data-palette="aurora"] {
    --color-bg-base: #080718;
    --color-bg-gradient: linear-gradient(135deg, #0d0926 0%, #150933 25%, #05162a 50%, #190924 75%, #09061c 100%);
    --color-surface: rgba(22, 16, 48, 0.72);
    --color-surface-solid: #1b133d;
    --color-surface-2: rgba(255, 255, 255, 0.06);
    --color-surface-hover: rgba(255, 255, 255, 0.12);
    --color-overlay: rgba(0, 0, 0, 0.4);
    --color-border: rgba(217, 70, 239, 0.4);
    --color-border-subtle: rgba(255, 255, 255, 0.12);

    --color-text-primary: #fdf4ff;
    --color-text-secondary: #f0abfc;
    --color-text-muted: #c084fc;
    --color-text-faint: #7c3aed;

    --color-primary: #d946ef;
    --color-primary-contrast: #ffffff;
    --color-primary-glow: rgba(217, 70, 239, 0.45);
    --color-secondary: #06b6d4;
    --color-secondary-contrast: #042f2e;
    --color-secondary-glow: rgba(6, 182, 212, 0.4);
    --color-accent: #38bdf8;
    --color-accent-contrast: #082f49;

    --sev-critical: #f43f5e;
    --sev-high: #fb923c;
    --sev-medium: #facc15;
    --sev-low: #38bdf8;
    --sev-info: #e879f9;

    --neo-shadow-light: rgba(255, 255, 255, 0.08);
    --neo-shadow-dark: rgba(0, 0, 0, 0.7);
    --radius-base: 20px;
    --noise-opacity: 0.05;
  }

  /* Glass Surface with Asymmetric Hover Glow */
  .ds-glass {
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    background: var(--color-surface);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-base);
    transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
  }
  .ds-glass:hover {
    border-color: var(--color-border);
  }

  /* Neomorphic Tactile Button with Contrast Awareness */
  .ds-neo-button {
    background: linear-gradient(145deg, rgba(255, 255, 255, 0.07) 0%, rgba(255, 255, 255, 0.02) 100%), var(--color-surface-solid);
    border: 1px solid var(--color-border-subtle);
    box-shadow: 4px 4px 10px var(--neo-shadow-dark), -2px -2px 6px var(--neo-shadow-light);
    border-radius: var(--radius-base);
    transition: all 0.15s ease-out;
  }
  .ds-neo-button:hover {
    transform: translateY(-1px);
    box-shadow: 5px 5px 14px var(--neo-shadow-dark), -3px -3px 8px var(--neo-shadow-light);
  }
  .ds-neo-button:active {
    transform: translateY(1px);
    box-shadow: inset 2px 2px 6px var(--neo-shadow-dark), inset -1px -1px 3px var(--neo-shadow-light);
  }

  /* 3D Transform Container */
  .ds-3d-wrap {
    perspective: 1000px;
  }

  /* Scanline / Texture Overlay */
  .ds-scanline {
    background-image: repeating-linear-gradient(
      0deg,
      rgba(0, 0, 0, var(--noise-opacity)),
      rgba(0, 0, 0, var(--noise-opacity)) 1px,
      transparent 1px,
      transparent 2px
    );
  }
`;

export const PALETTES_LIST = [
  { id: 'dark-premium', name: 'Obsidian Emerald', icon: ShieldAlert, bg: '#06080c', primary: '#10b981', desc: 'Sleek dark cyber defense' },
  { id: 'vibrant', name: 'Cyberpunk Violet', icon: Zap, bg: '#0a0614', primary: '#a855f7', desc: 'Neon violet spatial grid' },
  { id: 'cool-tech', name: 'Electric Cyan', icon: Activity, bg: '#050d18', primary: '#0ea5e9', desc: 'Deep ocean network stream' },
  { id: 'light', name: 'True Light Luxury', icon: Sun, bg: '#f8fafc', primary: '#4f46e5', desc: 'High-contrast frosted white' },
  { id: 'sunset-ops', name: 'Sunset Ops', icon: Flame, bg: '#14080a', primary: '#f43f5e', desc: 'Amber, coral & maroon alarms' },
  { id: 'terminal', name: 'CRT Terminal', icon: Terminal, bg: '#030503', primary: '#22c55e', desc: 'Phosphor green monospace' },
  { id: 'aurora', name: 'Holographic Aurora', icon: Wand2, bg: '#080718', primary: '#d946ef', desc: 'Iridescent multi-stop gradient' },
  { id: 'ios-dark', name: 'Dark Theme', icon: Sparkles, bg: '#000000', primary: '#0a84ff', desc: 'True black iOS aesthetics' },
  { id: 'apple-light', name: 'Apple Light', icon: Apple, bg: '#ffffff', primary: '#0071e3', desc: 'apple.com clarity — clean, minimal' },
  { id: 'apple-dark', name: 'Apple Dark', icon: Apple, bg: '#000000', primary: '#2997ff', desc: 'macOS Sonoma dark — depth, elegance' }
];

/* ==========================================================================
   2. UI PRIMITIVE COMPONENTS (Self-Contained & Contrast-Aware)
   ========================================================================== */

export interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', glow = false }) => {
  return (
    <div 
      className={`ds-glass p-6 transition-all duration-300 ${
        glow ? 'border-[var(--color-primary)] shadow-[0_0_20px_var(--color-primary-glow)]' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

export interface NeoButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'accent' | 'inset';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const NeoButton: React.FC<NeoButtonProps> = ({
  variant = 'default',
  size = 'md',
  icon,
  children,
  className = '',
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-xs gap-2 font-semibold',
    lg: 'px-6 py-2.5 text-sm gap-2.5 font-bold',
  }[size];

  const variantStyles = {
    default: 'text-[var(--color-text-primary)]',
    primary: 'bg-[var(--color-primary)] text-[var(--color-primary-contrast)] font-bold border-[var(--color-primary)] shadow-[0_0_15px_var(--color-primary-glow)] hover:brightness-110',
    accent: 'bg-[var(--color-secondary)] text-[var(--color-secondary-contrast)] font-bold border-[var(--color-secondary)] shadow-[0_0_15px_var(--color-secondary-glow)]',
    inset: 'bg-[var(--color-overlay)] text-[var(--color-primary)] shadow-[inset_2px_2px_6px_var(--neo-shadow-dark)] border-transparent',
  }[variant];

  return (
    <button
      className={`ds-neo-button inline-flex items-center justify-center cursor-pointer select-none ${sizeClasses} ${variantStyles} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};

export interface ThreeDCardProps {
  children: React.ReactNode;
  depth?: number;
  className?: string;
}

export const ThreeDCard: React.FC<ThreeDCardProps> = ({ children, depth = 25, className = '' }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rX = ((y - centerY) / centerY) * -(depth / 2.5);
    const rY = ((x - centerX) / centerX) * (depth / 2.5);

    setRotateX(rX);
    setRotateY(rY);
    setGlare({ x: (x / rect.width) * 100, y: (y / rect.height) * 100, opacity: 0.18 });
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setGlare(prev => ({ ...prev, opacity: 0 }));
  };

  return (
    <div className="ds-3d-wrap" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      <motion.div
        ref={cardRef}
        animate={{ rotateX, rotateY }}
        transition={{ type: 'spring', damping: 20, stiffness: 250 }}
        style={{ transformStyle: 'preserve-3d' }}
        className={`ds-glass relative overflow-hidden transition-shadow duration-300 ${className}`}
      >
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,${glare.opacity}) 0%, transparent 60%)`,
          }}
        />
        <div style={{ transform: `translateZ(${depth}px)` }}>
          {children}
        </div>
      </motion.div>
    </div>
  );
};

export const SeverityBadge: React.FC<{ severity: 'critical' | 'high' | 'medium' | 'low' | 'info'; size?: 'sm' | 'md' }> = ({ severity, size = 'sm' }) => {
  const py = size === 'sm' ? 'py-0.5 px-2 text-xs' : 'py-1 px-3 text-xs';

  return (
    <span 
      className={`inline-flex items-center gap-1.5 font-mono font-bold uppercase rounded-full border border-white/10 ${py}`}
      style={{ 
        background: `color-mix(in srgb, var(--sev-${severity}) 15%, transparent)`, 
        color: `var(--sev-${severity})`,
        borderColor: `color-mix(in srgb, var(--sev-${severity}) 30%, transparent)`
      }}
    >
      <span 
        className={`w-1.5 h-1.5 rounded-full ${severity === 'critical' ? 'animate-ping' : ''}`} 
        style={{ background: `var(--sev-${severity})` }} 
      />
      {severity.toUpperCase()}
    </span>
  );
};

/* ==========================================================================
   3. COMPLETE ALL-IN-ONE INTERACTIVE DESIGN SYSTEM SHOWCASE
   ========================================================================== */

export const DesignSystemShowcaseComplete: React.FC = () => {
  const [currentPalette, setCurrentPalette] = useState<string>('dark-premium');
  const [activeTab, setActiveTab] = useState<'glass' | 'neo' | '3d' | 'tokens' | 'playground'>('glass');
  const [toggleState, setToggleState] = useState(true);
  const [toggleState2, setToggleState2] = useState(false);
  const [sliderVal, setSliderVal] = useState(70);
  const [blurVal, setBlurVal] = useState(16);
  const [radiusVal, setRadiusVal] = useState(14);
  const [textInput, setTextInput] = useState('https://sastra.edu/api/v1/auth');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const copyToClipboard = (tokenName: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedToken(tokenName);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div 
      data-palette={currentPalette} 
      className="min-h-screen text-[var(--color-text-primary)] p-4 sm:p-8 space-y-8 max-w-7xl mx-auto ds-scanline transition-colors duration-300" 
      style={{ 
        background: 'var(--color-bg-gradient), var(--color-bg-base)',
        color: 'var(--color-text-primary)'
      }}
    >
      {/* Inject Style Engine */}
      <style>{DESIGN_SYSTEM_STYLES}</style>

      {/* ── 1. EXPANDED HERO HEADER WITH VISUAL PRESENCE ── */}
      <div className="ds-glass p-6 md:p-10 relative overflow-hidden">
        {/* Faded Background Glyph Watermark */}
        <div className="absolute right-[-20px] top-[-30px] opacity-10 pointer-events-none text-[var(--color-primary)]">
          <ShieldAlert size={280} strokeWidth={1} />
        </div>

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-[var(--color-primary-glow)] text-[var(--color-primary)] border border-[var(--color-border)]">
                <Sparkles className="w-4 h-4" />
                <span>Next-Gen UI/UX Design System Specification (7 Distinct Palettes)</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-display">
                Spatial Glassmorphism & Tactile Neomorphism Suite
              </h1>
              <p className="text-sm text-[var(--color-text-secondary)] max-w-2xl leading-relaxed">
                A unified design architecture featuring <strong>7 radical aesthetic palettes</strong> (including true frosted light mode, CRT green terminal, and multi-stop aurora gradient) paired with physical tactile shadows and 3D perspective.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <NeoButton variant="primary" size="md" icon={<Zap className="w-4 h-4" />}>
                Export Component Spec
              </NeoButton>
            </div>
          </div>

          {/* Tactile Mini-Preview Palette Switcher Grid */}
          <div className="pt-4 border-t border-[var(--color-border-subtle)] space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] block">
              Active Theme Palette (Switch to preview live system):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
              {PALETTES_LIST.map((p) => {
                const isActive = currentPalette === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setCurrentPalette(p.id)}
                    className={`p-2.5 rounded-xl text-left transition-all cursor-pointer border flex flex-col justify-between h-20 ${
                      isActive
                        ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary-glow)] bg-[var(--color-surface-hover)] scale-[1.02]'
                        : 'border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] hover:border-[var(--color-border)] opacity-85 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm" style={{ background: p.primary }} />
                      <p.icon size={13} className={isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[var(--color-text-primary)] leading-tight truncate">{p.name}</p>
                      <p className="text-[9px] text-[var(--color-text-muted)] truncate">{p.id}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. NAVIGATION LAB TABS ── */}
      <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl ds-glass w-fit">
        {[
          { id: 'glass', label: '1. Glass & Depth Layers', icon: Layers },
          { id: 'neo', label: '2. Neomorphic Tactile Controls', icon: Box },
          { id: '3d', label: '3. 3D Spatial Tilt Surfaces', icon: MousePointer },
          { id: 'tokens', label: '4. Design Tokens & Badges', icon: Palette },
          { id: 'playground', label: '5. All-Themes Side-by-Side Lab', icon: Grid3X3 }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[var(--color-primary)] text-[var(--color-primary-contrast)] shadow-md'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB 1: GLASSMORPHISM & NESTED LAYERING LAB ── */}
      {activeTab === 'glass' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 ds-glass p-6 space-y-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-secondary)] flex items-center gap-2">
                <Layers size={16} className="text-[var(--color-primary)]" />
                Live Nested Glass Depth Tester
              </h2>

              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                Observe how nested cards create physical visual layering with adaptive backdrop blur and border alpha reflections.
              </p>

              {/* Dynamic Glass Specimen */}
              <div 
                className="p-6 transition-all duration-300 space-y-4 border"
                style={{
                  backdropFilter: `blur(${blurVal}px)`,
                  WebkitBackdropFilter: `blur(${blurVal}px)`,
                  borderRadius: `${radiusVal}px`,
                  background: 'var(--color-surface-2)',
                  borderColor: 'var(--color-border)',
                  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)'
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[var(--color-primary)]">Layer 1: Base Glass Card</span>
                  <span className="text-xs font-mono text-[var(--color-text-muted)]">blur({blurVal}px) · radius({radiusVal}px)</span>
                </div>

                <div 
                  className="p-4 transition-all duration-300 space-y-2 border"
                  style={{
                    backdropFilter: `blur(${blurVal + 6}px)`,
                    borderRadius: `${Math.max(radiusVal - 4, 4)}px`,
                    background: 'var(--color-surface-hover)',
                    borderColor: 'var(--color-border-subtle)'
                  }}
                >
                  <span className="text-xs font-mono font-bold text-[var(--color-secondary)]">Layer 2: Nested Sub-Card (.card .card)</span>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    Higher alpha transparency combined with augmented blur delivers clear hierarchy without heavy black drop shadows.
                  </p>
                </div>
              </div>

              {/* Sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[var(--color-border-subtle)]">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--color-text-muted)]">Backdrop Blur:</span>
                    <span className="font-mono text-[var(--color-primary)]">{blurVal}px</span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="32"
                    value={blurVal}
                    onChange={e => setBlurVal(Number(e.target.value))}
                    className="w-full accent-[var(--color-primary)] cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--color-text-muted)]">Border Radius:</span>
                    <span className="font-mono text-[var(--color-primary)]">{radiusVal}px</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="28"
                    value={radiusVal}
                    onChange={e => setRadiusVal(Number(e.target.value))}
                    className="w-full accent-[var(--color-primary)] cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-4">
              <div className="ds-glass p-5 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)]">
                  Glassmorphism CSS Rules
                </h3>
                <div className="p-3.5 rounded-xl bg-[var(--color-overlay)] text-xs font-mono space-y-1 text-[var(--color-primary)] border border-[var(--color-border-subtle)]">
                  <p>.glass-card &#123;</p>
                  <p className="pl-4">backdrop-filter: blur(16px);</p>
                  <p className="pl-4">background: var(--color-surface);</p>
                  <p className="pl-4">border: 1px solid var(--color-border-subtle);</p>
                  <p className="pl-4">border-radius: var(--radius-base);</p>
                  <p>&#125;</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── TAB 2: NEOMORPHIC TACTILE CONTROLS LAB ── */}
      {activeTab === 'neo' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="ds-glass p-6 space-y-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-secondary)] flex items-center gap-2">
                <Box size={16} className="text-[var(--color-primary)]" />
                Physical Tactile Button Matrix
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[var(--color-surface-2)] space-y-2 text-center border border-[var(--color-border-subtle)]">
                  <span className="text-xs font-semibold text-[var(--color-text-muted)] block">Tactile Raised</span>
                  <NeoButton size="md">Raised Physical</NeoButton>
                </div>

                <div className="p-4 rounded-xl bg-[var(--color-surface-2)] space-y-2 text-center border border-[var(--color-border-subtle)]">
                  <span className="text-xs font-semibold text-[var(--color-text-muted)] block">Primary Glow</span>
                  <NeoButton variant="primary" size="md">Primary Action</NeoButton>
                </div>

                <div className="p-4 rounded-xl bg-[var(--color-surface-2)] space-y-2 text-center border border-[var(--color-border-subtle)]">
                  <span className="text-xs font-semibold text-[var(--color-text-muted)] block">Tactile Inset Pressed</span>
                  <NeoButton variant="inset" size="md">Inset State</NeoButton>
                </div>

                <div className="p-4 rounded-xl bg-[var(--color-surface-2)] space-y-2 text-center border border-[var(--color-border-subtle)]">
                  <span className="text-xs font-semibold text-[var(--color-text-muted)] block">Secondary Accent</span>
                  <NeoButton variant="accent" size="md">Secondary Action</NeoButton>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--color-border-subtle)]">
                <span className="text-xs font-bold text-[var(--color-text-primary)]">Button Sizing Specimen:</span>
                <div className="flex gap-2">
                  <NeoButton size="sm">Small</NeoButton>
                  <NeoButton size="md">Medium</NeoButton>
                  <NeoButton size="lg">Large</NeoButton>
                </div>
              </div>
            </div>

            {/* Tactile Form Inputs & Switches */}
            <div className="ds-glass p-6 space-y-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-secondary)] flex items-center gap-2">
                <Sliders size={16} className="text-[var(--color-secondary)]" />
                Tactile Inset Form Controls & Switches
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-[var(--color-text-muted)] block mb-1.5">
                    Neomorphic Inset Input with Focus Glow
                  </label>
                  <input
                    type="text"
                    value={textInput}
                    onChange={e => setTextInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl outline-none bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:ring-1 focus:ring-[var(--color-primary)] font-mono transition-all"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-[var(--color-surface-2)] space-y-3 border border-[var(--color-border-subtle)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-[var(--color-text-primary)]">Autonomous Crawl Pipeline</p>
                      <p className="text-xs text-[var(--color-text-muted)]">Real-time attack surface discovery</p>
                    </div>
                    <button
                      onClick={() => setToggleState(!toggleState)}
                      className={`w-11 h-6 rounded-full p-0.5 transition-all duration-200 cursor-pointer ${
                        toggleState ? 'bg-[var(--color-primary)]' : 'bg-black/30 border border-white/10'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${toggleState ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--color-text-muted)]">Scanner Intensity:</span>
                    <span className="font-mono font-bold text-[var(--color-primary)]">{sliderVal}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={sliderVal}
                    onChange={e => setSliderVal(Number(e.target.value))}
                    className="w-full accent-[var(--color-primary)] cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── TAB 3: 3D SPATIAL TILT LAB ── */}
      {activeTab === '3d' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ThreeDCard depth={25} className="space-y-3 p-6">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[var(--color-primary-glow)] text-[var(--color-primary)]">
                Spatial Tilt 1
              </span>
              <h3 className="text-base font-bold text-[var(--color-text-primary)]">Mouse Tracking Parallax</h3>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                Hover cursor across this card to experience subtle 3D rotational tilt and dynamic specular light reflections.
              </p>
              <div className="pt-2">
                <span className="text-xs font-mono font-bold text-[var(--color-primary)]">rotateX & rotateY Active</span>
              </div>
            </ThreeDCard>

            <ThreeDCard depth={35} className="space-y-3 p-6">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[var(--color-secondary-glow)] text-[var(--color-secondary)]">
                Spatial Tilt 2
              </span>
              <h3 className="text-base font-bold text-[var(--color-text-primary)]">Depth Extrusion (35px)</h3>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                Higher depth coefficients deliver weightless physics suitable for focal metric indicators and threat meters.
              </p>
              <div className="pt-2">
                <span className="text-xs font-mono font-bold text-[var(--color-secondary)]">Perspective: 1000px</span>
              </div>
            </ThreeDCard>

            <ThreeDCard depth={20} className="space-y-3 p-6">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400">
                Spatial Tilt 3
              </span>
              <h3 className="text-base font-bold text-[var(--color-text-primary)]">Forensics Viewport Card</h3>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                Applied to packet visualizers, live capture streams, and interactive attack map cards.
              </p>
              <div className="pt-2">
                <span className="text-xs font-mono font-bold text-rose-400">Transform-style: 3D</span>
              </div>
            </ThreeDCard>
          </div>
        </motion.div>
      )}

      {/* ── TAB 4: DESIGN TOKENS & BADGES LAB ── */}
      {activeTab === 'tokens' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="ds-glass p-6 space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-secondary)] flex items-center gap-2">
                <AlertTriangle size={16} className="text-[var(--sev-high)]" />
                Vulnerability Severity Badges
              </h2>

              <div className="space-y-2.5">
                {[
                  { sev: 'critical' as const, cvss: '9.8', desc: 'Remote Code Execution, SQLi, Auth Bypass' },
                  { sev: 'high' as const, cvss: '7.5', desc: 'XSS, Broken Access Control, Sensitive Exposure' },
                  { sev: 'medium' as const, cvss: '5.3', desc: 'Missing CSP/HSTS, Directory Listing, CORS Wildcards' },
                  { sev: 'low' as const, cvss: '2.1', desc: 'Server Version Banner, Cookie Flag Warnings' },
                  { sev: 'info' as const, cvss: '0.0', desc: 'Robots.txt, SSL Certificate Cipher Suite Details' },
                ].map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl flex items-center justify-between text-xs bg-[var(--color-surface-2)] border border-[var(--color-border-subtle)]">
                    <div className="flex items-center gap-2.5">
                      <SeverityBadge severity={item.sev} />
                      <span className="text-xs text-[var(--color-text-muted)]">{item.desc}</span>
                    </div>
                    <span className="font-mono font-bold text-xs text-[var(--color-text-primary)]">CVSS {item.cvss}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="ds-glass p-6 space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-secondary)] flex items-center gap-2">
                <Palette size={16} className="text-[var(--color-primary)]" />
                Active Resolved CSS Theme Tokens
              </h2>

              <div className="grid grid-cols-2 gap-3 text-xs">
                {[
                  { token: '--color-primary', label: 'Primary Brand Accent' },
                  { token: '--color-primary-contrast', label: 'Primary Text Contrast' },
                  { token: '--color-secondary', label: 'Secondary Accent' },
                  { token: '--color-bg-base', label: 'Background Canvas' },
                  { token: '--color-surface', label: 'Glass Surface' },
                  { token: '--radius-base', label: 'Border Radius Token' }
                ].map((tok, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => copyToClipboard(tok.token, `var(${tok.token})`)}
                    className="p-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border-subtle)] hover:border-[var(--color-primary)] cursor-pointer transition-all space-y-1"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[var(--color-text-muted)]">{tok.label}</span>
                      {copiedToken === tok.token ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} className="text-[var(--color-text-faint)]" />}
                    </div>
                    <p className="font-mono text-xs font-bold text-[var(--color-text-primary)] truncate">{tok.token}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── TAB 5: ALL-THEMES SIDE-BY-SIDE PLAYGROUND ── */}
      {activeTab === 'playground' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="ds-glass p-6 space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-secondary)] flex items-center gap-2">
              <Grid3X3 size={16} className="text-[var(--color-primary)]" />
              All 7 Theme Palettes (Side-by-Side Comparison Matrix)
            </h2>
            <p className="text-xs text-[var(--color-text-muted)]">
              Every card below is independently rendered in its own <code className="font-mono text-[var(--color-primary)]">data-palette</code> scope to demonstrate cross-theme contrast and surface behavior.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PALETTES_LIST.map((p) => (
              <div 
                key={p.id}
                data-palette={p.id}
                className="p-5 rounded-2xl border border-[var(--color-border)] shadow-xl transition-all duration-300 space-y-4"
                style={{ 
                  background: 'var(--color-bg-gradient), var(--color-bg-base)',
                  color: 'var(--color-text-primary)'
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p.icon size={16} className="text-[var(--color-primary)]" />
                    <span className="font-bold text-sm text-[var(--color-text-primary)]">{p.name}</span>
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--color-surface-2)] text-[var(--color-text-muted)]">
                    {p.id}
                  </span>
                </div>

                <p className="text-xs text-[var(--color-text-muted)]">{p.desc}</p>

                {/* Mini Specimen Card inside this Theme Scope */}
                <div className="ds-glass p-3.5 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-[var(--color-text-primary)]">Audit Status</span>
                    <SeverityBadge severity="critical" size="sm" />
                  </div>
                  <div className="flex gap-2">
                    <NeoButton variant="primary" size="sm">Primary</NeoButton>
                    <NeoButton size="sm">Tactile</NeoButton>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default DesignSystemShowcaseComplete;