import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Zap, Lock, Cpu, ArrowRight, Sparkles, CheckCircle2, Sliders, Layers } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { NeoButton } from '../components/ui/NeoButton';
import { ThreeDCard } from '../components/ui/ThreeDCard';
import { ThreatDial3D } from '../components/ui/ThreatDial3D';
import { useThemeStore } from '../store/themeStore';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { palette } = useThemeStore();

  const features = [
    {
      icon: ShieldCheck,
      title: 'Autonomous Threat Intelligence',
      description: 'Continuous AI security engine scanning cloud infrastructure, APIs, and microservices in real-time.',
      style: 'Glassmorphism Panel',
    },
    {
      icon: Zap,
      title: 'Sub-second Zero-Day Detection',
      description: 'Instant vulnerability prioritization using neural predictive risk scoring and graph correlation.',
      style: 'Tactile Neomorphism',
    },
    {
      icon: Cpu,
      title: 'Self-Healing Remediation',
      description: 'Automated patch generation and pull request synthesis for zero-friction devsecops pipelines.',
      style: '3D Spatial Depth',
    },
  ];

  return (
    <div className="space-y-16 py-6">
      {/* ── HERO SECTION WITH 3D SHIELD CANVAS ────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-[500px]">
        <div className="lg:col-span-7 space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-badge border border-[var(--color-primary)] text-[var(--color-primary)] text-xs font-bold animate-pulse-glow">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Gen 2025–2026 UI/UX Architecture</span>
          </div>

          <h1 className="display-heading">
            Autonomous AI <br />
            <span className="gradient-text-primary">Vulnerability Intelligence</span>
          </h1>

          <p className="text-base md:text-lg text-[var(--color-text-secondary)] max-w-2xl leading-relaxed">
            Experience a modern, high-performance security platform blending <strong className="text-[var(--color-text-primary)]">Glassmorphism</strong>, <strong className="text-[var(--color-text-primary)]">Neomorphism</strong>, <strong className="text-[var(--color-text-primary)]">Minimalism</strong>, and <strong className="text-[var(--color-text-primary)]">3D Depth Effects</strong> into one cohesive visual system.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <NeoButton
              variant="primary"
              size="lg"
              icon={<ArrowRight className="w-4 h-4" />}
              onClick={() => navigate('/')}
            >
              Launch Live Dashboard
            </NeoButton>

            <NeoButton
              size="lg"
              icon={<Sliders className="w-4 h-4 text-[var(--color-primary)]" />}
              onClick={() => navigate('/settings')}
            >
              Appearance Settings
            </NeoButton>

            <NeoButton
              size="lg"
              icon={<Layers className="w-4 h-4 text-[var(--color-secondary)]" />}
              onClick={() => navigate('/design-system')}
            >
              Design System Showcase
            </NeoButton>
          </div>

          <div className="flex items-center gap-6 pt-4 text-xs font-semibold text-[var(--color-text-muted)] border-t border-[var(--color-border-subtle)]">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[var(--color-primary)]" /> 5 Switchable Color Palettes
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[var(--color-secondary)]" /> Live Device Viewport Frames
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[var(--color-accent)]" /> 3D Mouse Perspective Tilt
            </span>
          </div>
        </div>

        {/* 3D Interactive Hero Card */}
        <div className="lg:col-span-5 flex justify-center">
          <ThreeDCard depth={40} glowColor="var(--color-primary-glow)" className="w-full max-w-md">
            <div className="space-y-4 text-center py-2">
              <div className="flex items-center justify-between text-xs font-bold border-b border-[var(--color-border-subtle)] pb-3">
                <span className="flex items-center gap-2 text-[var(--color-text-primary)]">
                  <Lock className="w-4 h-4 text-[var(--color-primary)]" /> VulnScan Shield Engine
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[var(--color-primary-glow)] text-[var(--color-primary)]">
                  ACTIVE 24/7
                </span>
              </div>

              {/* 3D Gauge */}
              <ThreatDial3D score={94} label="Real-time Defense Score" size={200} />

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-white/5 border border-[var(--color-border-subtle)] text-left">
                  <span className="text-xs text-[var(--color-text-muted)] block">Analyzed Assets</span>
                  <span className="text-lg font-bold font-mono text-[var(--color-text-primary)]">14,280</span>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-[var(--color-border-subtle)] text-left">
                  <span className="text-xs text-[var(--color-text-muted)] block">Avg Mitigation</span>
                  <span className="text-lg font-bold font-mono text-[var(--color-primary)]">1.2s</span>
                </div>
              </div>
            </div>
          </ThreeDCard>
        </div>
      </section>

      {/* ── HYBRID DESIGN STYLE MATRIX ────────────────────────────── */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold font-display text-[var(--color-text-primary)]">
            Harmonious 4-Style Hybrid Design Engine
          </h2>
          <p className="text-xs md:text-sm text-[var(--color-text-muted)] max-w-xl mx-auto">
            Combining Glassmorphism, Neomorphism, Minimalism, and 3D depth into a unified visual experience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f, idx) => {
            const Icon = f.icon;
            return (
              <GlassCard key={idx} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl neo-surface flex items-center justify-center text-[var(--color-primary)]">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[var(--color-primary-glow)] text-[var(--color-primary)]">
                    {f.style}
                  </span>
                </div>
                <h3 className="text-lg font-bold font-display text-[var(--color-text-primary)]">{f.title}</h3>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{f.description}</p>
              </GlassCard>
            );
          })}
        </div>
      </section>

      {/* ── COLOR SYSTEM DEMO GRID ────────────────────────────────── */}
      <section className="glass-card p-8 space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">
              Active Color Theme: {palette}
            </span>
            <h3 className="text-xl font-bold font-display text-[var(--color-text-primary)] mt-1">
              5 Switchable Palette Architecture
            </h3>
          </div>
          <NeoButton variant="primary" onClick={() => navigate('/settings')}>
            Manage Appearance in Settings
          </NeoButton>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          <div className="p-4 rounded-2xl bg-[var(--color-bg-base)] border border-[var(--color-border)] text-center space-y-2">
            <div className="w-full h-8 rounded-xl bg-[var(--color-primary)] shadow-md" />
            <span className="text-xs font-bold block text-[var(--color-text-primary)]">Primary Accent</span>
          </div>
          <div className="p-4 rounded-2xl bg-[var(--color-bg-base)] border border-[var(--color-border)] text-center space-y-2">
            <div className="w-full h-8 rounded-xl bg-[var(--color-secondary)] shadow-md" />
            <span className="text-xs font-bold block text-[var(--color-text-primary)]">Secondary Hue</span>
          </div>
          <div className="p-4 rounded-2xl bg-[var(--color-bg-base)] border border-[var(--color-border)] text-center space-y-2">
            <div className="w-full h-8 rounded-xl bg-[var(--color-surface-solid)] border border-[var(--color-border)] shadow-md" />
            <span className="text-xs font-bold block text-[var(--color-text-primary)]">Surface Container</span>
          </div>
          <div className="p-4 rounded-2xl bg-[var(--color-bg-base)] border border-[var(--color-border)] text-center space-y-2">
            <div className="w-full h-8 rounded-xl bg-[var(--sev-critical)] shadow-md" />
            <span className="text-xs font-bold block text-[var(--color-text-primary)]">Critical Alert</span>
          </div>
          <div className="p-4 rounded-2xl bg-[var(--color-bg-base)] border border-[var(--color-border)] text-center space-y-2">
            <div className="w-full h-8 rounded-xl bg-[var(--sev-high)] shadow-md" />
            <span className="text-xs font-bold block text-[var(--color-text-primary)]">High Warning</span>
          </div>
        </div>
      </section>

      {/* ── CALL TO ACTION SECTION ────────────────────────────────── */}
      <section className="text-center py-10 space-y-6 glass-modal p-10 rounded-3xl relative overflow-hidden">
        <h2 className="display-heading max-w-2xl mx-auto">
          Ready to Explore the SaaS Dashboard?
        </h2>
        <p className="text-sm text-[var(--color-text-secondary)] max-w-md mx-auto">
          Experience real-time vulnerability scanning, active threat feeds, and interactive design system components.
        </p>
        <div className="flex justify-center gap-4">
          <NeoButton variant="primary" size="lg" onClick={() => navigate('/')}>
            Go to Executive Dashboard
          </NeoButton>
        </div>
      </section>
    </div>
  );
};