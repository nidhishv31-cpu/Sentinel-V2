import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Play, Sparkles, Activity, AlertTriangle } from 'lucide-react';
import { FindingsSummaryCard } from '../components/cards/FindingsSummaryCard';
import { AutomationCard } from '../components/cards/AutomationCard';
import { ReconCard } from '../components/cards/ReconCard';
import { ComplianceCard } from '../components/cards/ComplianceCard';
import { CvssDistributionCard } from '../components/cards/CvssDistributionCard';
import { RecentScansCard } from '../components/cards/RecentScansCard';
import { ChangeFeedCard } from '../components/cards/ChangeFeedCard';
import { ThreatDial3D } from '../components/ui/ThreatDial3D';
import { NeoButton } from '../components/ui/NeoButton';
import { ThreeDCard } from '../components/ui/ThreeDCard';
import { useScanStore } from '../store/scanStore';
import { useThemeStore } from '../store/themeStore';

import { motion, type Variants } from 'framer-motion';

export const Overview: React.FC = () => {
  const navigate = useNavigate();
  const { scans, targets } = useScanStore();
  const { palette } = useThemeStore();

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
  };

  return (
    <motion.div 
      className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* ── HEADER (Full Width) ────────────────────────── */}
      <motion.div className="lg:col-span-3 flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-3 sm:p-4 md:p-6" variants={itemVariants}>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold font-display text-[var(--color-text-primary)]">
              Executive Security Dashboard
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[var(--color-primary-glow)] text-[var(--color-primary)]">
              Theme: {palette}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-1">
            Workspace: <strong className="text-[var(--color-text-primary)]">vulnscan-prod-us-east</strong> · Real-time Autonomous Scanner Active
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3">
          <NeoButton size="sm" icon={<Sparkles className="w-3.5 h-3.5 text-[var(--color-primary)]" />} onClick={() => navigate('/settings')}>
            Appearance Settings
          </NeoButton>
          <NeoButton variant="primary" size="sm" icon={<Play className="w-3.5 h-3.5" />} onClick={() => navigate('/scans')}>
            Launch Scanner
          </NeoButton>
        </div>
      </motion.div>

      {/* ── Threat Dial ────────────────────────── */}
      <motion.div className="lg:col-span-1" variants={itemVariants}>
        <ThreeDCard depth={25} className="h-full flex flex-col justify-center items-center p-4">
          <ThreatDial3D score={88} label="Aggregate Defense Posture" size={170} />
        </ThreeDCard>
      </motion.div>

      {/* ── Quick Stats ────────────────────────── */}
      <motion.div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4" variants={itemVariants}>
        <div className="neo-surface p-3 sm:p-4 md:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Active Targets</span>
            <Globe className="w-5 h-5 text-[var(--color-primary)]" />
          </div>
          <div className="mt-4">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-[var(--color-text-primary)]">
              {targets.length > 0 ? targets.length : 14}
            </span>
            <span className="text-xs text-[var(--color-primary)] block font-semibold mt-1">
              +2 added this week
            </span>
          </div>
        </div>

        <div className="neo-surface p-3 sm:p-4 md:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Open Criticals</span>
            <AlertTriangle className="w-5 h-5 text-[var(--sev-critical)]" />
          </div>
          <div className="mt-4">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-[var(--sev-critical)]">3</span>
            <span className="text-xs text-[var(--color-text-muted)] block font-semibold mt-1">
              CVE-2026-9210 pending patch
            </span>
          </div>
        </div>

        <div className="neo-surface p-3 sm:p-4 md:p-5 flex flex-col justify-between sm:col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Remediation Speed</span>
            <Activity className="w-5 h-5 text-[var(--color-secondary)]" />
          </div>
          <div className="mt-4">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-[var(--color-secondary)]">1.4h</span>
            <span className="text-xs text-[var(--color-secondary)] block font-semibold mt-1">
              98.2% Auto-Synthesized
            </span>
          </div>
        </div>
      </motion.div>

      {/* ── Findings Summary Card (Spans 2 cols) ────────────────────────── */}
      <motion.div className="lg:col-span-2" variants={itemVariants}>
        <FindingsSummaryCard />
      </motion.div>

      {/* ── Automation Card ────────────────────────── */}
      <motion.div className="lg:col-span-1" variants={itemVariants}>
        <AutomationCard />
      </motion.div>

      {/* ── Recon Card ────────────────────────── */}
      <motion.div className="lg:col-span-1" variants={itemVariants}>
        <ReconCard />
      </motion.div>

      {/* ── Compliance Card ────────────────────────── */}
      <motion.div className="lg:col-span-1" variants={itemVariants}>
        <ComplianceCard />
      </motion.div>

      {/* ── CVSS Distribution Card ────────────────────────── */}
      <motion.div className="lg:col-span-1" variants={itemVariants}>
        <CvssDistributionCard />
      </motion.div>

      {/* ── Recent Scans Card (Spans 2 cols) ────────────────────────── */}
      <motion.div className="lg:col-span-2" variants={itemVariants}>
        <RecentScansCard />
      </motion.div>

      {/* ── Change Feed Card ────────────────────────── */}
      <motion.div className="lg:col-span-1" variants={itemVariants}>
        <ChangeFeedCard />
      </motion.div>
    </motion.div>
  );
};