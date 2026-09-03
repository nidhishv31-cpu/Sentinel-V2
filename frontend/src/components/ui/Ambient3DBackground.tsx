import React from 'react';

export const Ambient3DBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Primary Glowing Ambient Orb */}
      <div
        className="absolute w-[600px] h-[600px] -top-[180px] -left-[180px] rounded-full blur-[140px] opacity-30 pointer-events-none transition-colors duration-700"
        style={{ background: 'var(--color-primary-glow)' }}
      />
      {/* Secondary Accent Orb */}
      <div
        className="absolute w-[650px] h-[650px] top-[35%] -right-[200px] rounded-full blur-[160px] opacity-25 pointer-events-none transition-colors duration-700"
        style={{ background: 'var(--color-secondary-glow)' }}
      />
      {/* Subtle Grid Perspective Overlay */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(var(--color-text-primary) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
    </div>
  );
};

export default Ambient3DBackground;