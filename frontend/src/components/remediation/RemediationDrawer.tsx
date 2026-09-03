import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Zap, GitPullRequest, Copy, Download, Check, 
  ShieldAlert, AlertTriangle, Info, ExternalLink, Code2, 
  Sparkles, RefreshCw, FileCode, CheckCircle2, ChevronRight
} from 'lucide-react';
import { api } from '../../api/client';

interface RemediationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  finding: any;
  repoFullName?: string;
}

export const RemediationDrawer: React.FC<RemediationDrawerProps> = ({
  isOpen,
  onClose,
  finding,
  repoFullName = 'nidhishv31-cpu/Vulnerability-scanner'
}) => {
  const [loading, setLoading] = useState(false);
  const [remediationData, setRemediationData] = useState<any>(null);
  const [copiedDiff, setCopiedDiff] = useState(false);
  const [prLoading, setPrLoading] = useState(false);
  const [prResult, setPrResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'diff' | 'explanation' | 'pr'>('diff');

  useEffect(() => {
    if (isOpen && finding) {
      setLoading(true);
      setPrResult(null);
      api.generateRemediation(finding)
        .then(data => {
          setRemediationData(data);
        })
        .catch(err => {
          console.error('Failed to load remediation:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, finding]);

  const handleCopyDiff = () => {
    if (remediationData?.unified_diff) {
      navigator.clipboard.writeText(remediationData.unified_diff);
      setCopiedDiff(true);
      setTimeout(() => setCopiedDiff(false), 2000);
    }
  };

  const handleDownloadPatch = () => {
    if (remediationData?.unified_diff) {
      const blob = new Blob([remediationData.unified_diff], { type: 'text/x-diff;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `fix_${(finding?.cwe || 'security').toLowerCase()}.patch`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleCreatePR = async () => {
    if (!finding) return;
    setPrLoading(true);
    try {
      const res = await api.createGitHubPR(repoFullName, finding);
      setPrResult(res);
      setActiveTab('pr');
    } catch (err) {
      console.error('Failed to create PR:', err);
    } finally {
      setPrLoading(false);
    }
  };

  if (!isOpen) return null;

  const severityColor = 
    finding?.severity === 'critical' ? 'text-red-400 bg-red-500/10 border-red-500/30' :
    finding?.severity === 'high' ? 'text-orange-400 bg-orange-500/10 border-orange-500/30' :
    finding?.severity === 'medium' ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' :
    'text-blue-400 bg-blue-500/10 border-blue-500/30';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm overflow-hidden">
        {/* Backdrop click to close */}
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          className="relative z-10 w-full max-w-2xl h-full bg-[var(--color-surface-solid)] border-l border-[var(--color-border-subtle)] shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[var(--color-primary-glow)] text-[var(--color-primary)] flex items-center gap-1.5">
                  <Sparkles size={12} /> AI Auto-Remediation
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border ${severityColor}`}>
                  {finding?.severity || 'HIGH'}
                </span>
              </div>
              <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
                {finding?.title || 'Security Remediation Patch'}
              </h2>
              <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-text-muted)]">
                <span>{finding?.cwe || 'CWE-89'}</span>
                <span>•</span>
                <span className="truncate max-w-xs">{finding?.endpoint || finding?.file_path || 'src/app.py'}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-white/10 transition-all cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex border-b border-[var(--color-border-subtle)] px-6 bg-black/20 gap-4">
            <button
              onClick={() => setActiveTab('diff')}
              className={`py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'diff'
                  ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                  : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              <Code2 size={15} /> Side-by-Side Patch Diff
            </button>

            <button
              onClick={() => setActiveTab('explanation')}
              className={`py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'explanation'
                  ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                  : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              <Info size={15} /> Vulnerability Breakdown
            </button>

            {prResult && (
              <button
                onClick={() => setActiveTab('pr')}
                className={`py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'pr'
                    ? 'border-emerald-400 text-emerald-400'
                    : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                <GitPullRequest size={15} /> Pull Request Dispatched
              </button>
            )}
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {loading ? (
              <div className="h-64 flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="w-8 h-8 text-[var(--color-primary)] animate-spin" />
                <p className="text-xs text-[var(--color-text-secondary)] font-medium">
                  Synthesizing AST patch and unified diff...
                </p>
              </div>
            ) : (
              <>
                {/* ── TAB 1: SIDE-BY-SIDE DIFF ── */}
                {activeTab === 'diff' && (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-secondary)] flex items-center justify-between">
                      <span>Target: <strong className="text-[var(--color-text-primary)] font-mono">{remediationData?.file_path}</strong></span>
                      <span className="text-[var(--color-primary)] font-semibold font-mono">AST Verified Patch</span>
                    </div>

                    {/* Side-by-Side Comparison Matrix */}
                    <div className="space-y-3">
                      {/* Vulnerable Original Block */}
                      <div className="rounded-2xl border border-red-500/30 bg-red-950/20 overflow-hidden">
                        <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/20 flex items-center justify-between">
                          <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-red-400" />
                            Vulnerable Code (Before)
                          </span>
                          <span className="text-[10px] font-mono text-red-400/80">CWE Vulnerability</span>
                        </div>
                        <pre className="p-4 text-xs font-mono text-red-200 overflow-x-auto leading-relaxed">
                          <code>{remediationData?.original_code}</code>
                        </pre>
                      </div>

                      {/* Patched Sanitized Block */}
                      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 overflow-hidden">
                        <div className="px-4 py-2 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            Remediated Code (After)
                          </span>
                          <span className="text-[10px] font-mono text-emerald-400/80">Sanitized & Parameterized</span>
                        </div>
                        <pre className="p-4 text-xs font-mono text-emerald-200 overflow-x-auto leading-relaxed">
                          <code>{remediationData?.patched_code}</code>
                        </pre>
                      </div>
                    </div>

                    {/* Unified Diff Preview */}
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[var(--color-text-secondary)]">Unified Patch Representation</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleCopyDiff}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-[var(--color-text-primary)] transition-all cursor-pointer flex items-center gap-1"
                          >
                            {copiedDiff ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                            <span>{copiedDiff ? 'Copied' : 'Copy Diff'}</span>
                          </button>
                          <button
                            onClick={handleDownloadPatch}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-[var(--color-text-primary)] transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Download size={12} />
                            <span>Download .patch</span>
                          </button>
                        </div>
                      </div>

                      <pre className="p-4 rounded-2xl bg-black/40 border border-white/10 text-xs font-mono text-[var(--color-text-muted)] overflow-x-auto">
                        <code>{remediationData?.unified_diff}</code>
                      </pre>
                    </div>
                  </div>
                )}

                {/* ── TAB 2: EXPLANATION & ATTACK VECTOR ── */}
                {activeTab === 'explanation' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border-subtle)] space-y-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">
                        1. Attack Vector Scenario
                      </h3>
                      <p className="text-xs text-[var(--color-text-primary)] leading-relaxed">
                        {remediationData?.explanation?.attack_vector}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border-subtle)] space-y-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                        2. Vulnerability Root Cause
                      </h3>
                      <p className="text-xs text-[var(--color-text-primary)] leading-relaxed">
                        {remediationData?.explanation?.root_cause}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border-subtle)] space-y-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                        3. Defensive Strategy & Best Practices
                      </h3>
                      <p className="text-xs text-[var(--color-text-primary)] leading-relaxed">
                        {remediationData?.explanation?.remediation_strategy}
                      </p>
                    </div>
                  </div>
                )}

                {/* ── TAB 3: PR RESULT ── */}
                {activeTab === 'pr' && prResult && (
                  <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 space-y-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                      <CheckCircle2 size={24} />
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                        Pull Request Created Successfully!
                      </h3>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                        Branch: <code className="text-emerald-400 font-mono">{prResult.branch}</code>
                      </p>
                    </div>

                    <div className="pt-2">
                      <a
                        href={prResult.pr_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 text-black hover:bg-emerald-400 transition-all shadow-md cursor-pointer"
                      >
                        <GitPullRequest size={14} />
                        <span>View Pull Request on GitHub #{prResult.pr_number}</span>
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-5 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] flex items-center justify-between gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white/10 transition-all cursor-pointer"
            >
              Close
            </button>

            <button
              onClick={handleCreatePR}
              disabled={prLoading || loading}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[var(--color-primary)] text-[var(--color-primary-contrast)] hover:opacity-90 transition-all shadow-md cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {prLoading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Dispatching Pull Request...</span>
                </>
              ) : (
                <>
                  <GitPullRequest size={14} />
                  <span>1-Click Create GitHub PR</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
