import React from 'react';
import { Monitor, Tablet, Smartphone } from 'lucide-react';
import { useThemeStore, type DeviceFrameMode } from '../../store/themeStore';

interface DevicePreviewFrameProps {
  children: React.ReactNode;
}

export const DevicePreviewFrame: React.FC<DevicePreviewFrameProps> = ({ children }) => {
  const { deviceFrame, setDeviceFrame } = useThemeStore();

  const getWidthClass = (frame: DeviceFrameMode) => {
    switch (frame) {
      case 'tablet':
        return 'max-w-[768px] mx-auto border-x border-y border-[var(--color-border)] rounded-3xl my-6 shadow-2xl overflow-hidden';
      case 'mobile':
        return 'max-w-[390px] mx-auto border-x border-y border-[var(--color-border)] rounded-[40px] my-6 shadow-2xl overflow-hidden border-[8px] border-slate-900/80';
      case 'desktop':
      default:
        return 'w-full';
    }
  };

  return (
    <div className="w-full relative">
      {/* Floating Device Viewport Control Pill */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-1 p-1.5 glass-card !rounded-2xl border border-[var(--color-border)] shadow-2xl backdrop-blur-xl">
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] px-2.5 hidden sm:inline">
          Viewport:
        </span>
        <button
          onClick={() => setDeviceFrame('desktop')}
          className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            deviceFrame === 'desktop'
              ? 'bg-[var(--color-primary)] text-white shadow-md'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
          }`}
          title="Desktop Full Screen Mode"
        >
          <Monitor className="w-4 h-4" />
          <span className="hidden sm:inline">Desktop</span>
        </button>
        <button
          onClick={() => setDeviceFrame('tablet')}
          className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            deviceFrame === 'tablet'
              ? 'bg-[var(--color-primary)] text-white shadow-md'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
          }`}
          title="Tablet Viewport (768px)"
        >
          <Tablet className="w-4 h-4" />
          <span className="hidden sm:inline">Tablet</span>
        </button>
        <button
          onClick={() => setDeviceFrame('mobile')}
          className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            deviceFrame === 'mobile'
              ? 'bg-[var(--color-primary)] text-white shadow-md'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
          }`}
          title="Mobile Viewport (390px iPhone)"
        >
          <Smartphone className="w-4 h-4" />
          <span className="hidden sm:inline">Mobile</span>
        </button>
      </div>

      {/* Frame Container */}
      <div className={`transition-all duration-300 ${getWidthClass(deviceFrame)}`}>
        {deviceFrame === 'mobile' && (
          <div className="w-full bg-slate-900 text-white text-center text-xs py-1 font-bold tracking-widest uppercase flex items-center justify-center gap-2">
            <span className="w-16 h-3 bg-black rounded-full block" />
          </div>
        )}
        {children}
      </div>
    </div>
  );
};