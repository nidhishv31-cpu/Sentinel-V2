import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { useUIStore } from '../../store/uiStore';
import { StyleBlenderModal } from '../ui/StyleBlenderModal';
import { DevicePreviewFrame } from '../ui/DevicePreviewFrame';
import { Ambient3DBackground } from '../ui/Ambient3DBackground';

interface ShellProps {
  children: React.ReactNode;
}

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  );

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handler = (e: MediaQueryListEvent | MediaQueryList) => setIsMobile(e.matches);
    handler(mql);
    mql.addEventListener('change', handler as (e: MediaQueryListEvent) => void);
    return () => mql.removeEventListener('change', handler as (e: MediaQueryListEvent) => void);
  }, [breakpoint]);

  return isMobile;
}

export const Shell: React.FC<ShellProps> = ({ children }) => {
  const { sidebarCollapsed } = useUIStore();
  const isMobile = useIsMobile();
  const sidebarW = isMobile ? 0 : sidebarCollapsed ? 64 : 230;

  return (
    <div className="min-h-screen relative overflow-x-hidden selection:bg-[var(--color-primary)] selection:text-white">
      {/* Disable 3D background on mobile for performance */}
      {!isMobile && <Ambient3DBackground />}
      
      <TopBar />
      <Sidebar />
      <StyleBlenderModal />

      <motion.main
        animate={{ marginLeft: sidebarW }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="min-h-screen relative z-10"
        style={{ paddingTop: 'var(--topbar-height, 64px)' }}
      >
        <DevicePreviewFrame>
          <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto min-h-[calc(100vh-64px)]">
            {children}
          </div>
        </DevicePreviewFrame>
      </motion.main>

      {/* Noise grain overlay — hidden on mobile for performance */}
      {!isMobile && (
        <svg className="pointer-events-none fixed inset-0 z-50 h-full w-full opacity-[0.012]" xmlns="http://www.w3.org/2000/svg">
          <filter id="ultraDefNoise">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#ultraDefNoise)" />
        </svg>
      )}
    </div>
  );
};