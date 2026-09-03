import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GitCompare, RefreshCw, AlertTriangle, CheckCircle2, 
  ShieldAlert, ArrowUpRight, ArrowDownRight, Layers, Bug, Calendar, Filter,
  ChevronDown, Sparkles, Plus, Database, ExternalLink, Zap
} from 'lucide-react';
import { API_BASE_URL } from '../config/api';

// Fallback presets if database has no scans yet
const FALLBACK_SCANS = [
  {
    scan_id: 'scan_baseline_01',
    target: 'https://api.sentinel-sec.internal',
    timestamp: '2026-08-20T10:00:00Z',
    count: 3,
    findings: [
      { id: 1, scan_id: 'scan_baseline_01', target: 'https://api.sentinel-sec.internal', finding_hash: 'hash_sqli_01', module_name: 'sqli_scanner', title: 'SQL Injection in User Search Parameter', description: 'Unsanitized user input in search query string leads to blind SQL injection.', severity: 'critical', cvss_score: 9.8, cwe: 'CWE-89' },
      { id: 2, scan_id: 'scan_baseline_01', target: 'https://api.sentinel-sec.internal', finding_hash: 'hash_ssl_01', module_name: 'ssl_auditor', title: 'Weak TLS Cipher Suite (RC4/3DES)', description: 'Target server accepts deprecated RC4 and 3DES cipher suites.', severity: 'medium', cvss_score: 5.9, cwe: 'CWE-326' },
      { id: 3, scan_id: 'scan_baseline_01', target: 'https://api.sentinel-sec.internal', finding_hash: 'hash_xss_fixed_01', module_name: 'xss_scanner', title: 'Reflected Cross-Site Scripting (XSS)', description: 'Search field reflected unescaped HTML script tags.', severity: 'high', cvss_score: 7.2, cwe: 'CWE-79' }
    ]
  },
  {
    scan_id: 'scan_active_02',
    target: 'https://api.sentinel-sec.internal',
    timestamp: '2026-08-24T18:00:00Z',
    count: 3,
    findings: [
      { id: 4, scan_id: 'scan_active_02', target: 'https://api.sentinel-sec.internal', finding_hash: 'hash_sqli_01', module_name: 'sqli_scanner', title: 'SQL Injection in User Search Parameter', description: 'Unsanitized user input in search query string leads to blind SQL injection.', severity: 'critical', cvss_score: 9.8, cwe: 'CWE-89' },
      { id: 5, scan_id: 'scan_active_02', target: 'https://api.sentinel-sec.internal', finding_hash: 'hash_ssl_01', module_name: 'ssl_auditor', title: 'Weak TLS Cipher Suite (RC4/3DES)', description: 'Target server accepts deprecated RC4 and 3DES cipher suites (Escalated).', severity: 'high', cvss_score: 7.5, cwe: 'CWE-326' },
      { id: 6, scan_id: 'scan_active_02', target: 'https://api.sentinel-sec.internal', finding_hash: 'hash_cors_new_01', module_name: 'cors_probe', title: 'Overly Permissive CORS Access-Control-Allow-Origin: *', description: 'API endpoint responds with wildcard origin allow header reflecting credentials.', severity: 'high', cvss_score: 7.5, cwe: 'CWE-942' }
    ]
  }
];

export const BaselineDiff: React.FC = () => {
  const location = useLocation();
  const [scans, setScans] = useState<any[]>(FALLBACK_SCANS);
  const [baselineScanId, setBaselineScanId] = useState<string>('scan_baseline_01');
  const [currentScanId, setCurrentScanId] = useState<string>('scan_active_02');
  const [loading, setLoading] = useState<boolean>(false);
  const [diffResult, setDiffResult] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState<'all' | 'new' | 'resolved' | 'still_open' | 'changed_severity'>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchScanHistory();
  }, []);

  const fetchScanHistory = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/scan/findings`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const scanGroups: Record<string, any> = {};
          data.forEach((f: any) => {
            const sid = f.scan_id || 'default_scan';
            if (!scanGroups[sid]) {
              scanGroups[sid] = {
                scan_id: sid,
                target: f.target,
                timestamp: f.first_seen,
                count: 0,
                findings: []
              };
            }
            scanGroups[sid].count += 1;
            scanGroups[sid].findings.push(f);
          });

          const list = Object.values(scanGroups);
          if (list.length >= 2) {
            setScans(list);
            setBaselineScanId(list[0].scan_id);
            setCurrentScanId(list[1].scan_id);
            runDiff(list[0].findings, list[1].findings);
            return;
          } else if (list.length === 1) {
            setScans(list);
            setBaselineScanId(list[0].scan_id);
            setCurrentScanId(list[0].scan_id);
            runDiff(list[0].findings, list[0].findings);
            return;
          }
        }
      }
    } catch (e) {
      console.warn('Using built-in fallback scans for baseline diffing:', e);
    }
    // Auto-select incoming activeScanId if provided from Zenmap or another module
    if (location.state?.activeScanId) {
      setCurrentScanId(location.state.activeScanId);
    }
    // Default fallback initial diff
    runDiff(FALLBACK_SCANS[0].findings, FALLBACK_SCANS[1].findings);
  };

  const runDiff = async (baseFindings?: any[], curFindings?: any[]) => {
    setLoading(true);
    setError(null);

    let bFindings = baseFindings;
    let cFindings = curFindings;

    if (!bFindings) {
      const bObj = scans.find(s => s.scan_id === baselineScanId);
      bFindings = bObj ? bObj.findings : [];
    }
    if (!cFindings) {
      const cObj = scans.find(s => s.scan_id === currentScanId);
      cFindings = cObj ? cObj.findings : [];
    }

    try {
      const res = await fetch(`${API_BASE_URL}/scan/diff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseline_findings: bFindings || [],
          current_findings: cFindings || []
        })
      });

      if (!res.ok) {
        throw new Error(await res.text() || 'Diff calculation failed');
      }

      const data = await res.json();
      setDiffResult(data);
    } catch (err: any) {
      // Local fallback diff engine calculation for 100% reliability
      computeLocalDiff(bFindings || [], cFindings || []);
    } finally {
      setLoading(false);
    }
  };

  const computeLocalDiff = (baseline: any[], current: any[]) => {
    const baseMap = new Map();
    baseline.forEach(b => baseMap.set(b.finding_hash || b.title, b));

    const curMap = new Map();
    current.forEach(c => curMap.set(c.finding_hash || c.title, c));

    const newFindings: any[] = [];
    const stillOpen: any[] = [];
    const changedSev: any[] = [];
    const resolved: any[] = [];

    current.forEach(c => {
      const key = c.finding_hash || c.title;
      if (!baseMap.has(key)) {
        newFindings.push({ ...c, diff_status: 'new' });
      } else {
        const b = baseMap.get(key);
        if (b.severity !== c.severity) {
          changedSev.push({
            ...c,
            diff_status: 'changed_severity',
            previous_severity: b.severity,
            new_severity: c.severity
          });
        } else {
          stillOpen.push({ ...c, diff_status: 'still_open' });
        }
      }
    });

    baseline.forEach(b => {
      const key = b.finding_hash || b.title;
      if (!curMap.has(key)) {
        resolved.push({ ...b, diff_status: 'resolved' });
      }
    });

    setDiffResult({
      baseline_scan_id: baselineScanId,
      current_scan_id: currentScanId,
      summary: {
        new_count: newFindings.length,
        resolved_count: resolved.length,
        still_open_count: stillOpen.length,
        changed_severity_count: changedSev.length,
        total_delta: newFindings.length - resolved.length
      },
      new: newFindings,
      resolved,
      still_open: stillOpen,
      changed_severity: changedSev
    });
  };

  const getFilteredFindings = () => {
    if (!diffResult) return [];
    if (activeCategory === 'new') return diffResult.new || [];
    if (activeCategory === 'resolved') return diffResult.resolved || [];
    if (activeCategory === 'still_open') return diffResult.still_open || [];
    if (activeCategory === 'changed_severity') return diffResult.changed_severity || [];
    return [
      ...(diffResult.new || []),
      ...(diffResult.changed_severity || []),
      ...(diffResult.resolved || []),
      ...(diffResult.still_open || [])
    ];
  };

  const filtered = getFilteredFindings();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold flex items-center gap-2.5 text-[var(--color-text-primary)]">
            <GitCompare className="text-[var(--color-primary)]" size={24} />
            Baseline Diff & Flakiness Tracking
          </h1>
          <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-1">
            Compare past scan baselines against active assessments to classify New, Resolved, Still-Open, and Changed-Severity findings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => runDiff()}
            disabled={loading}
            className="px-4 py-2 min-h-[44px] sm:min-h-0 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] hover:opacity-90 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md w-full sm:w-auto"
          >
            {loading ? <RefreshCw size={13} className="animate-spin" /> : <Zap size={13} />}
            <span>Re-compute Diff</span>
          </button>
        </div>
      </div>

      {/* Selectors Card */}
      <div className="card p-3 sm:p-4 md:p-6 space-y-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm">
        <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] flex items-center gap-2">
            <Database size={14} className="text-[var(--color-primary)]" />
            Select Scans For Comparison
          </h2>

          <span className="text-xs text-[var(--color-text-muted)] font-mono">
            {scans.length} available scan records
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Baseline Dropdown */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--color-text-secondary)] flex items-center justify-between">
              <span>Baseline Scan (Earlier Assessment):</span>
              <span className="text-xs text-amber-400 font-mono">Reference point</span>
            </label>
            
            <div className="relative">
              <select
                value={baselineScanId}
                onChange={e => {
                  setBaselineScanId(e.target.value);
                  const bObj = scans.find(s => s.scan_id === e.target.value);
                  const cObj = scans.find(s => s.scan_id === currentScanId);
                  if (bObj && cObj) runDiff(bObj.findings, cObj.findings);
                }}
                className="w-full appearance-none px-4 py-3 text-xs font-mono rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)] transition-all cursor-pointer"
                style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
              >
                {scans.map(s => (
                  <option key={s.scan_id} value={s.scan_id} className="bg-zinc-900 text-white py-1">
                    {s.scan_id} · {s.target} ({s.count || (s.findings ? s.findings.length : 0)} findings)
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-[var(--color-text-muted)]">
                <ChevronDown size={14} />
              </div>
            </div>
          </div>

          {/* Current Dropdown */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--color-text-secondary)] flex items-center justify-between">
              <span>Current Scan (Latest Assessment):</span>
              <span className="text-xs text-emerald-400 font-mono">Active evaluation</span>
            </label>
            
            <div className="relative">
              <select
                value={currentScanId}
                onChange={e => {
                  setCurrentScanId(e.target.value);
                  const bObj = scans.find(s => s.scan_id === baselineScanId);
                  const cObj = scans.find(s => s.scan_id === e.target.value);
                  if (bObj && cObj) runDiff(bObj.findings, cObj.findings);
                }}
                className="w-full appearance-none px-4 py-3 text-xs font-mono rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)] transition-all cursor-pointer"
                style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
              >
                {scans.map(s => (
                  <option key={s.scan_id} value={s.scan_id} className="bg-zinc-900 text-white py-1">
                    {s.scan_id} · {s.target} ({s.count || (s.findings ? s.findings.length : 0)} findings)
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-[var(--color-text-muted)]">
                <ChevronDown size={14} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4-Category Summary Badges */}
      {diffResult?.summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div 
            onClick={() => setActiveCategory('new')}
            className={`card p-3 sm:p-4 md:p-5 text-center cursor-pointer transition-all rounded-2xl border ${
              activeCategory === 'new' ? 'border-rose-500 bg-rose-950/20 shadow-lg shadow-rose-950/30' : 'hover:border-rose-500/50 bg-[var(--color-surface)]'
            }`}
          >
            <div className="text-2xl sm:text-3xl font-bold font-mono text-rose-400">
              +{diffResult.summary.new_count}
            </div>
            <div className="text-xs font-bold text-rose-300 uppercase tracking-wider mt-1.5">
              New Vulnerabilities
            </div>
            <div className="text-xs text-[var(--color-text-muted)] mt-0.5">Introduced in current scan</div>
          </div>

          <div 
            onClick={() => setActiveCategory('resolved')}
            className={`card p-3 sm:p-4 md:p-5 text-center cursor-pointer transition-all rounded-2xl border ${
              activeCategory === 'resolved' ? 'border-emerald-500 bg-emerald-950/20 shadow-lg shadow-emerald-950/30' : 'hover:border-emerald-500/50 bg-[var(--color-surface)]'
            }`}
          >
            <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400">
              -{diffResult.summary.resolved_count}
            </div>
            <div className="text-xs font-bold text-emerald-300 uppercase tracking-wider mt-1.5">
              Resolved / Fixed
            </div>
            <div className="text-xs text-[var(--color-text-muted)] mt-0.5">Eliminated from baseline</div>
          </div>

          <div 
            onClick={() => setActiveCategory('still_open')}
            className={`card p-3 sm:p-4 md:p-5 text-center cursor-pointer transition-all rounded-2xl border ${
              activeCategory === 'still_open' ? 'border-amber-500 bg-amber-950/20 shadow-lg shadow-amber-950/30' : 'hover:border-amber-500/50 bg-[var(--color-surface)]'
            }`}
          >
            <div className="text-2xl sm:text-3xl font-bold font-mono text-amber-400">
              {diffResult.summary.still_open_count}
            </div>
            <div className="text-xs font-bold text-amber-300 uppercase tracking-wider mt-1.5">
              Still-Open
            </div>
            <div className="text-xs text-[var(--color-text-muted)] mt-0.5">Persistent across scans</div>
          </div>

          <div 
            onClick={() => setActiveCategory('changed_severity')}
            className={`card p-3 sm:p-4 md:p-5 text-center cursor-pointer transition-all rounded-2xl border ${
              activeCategory === 'changed_severity' ? 'border-purple-500 bg-purple-950/20 shadow-lg shadow-purple-950/30' : 'hover:border-purple-500/50 bg-[var(--color-surface)]'
            }`}
          >
            <div className="text-2xl sm:text-3xl font-bold font-mono text-purple-400">
              {diffResult.summary.changed_severity_count}
            </div>
            <div className="text-xs font-bold text-purple-300 uppercase tracking-wider mt-1.5">
              Changed Severity
            </div>
            <div className="text-xs text-[var(--color-text-muted)] mt-0.5">Risk level altered</div>
          </div>
        </div>
      )}

      {/* Findings List */}
      <div className="card p-3 sm:p-4 md:p-6 space-y-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm">
        <div className="flex flex-wrap items-center justify-between border-b border-[var(--color-border-subtle)] pb-4 gap-3">
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-[var(--color-primary)]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)]">
              Diff Findings ({filtered.length})
            </h3>
          </div>

          <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border-subtle)] text-xs">
            {(['all', 'new', 'resolved', 'still_open', 'changed_severity'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg font-semibold capitalize transition-all cursor-pointer ${
                  activeCategory === cat ? 'bg-[var(--color-primary)] text-black font-bold shadow-sm' : 'text-[var(--color-text-muted)] hover:text-white'
                }`}
              >
                {cat.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-[var(--color-text-muted)]">
            No findings match the selected diff category.
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((f: any, idx: number) => {
              const status = f.diff_status || 'still_open';
              const badgesMap: Record<string, { label: string; bg: string }> = {
                new: { label: 'NEW FINDING', bg: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
                resolved: { label: 'RESOLVED / FIXED', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
                still_open: { label: 'STILL OPEN', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
                changed_severity: { label: `SEVERITY CHANGED (${f.previous_severity} ➔ ${f.new_severity})`, bg: 'bg-purple-500/20 text-purple-300 border-purple-500/30' }
              };
              const statusBadge = badgesMap[status] || { label: 'STATUS', bg: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30' };

              return (
                <div 
                  key={idx} 
                  className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)]/60 space-y-2.5 hover:border-[var(--color-primary)]/40 transition-all"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold border ${statusBadge.bg}`}>
                        {statusBadge.label}
                      </span>
                      <h4 className="text-xs font-bold text-[var(--color-text-primary)]">
                        {f.title || f.name}
                      </h4>
                    </div>

                    <span className="text-xs font-mono text-[var(--color-text-muted)]">
                      {f.target || f.host}
                    </span>
                  </div>

                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    {f.description || 'No description provided.'}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[var(--color-text-muted)] pt-2 border-t border-white/5">
                    <span>Module: <strong className="text-[var(--color-primary)]">{f.module_name || 'scanner'}</strong></span>
                    <span>Severity: <strong className="uppercase text-white">{f.severity}</strong></span>
                    {f.cvss_score && <span>CVSS: <strong className="text-cyan-400">{f.cvss_score}</strong></span>}
                    {f.cwe && <span>CWE: <strong className="text-amber-300">{f.cwe}</strong></span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
export default BaselineDiff;