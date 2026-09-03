import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GitBranch, Plus, CheckCircle2, RefreshCw, X, 
  ExternalLink, Play, Lock, Shield, Settings, Trash2,
  Sparkles, ArrowRight
} from 'lucide-react';
import { api } from '../api/client';

export const Repositories: React.FC = () => {
  const navigate = useNavigate();
  const [repos, setRepos] = useState<any[]>([
    { id: 1, name: 'nidhishv31-cpu/Vulnerability-scanner', branch: 'main', auto_pr: true, last_scan: '10 mins ago', status: 'Protected', findings: 8 },
    { id: 2, name: 'acme-corp/sentinel-api-gateway', branch: 'staging', auto_pr: false, last_scan: '2 hours ago', status: 'Protected', findings: 11 },
    { id: 3, name: 'acme-corp/auth-microservice', branch: 'main', auto_pr: true, last_scan: '1 day ago', status: 'Protected', findings: 4 }
  ]);

  const [modalOpen, setModalOpen] = useState(false);
  const [newRepoName, setNewRepoName] = useState('');
  const [defaultBranch, setDefaultBranch] = useState('main');
  const [autoPr, setAutoPr] = useState(true);
  const [scanningMap, setScanningMap] = useState<Record<number, boolean>>({});

  useEffect(() => {
    api.getRepos().then(res => {
      if (Array.isArray(res) && res.length > 0) {
        const formatted = res.map((r: any) => ({
          id: r.id,
          name: r.github_full_name,
          branch: r.default_branch || 'main',
          auto_pr: Boolean(r.auto_pr_on_fix),
          last_scan: r.created_at || 'Recently',
          status: 'Protected',
          findings: 7
        }));
        setRepos(formatted);
      }
    }).catch(() => null);
  }, []);

  const handleAddRepo = async () => {
    if (!newRepoName) return;
    try {
      const res = await api.connectRepo({
        github_full_name: newRepoName,
        default_branch: defaultBranch,
        auto_pr_on_fix: autoPr
      });
      const newId = res?.repo_id || Date.now();
      const r = {
        id: newId,
        name: newRepoName,
        branch: defaultBranch,
        auto_pr: autoPr,
        last_scan: 'Never',
        status: 'Ready',
        findings: 0
      };
      setRepos([r, ...repos]);
      setNewRepoName('');
      setModalOpen(false);
    } catch {
      setModalOpen(false);
    }
  };

  const handleStartInstantScan = async (repo: any) => {
    setScanningMap(prev => ({ ...prev, [repo.id]: true }));
    try {
      await api.triggerRepoScan(repo.id, {
        target_url: repo.name.startsWith('http') ? repo.name : `https://github.com/${repo.name}`,
        environment: 'staging',
        enable_dast: true,
        enable_cspm: true
      });
    } catch (err) {
      console.error('Trigger scan error:', err);
    }
    
    // Smoothly redirect to DevSecOps pipeline DAG view
    setTimeout(() => {
      navigate('/pipeline');
    }, 400);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-[var(--color-text-primary)] flex items-center gap-2.5">
            <GitBranch className="text-[var(--color-primary)]" size={26} />
            Connected GitHub Repositories
          </h1>
          <p className="text-xs sm:text-sm mt-1 text-[var(--color-text-muted)]">
            Manage repository targets, automated PR commit-back configurations, and webhook triggers
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--color-primary)] text-[var(--color-primary-contrast)] hover:opacity-90 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
        >
          <Plus size={14} /> Connect GitHub Repo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {repos.map(r => {
          const isScanning = Boolean(scanningMap[r.id]);

          return (
            <div key={r.id} className="p-5 rounded-3xl glass-card border border-[var(--color-border-subtle)] space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    isScanning 
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {isScanning ? 'Scanning Codebase...' : r.status}
                  </span>
                  <span className="text-xs text-[var(--color-text-faint)] font-mono">{r.last_scan}</span>
                </div>

                <h3 className="text-sm font-bold text-[var(--color-text-primary)] break-all">{r.name}</h3>
                <p className="text-xs text-[var(--color-text-muted)] font-mono flex items-center gap-1">
                  <GitBranch size={12} /> Branch: {r.branch}
                </p>
              </div>

              <div className="pt-3 border-t border-white/5 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--color-text-muted)]">Auto-PR on Fix:</span>
                  <span className={`font-bold ${r.auto_pr ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {r.auto_pr ? 'Enabled' : 'Disabled'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStartInstantScan(r)}
                    disabled={isScanning}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-[var(--color-primary)] text-[var(--color-primary-contrast)] hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    <Play size={13} className={isScanning ? 'animate-spin' : ''} />
                    {isScanning ? 'Launching Pipeline...' : 'Scan Now'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card w-full max-w-md p-6 rounded-3xl border border-[var(--color-border-subtle)] space-y-4"
              style={{ background: 'var(--color-surface)' }}
            >
              <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border-subtle)]">
                <h3 className="text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                  <GitBranch size={16} className="text-[var(--color-primary)]" />
                  Connect GitHub Repository
                </h3>
                <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg text-[var(--color-text-muted)] hover:text-white">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1 text-[var(--color-text-muted)]">Repository Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. organization/repo-name"
                    value={newRepoName}
                    onChange={e => setNewRepoName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-[var(--color-text-muted)]">Default Branch</label>
                  <input
                    type="text"
                    value={defaultBranch}
                    onChange={e => setDefaultBranch(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] outline-none"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-[var(--color-text-primary)] pt-1">
                  <input
                    type="checkbox"
                    checked={autoPr}
                    onChange={e => setAutoPr(e.target.checked)}
                    className="rounded"
                  />
                  Enable Automated PR on Fix (e.g. Grype CVE dependency patches)
                </label>

                <button
                  onClick={handleAddRepo}
                  className="w-full py-2.5 rounded-xl font-bold bg-[var(--color-primary)] text-[var(--color-primary-contrast)] hover:opacity-90 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <CheckCircle2 size={14} /> Connect & Initialize Repo
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
