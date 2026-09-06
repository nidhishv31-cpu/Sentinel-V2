import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ColorPalette = 
  | 'dark-premium' 
  | 'vibrant' 
  | 'cool-tech' 
  | 'light' 
  | 'sunset-ops' 
  | 'aurora'
  | 'custom'
  | 'ios-dark'
  | 'apple-light'
  | 'apple-dark'
  | 'sentinel'
  | 'google-secops';

export type DeviceFrameMode = 'desktop' | 'tablet' | 'mobile';

export type FontTheme = 
  | 'jakarta' 
  | 'inter' 
  | 'space' 
  | 'anthropic' 
  | 'jetbrains' 
  | 'roboto' 
  | 'robotoflex'
  | 'outfit' 
  | 'sora' 
  | 'fira' 
  | 'dmsans'
  | 'sfpro'
  // Legacy aliases
  | 'tech' 
  | 'clean' 
  | 'mono';

export interface CustomThemeColors {
  bgBase: string;          // Canvas background
  bgGradientEnd: string;   // Secondary gradient blend
  surface: string;         // Inside boxes (panels & cards)
  surfaceSolid: string;    // Solid inside box background
  surfaceOverlay: string;  // Overlay box, dropdowns & modals
  border: string;          // Border highlight
  borderSubtle: string;    // Subtle border
  textPrimary: string;     // Text primary
  textSecondary: string;   // Text secondary
  textMuted: string;       // Text muted
  primary: string;         // Brand primary color
  primaryContrast: string; // Text contrast on primary button
  secondary: string;       // Secondary accent
  accent: string;          // Urgent / Warning accent
}

export interface StyleBlenderState {
  glassBlur: number;       // e.g. 16px (0 to 32)
  glassOpacity: number;    // e.g. 0.75 (0.1 to 0.95)
  neoDepth: number;        // e.g. 6px (2 to 14)
  radiusBase: number;      // e.g. 14px (0 to 30)
  threedEnabled: boolean;  // 3D perspective & tilt
  minimalismDensity: 'compact' | 'normal' | 'spacious';
  fontFamily: FontTheme;
}

interface ThemeStore {
  palette: ColorPalette;
  blender: StyleBlenderState;
  customTheme: CustomThemeColors;
  deviceFrame: DeviceFrameMode;
  isBlenderOpen: boolean;

  setPalette: (p: ColorPalette) => void;
  updateBlender: (partial: Partial<StyleBlenderState>) => void;
  updateCustomColors: (partial: Partial<CustomThemeColors>) => void;
  saveAndApplyCustomTheme: (colors: CustomThemeColors) => void;
  resetBlender: () => void;
  resetCustomColors: () => void;
  setDeviceFrame: (frame: DeviceFrameMode) => void;
  setBlenderOpen: (open: boolean) => void;
}

export const defaultBlender: StyleBlenderState = {
  glassBlur: 16,
  glassOpacity: 0.75,
  neoDepth: 6,
  radiusBase: 14,
  threedEnabled: true,
  minimalismDensity: 'normal',
  fontFamily: 'jakarta',
};

export const defaultCustomTheme: CustomThemeColors = {
  bgBase: '#190a0a',
  bgGradientEnd: '#0c0404',
  surface: '#271111',
  surfaceSolid: '#162033',
  surfaceOverlay: '#2e3a1d',
  border: '#074bd5',
  borderSubtle: 'rgba(255, 255, 255, 0.09)',
  textPrimary: '#f8fafc',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  primary: '#07d556',
  primaryContrast: '#042f2e',
  secondary: '#8b5cf6',
  accent: '#61f443',
};

export const CUSTOM_PRESETS: Record<string, { name: string; colors: CustomThemeColors }> = {
  googleSecops: {
    name: 'Google Cloud SecOps',
    colors: {
      bgBase: '#131317',
      bgGradientEnd: '#0e0e12',
      surface: '#1f1f23',
      surfaceSolid: '#2a2a2e',
      surfaceOverlay: '#353439',
      border: '#4d8efe',
      borderSubtle: 'rgba(66, 71, 83, 0.5)',
      textPrimary: '#e4e1e7',
      textSecondary: '#c2c6d5',
      textMuted: '#8c909f',
      primary: '#4d8efe',
      primaryContrast: '#00285c',
      secondary: '#6ddd81',
      accent: '#ffb4ab'
    }
  },
  microsoftSentinel: {
    name: 'Microsoft Sentinel (SIEM/SOAR)',
    colors: {
      bgBase: '#060b19',
      bgGradientEnd: '#0e1321',
      surface: '#0e1321',
      surfaceSolid: '#161b2a',
      surfaceOverlay: '#242a39',
      border: '#00f5d4',
      borderSubtle: 'rgba(58, 74, 70, 0.45)',
      textPrimary: '#dde2f6',
      textSecondary: '#bec5e5',
      textMuted: '#b9cac4',
      primary: '#00f5d4',
      primaryContrast: '#00382f',
      secondary: '#0078d4',
      accent: '#ffb4ab'
    }
  },
  midnightGold: {
    name: 'Midnight Gold & Amber',
    colors: {
      bgBase: '#0c0a06',
      bgGradientEnd: '#060502',
      surface: '#1c170e',
      surfaceSolid: '#241e12',
      surfaceOverlay: '#2d2516',
      border: '#f59e0b',
      borderSubtle: 'rgba(245, 158, 11, 0.15)',
      textPrimary: '#fef3c7',
      textSecondary: '#fde68a',
      textMuted: '#b45309',
      primary: '#f59e0b',
      primaryContrast: '#451a03',
      secondary: '#10b981',
      accent: '#ef4444'
    }
  },
  deepMatrix: {
    name: 'Matrix Cyberpunk Emerald',
    colors: {
      bgBase: '#020b05',
      bgGradientEnd: '#010502',
      surface: '#071b0c',
      surfaceSolid: '#0c2713',
      surfaceOverlay: '#13351a',
      border: '#10b981',
      borderSubtle: 'rgba(16, 185, 129, 0.15)',
      textPrimary: '#ecfdf5',
      textSecondary: '#6ee7b7',
      textMuted: '#047857',
      primary: '#10b981',
      primaryContrast: '#022c22',
      secondary: '#06b6d4',
      accent: '#eab308'
    }
  },
  tokyoNeon: {
    name: 'Tokyo Neon Synthwave',
    colors: {
      bgBase: '#0e0617',
      bgGradientEnd: '#07020d',
      surface: '#1e0c33',
      surfaceSolid: '#2a1147',
      surfaceOverlay: '#3b1664',
      border: '#ec4899',
      borderSubtle: 'rgba(236, 72, 153, 0.18)',
      textPrimary: '#fdf2f8',
      textSecondary: '#f472b6',
      textMuted: '#9d174d',
      primary: '#ec4899',
      primaryContrast: '#ffffff',
      secondary: '#8b5cf6',
      accent: '#06b6d4'
    }
  },
  nordicFrost: {
    name: 'Nordic Deep Glacial',
    colors: {
      bgBase: '#060e18',
      bgGradientEnd: '#02060c',
      surface: '#0d1f33',
      surfaceSolid: '#132c47',
      surfaceOverlay: '#1a3c61',
      border: '#38bdf8',
      borderSubtle: 'rgba(56, 189, 248, 0.16)',
      textPrimary: '#f0f9ff',
      textSecondary: '#7dd3fc',
      textMuted: '#0284c7',
      primary: '#38bdf8',
      primaryContrast: '#082f49',
      secondary: '#34d399',
      accent: '#f59e0b'
    }
  }
};

export const FONT_DEFINITIONS: Record<string, { name: string; body: string; display: string; mono: string; category: string }> = {
  jakarta: {
    name: 'Plus Jakarta Sans (Modern UI)',
    body: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
    display: "'Plus Jakarta Sans', system-ui, sans-serif",
    mono: "'JetBrains Mono', monospace",
    category: 'Google Fonts'
  },
  inter: {
    name: 'Inter (Clean Global Standard)',
    body: "'Inter', system-ui, -apple-system, sans-serif",
    display: "'Inter', system-ui, sans-serif",
    mono: "'JetBrains Mono', monospace",
    category: 'Google Fonts'
  },
  space: {
    name: 'Space Grotesk & Space Mono (Microsoft Sentinel)',
    body: "'Space Grotesk', system-ui, sans-serif",
    display: "'Space Grotesk', system-ui, sans-serif",
    mono: "'Space Mono', 'JetBrains Mono', monospace",
    category: 'Google Fonts'
  },
  anthropic: {
    name: 'Newsreader (Anthropic Editorial Serif)',
    body: "'Newsreader', Georgia, serif",
    display: "'Newsreader', Georgia, serif",
    mono: "'JetBrains Mono', monospace",
    category: 'Anthropic Design'
  },
  jetbrains: {
    name: 'JetBrains Mono (Developer Console)',
    body: "'JetBrains Mono', monospace",
    display: "'JetBrains Mono', monospace",
    mono: "'JetBrains Mono', monospace",
    category: 'Developer'
  },
  roboto: {
    name: 'Roboto (Google Classic)',
    body: "'Roboto', system-ui, sans-serif",
    display: "'Roboto', system-ui, sans-serif",
    mono: "'JetBrains Mono', monospace",
    category: 'Google Fonts'
  },
  robotoflex: {
    name: 'Roboto Flex (Google Cloud SecOps)',
    body: "'Roboto Flex', 'Roboto', system-ui, sans-serif",
    display: "'Roboto Flex', 'Roboto', system-ui, sans-serif",
    mono: "'JetBrains Mono', monospace",
    category: 'Google Fonts'
  },
  outfit: {
    name: 'Outfit (Geometric Luxury)',
    body: "'Outfit', system-ui, sans-serif",
    display: "'Outfit', system-ui, sans-serif",
    mono: "'JetBrains Mono', monospace",
    category: 'Google Fonts'
  },
  sora: {
    name: 'Sora (High-Tech Futuristic)',
    body: "'Sora', system-ui, sans-serif",
    display: "'Sora', system-ui, sans-serif",
    mono: "'JetBrains Mono', monospace",
    category: 'Google Fonts'
  },
  fira: {
    name: 'Fira Code (Code Ligatures)',
    body: "'Fira Code', monospace",
    display: "'Fira Code', monospace",
    mono: "'Fira Code', monospace",
    category: 'Google Fonts'
  },
  dmsans: {
    name: 'DM Sans (Humanist Geometric)',
    body: "'DM Sans', system-ui, sans-serif",
    display: "'DM Sans', system-ui, sans-serif",
    mono: "'JetBrains Mono', monospace",
    category: 'Google Fonts'
  },
  sfpro: {
    name: 'SF Pro (Apple System)',
    body: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Helvetica, Arial, sans-serif",
    display: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif",
    mono: "'SF Mono', 'JetBrains Mono', monospace",
    category: 'Apple Design'
  },
  // Aliases
  tech: {
    name: 'Plus Jakarta Sans',
    body: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
    display: "'Space Grotesk', system-ui, sans-serif",
    mono: "'JetBrains Mono', monospace",
    category: 'Google Fonts'
  },
  clean: {
    name: 'Inter',
    body: "'Inter', system-ui, sans-serif",
    display: "'Inter', system-ui, sans-serif",
    mono: "'JetBrains Mono', monospace",
    category: 'Google Fonts'
  },
  mono: {
    name: 'JetBrains Mono',
    body: "'JetBrains Mono', monospace",
    display: "'JetBrains Mono', monospace",
    mono: "'JetBrains Mono', monospace",
    category: 'Developer'
  }
};

function hexToRgba(hex: string, alpha: number): string {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return hex;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function hexToRgbValues(hex: string): string {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return '18, 24, 38';
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `${r}, ${g}, ${b}`;
}

export function applyThemeVariables(
  palette: ColorPalette, 
  blender: StyleBlenderState, 
  customTheme: CustomThemeColors = defaultCustomTheme
) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const body = document.body;

  // Set Palette attribute across root and body
  root.setAttribute('data-palette', palette);
  if (body) {
    body.setAttribute('data-palette', palette);
  }

  // Apply Blender CSS Variables globally
  root.style.setProperty('--glass-blur', `${blender.glassBlur}px`);
  root.style.setProperty('--glass-opacity', `${blender.glassOpacity}`);
  root.style.setProperty('--neo-depth', `${blender.neoDepth}px`);
  root.style.setProperty('--radius-base', `${blender.radiusBase}px`);
  root.style.setProperty('--threed-perspective', blender.threedEnabled ? '1000px' : 'none');

  // Dynamic Custom Theme Style Tag Injection for 100% Specificity
  let styleEl = document.getElementById('custom-theme-live-css') as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'custom-theme-live-css';
    document.head.appendChild(styleEl);
  }

  if (palette === 'custom') {
    const sRgb = hexToRgbValues(customTheme.surface);
    const s2Rgb = hexToRgbValues(customTheme.surfaceOverlay);
    const surfaceAlpha = hexToRgba(customTheme.surface, blender.glassOpacity);
    const surface2Alpha = hexToRgba(customTheme.surfaceOverlay, blender.glassOpacity * 0.9);
    const surfaceHover = hexToRgba(customTheme.primary, 0.14);
    const overlayAlpha = hexToRgba(customTheme.surfaceOverlay, 0.7);
    const primaryGlow = hexToRgba(customTheme.primary, 0.4);
    const secondaryGlow = hexToRgba(customTheme.secondary, 0.35);
    const textFaint = hexToRgba(customTheme.textMuted, 0.7);

    styleEl.innerHTML = `
      :root[data-palette="custom"], [data-palette="custom"], body[data-palette="custom"], html[data-palette="custom"] {
        --color-bg-base: ${customTheme.bgBase} !important;
        --color-bg-gradient: radial-gradient(circle at 50% 0%, ${customTheme.surface} 0%, ${customTheme.bgBase} 70%) !important;
        --color-surface-rgb: ${sRgb} !important;
        --color-surface-2-rgb: ${s2Rgb} !important;
        --color-surface: ${surfaceAlpha} !important;
        --color-surface-solid: ${customTheme.surfaceSolid} !important;
        --color-surface-2: ${surface2Alpha} !important;
        --color-surface-hover: ${surfaceHover} !important;
        --color-overlay: ${overlayAlpha} !important;
        --color-border: ${customTheme.border} !important;
        --color-border-subtle: ${customTheme.borderSubtle} !important;
        --color-text-primary: ${customTheme.textPrimary} !important;
        --color-text-secondary: ${customTheme.textSecondary} !important;
        --color-text-muted: ${customTheme.textMuted} !important;
        --color-text-faint: ${textFaint} !important;
        --color-primary: ${customTheme.primary} !important;
        --color-primary-contrast: ${customTheme.primaryContrast} !important;
        --color-primary-glow: ${primaryGlow} !important;
        --color-secondary: ${customTheme.secondary} !important;
        --color-secondary-contrast: #ffffff !important;
        --color-secondary-glow: ${secondaryGlow} !important;
        --color-accent: ${customTheme.accent} !important;
        --color-accent-contrast: #ffffff !important;
        --color-text: ${customTheme.textPrimary} !important;
      }
    `;
  } else {
    styleEl.innerHTML = '';
  }

  // Resolve Font Definitions
  const fontConf = FONT_DEFINITIONS[blender.fontFamily] || FONT_DEFINITIONS.jakarta;
  root.style.setProperty('--font-family-body', fontConf.body);
  root.style.setProperty('--font-family-display', fontConf.display);
  root.style.setProperty('--font-family-mono', fontConf.mono);

  if (body) {
    body.style.fontFamily = fontConf.body;
  }
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      palette: 'dark-premium',
      blender: defaultBlender,
      customTheme: defaultCustomTheme,
      deviceFrame: 'desktop',
      isBlenderOpen: false,

      setPalette: (p) => {
        const { blender, customTheme } = get();
        applyThemeVariables(p, blender, customTheme);
        set({ palette: p });
      },

      updateBlender: (partial) => {
        const { palette, blender, customTheme } = get();
        const nextBlender = { ...blender, ...partial };
        applyThemeVariables(palette, nextBlender, customTheme);
        set({ blender: nextBlender });
      },

      updateCustomColors: (partial) => {
        const { palette, blender, customTheme } = get();
        const nextCustom = { ...customTheme, ...partial };
        applyThemeVariables(palette, blender, nextCustom);
        set({ customTheme: nextCustom });
      },

      saveAndApplyCustomTheme: (colors: CustomThemeColors) => {
        const { blender } = get();
        applyThemeVariables('custom', blender, colors);
        set({ customTheme: colors, palette: 'custom' });
      },

      resetBlender: () => {
        const { palette, customTheme } = get();
        applyThemeVariables(palette, defaultBlender, customTheme);
        set({ blender: defaultBlender });
      },

      resetCustomColors: () => {
        const { palette, blender } = get();
        applyThemeVariables(palette, blender, defaultCustomTheme);
        set({ customTheme: defaultCustomTheme });
      },

      setDeviceFrame: (frame) => set({ deviceFrame: frame }),
      setBlenderOpen: (open) => set({ isBlenderOpen: open }),
    }),
    {
      name: 'sentinel-theme-v5',
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyThemeVariables(state.palette, state.blender, state.customTheme || defaultCustomTheme);
        }
      },
    }
  )
);