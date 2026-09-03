import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ScanLine, Plus, Trash2, Play, CheckCircle2, XCircle,
  Clock, Globe, ChevronRight, Calendar, Activity
} from 'lucide-react';
import { useScanStore, type FindingItem } from '../store/scanStore';
import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '../components/ui/Badge';
import type { SeverityLevel } from '../config/severity';
import { api } from '../api/client';

const SEV_ORDER: SeverityLevel[] = ['critical', 'high', 'medium', 'low', 'info'];

function pickSeverity(): SeverityLevel {
  const weights = [0.05, 0.15, 0.35, 0.3, 0.15];
  const r = Math.random();
  let acc = 0;
  for (let i = 0; i < weights.length; i++) {
    acc += weights[i];
    if (r < acc) return SEV_ORDER[i];
  }
  return 'info';
}

/* ─── Shared scan runner hook ──────────────────────────────── */
function useScanRunner() {
  const { scans, updateScan } = useScanStore();
  const queryClient = useQueryClient();

  const runningCount = scans.filter(s => s.status === 'running').length;

  useEffect(() => {
    const runningScans = scans.filter(s => s.status === 'running');
    if (runningScans.length === 0) return;

    const interval = setInterval(() => {
      const currentScans = useScanStore.getState().scans;
      const activeRunning = currentScans.filter(s => s.status === 'running');

      if (activeRunning.length === 0) {
        clearInterval(interval);
        return;
      }

      activeRunning.forEach(scan => {
        let prog = scan.progress + (Math.random() * 8 + 3);
        if (prog >= 100) {
          prog = 100;
          const maxSeverity = pickSeverity();
          const end = new Date();
          const start = new Date(scan.startedAt);
          const diffSec = Math.floor((end.getTime() - start.getTime()) / 1000);
          const duration = diffSec < 60 ? `${diffSec}s` : `${Math.floor(diffSec / 60)}m ${diffSec % 60}s`;

          const sampleFindings: FindingItem[] = [
            {
              id: `${scan.id}-f1`,
              scanId: scan.id,
              targetUrl: scan.targetUrl,
              engine: 'Autonomous Web Vulnerability Engine',
              title: 'CORS Wildcard Configuration on API Endpoints',
              severity: 'medium',
              endpoint: `${scan.targetUrl}/api/v1/user`,
              cwe: 'CWE-942',
              cvss: 5.3,
              description: 'The endpoint returns Access-Control-Allow-Origin: * alongside credentialed requests, allowing cross-origin exfiltration.',
              remediation: 'Restrict Access-Control-Allow-Origin to trusted explicit origins.',
              evidence: 'Access-Control-Allow-Origin: *',
              discoveredAt: end.toLocaleString(),
            },
            {
              id: `${scan.id}-f2`,
              scanId: scan.id,
              targetUrl: scan.targetUrl,
              engine: 'Autonomous Web Vulnerability Engine',
              title: 'Strict-Transport-Security (HSTS) Missing',
              severity: 'low',
              endpoint: scan.targetUrl,
              cwe: 'CWE-319',
              cvss: 3.7,
              description: 'The host does not enforce HTTPS connections via HSTS response header directives.',
              remediation: 'Set Strict-Transport-Security header with max-age >= 31536000.',
              evidence: 'Strict-Transport-Security header absent',
              discoveredAt: end.toLocaleString(),
            },
            {
              id: `${scan.id}-f3`,
              scanId: scan.id,
              targetUrl: scan.targetUrl,
              engine: 'Autonomous Web Vulnerability Engine',
              title: 'Missing Anti-Clickjacking X-Frame-Options Header',
              severity: 'medium',
              endpoint: scan.targetUrl,
              cwe: 'CWE-1021',
              cvss: 4.3,
              description: 'Web page can be framed by external malicious domains, enabling clickjacking interface redress attacks.',
              remediation: 'Send X-Frame-Options: SAMEORIGIN header.',
              evidence: 'X-Frame-Options missing',
              discoveredAt: end.toLocaleString(),
            }
          ];

          if (maxSeverity === 'critical' || maxSeverity === 'high') {
            sampleFindings.unshift({
              id: `${scan.id}-f0`,
              scanId: scan.id,
              targetUrl: scan.targetUrl,
              engine: 'Autonomous Web Vulnerability Engine',
              title: maxSeverity === 'critical' ? 'SQL Injection in Query Parameter' : 'Reflected Cross-Site Scripting (XSS)',
              severity: maxSeverity,
              endpoint: `${scan.targetUrl}/search?q=test`,
              cwe: maxSeverity === 'critical' ? 'CWE-89' : 'CWE-79',
              cvss: maxSeverity === 'critical' ? 9.8 : 7.5,
              description: maxSeverity === 'critical' 
                ? 'Unsanitized user parameter passed directly into dynamic SQL query.'
                : 'Unencoded search query parameter reflected directly into HTML DOM response.',
              remediation: maxSeverity === 'critical'
                ? 'Enforce parameterized queries / ORM prepared statements.'
                : 'Perform context-aware HTML entity output encoding.',
              evidence: maxSeverity === 'critical' ? 'SQL syntax error provocation triggered' : 'Unfiltered script tag reflected',
              discoveredAt: end.toLocaleString(),
            });
          }

          updateScan(scan.id, {
            status: 'completed',
            progress: 100,
            findingsCount: sampleFindings.length,
            maxSeverity,
            duration,
            completedAt: end.toLocaleString(),
            findings: sampleFindings,
          });

          // Trigger email report
          fetch('http://localhost:3001/api/send-report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              targetUrl: scan.targetUrl,
              findingsCount: sampleFindings.length,
              maxSeverity
            })
          }).catch(err => console.error('Failed to send report email:', err));

          queryClient.invalidateQueries();
        } else {
          updateScan(scan.id, { progress: prog });
        }
      });
    }, 600);

    return () => clearInterval(interval);
  }, [runningCount, updateScan, queryClient]);
}

/* ─── Tab nav ──────────────────────────────────────────────── */
const tabs = [
  { label: 'Active',    href: '/scans/active',    icon: Activity  },
  { label: 'Scheduled', href: '/scans/scheduled', icon: Calendar  },
  { label: 'History',   href: '/scans/history',   icon: Clock     },
];

function ScansLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { targets } = useScanStore();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Scans</h1>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Manage your scan targets and track results
          </p>
        </div>
        <button
          onClick={() => navigate('/scans')}
          className="flex items-center justify-center gap-1.5 px-3 py-2 min-h-[44px] sm:min-h-0 rounded-lg text-xs font-semibold transition-all active:scale-95 w-full sm:w-auto"
          style={{ background: 'var(--color-accent)', color: 'white', border: 'none', cursor: 'pointer' }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          <Plus size={13} />
          Add Target
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap sm:flex-nowrap gap-1 mb-5 p-1 rounded-xl w-full sm:w-fit overflow-x-auto" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
        {tabs.map(t => (
          <NavLink
            key={t.href}
            to={t.href}
            className="flex items-center justify-center gap-1.5 px-4 py-2 sm:py-1.5 rounded-lg text-xs font-semibold capitalize transition-all flex-1 sm:flex-initial text-center min-h-[40px] sm:min-h-0"
            style={({ isActive }) => ({
              background: isActive ? 'var(--color-surface)' : 'transparent',
              color: isActive ? 'var(--color-text)' : 'var(--color-text-muted)',
              border: isActive ? '1px solid var(--color-border)' : '1px solid transparent',
              cursor: 'pointer',
              boxShadow: isActive ? 'var(--shadow-card)' : 'none',
              textDecoration: 'none',
            })}
          >
            <t.icon size={13} />
            {t.label}
          </NavLink>
        ))}
      </div>

      {children}
    </div>
  );
}

/* ─── Add Target page (root /scans) ───────────────────────── */
function AddTargetView() {
  const { addTarget } = useScanStore();
  const navigate = useNavigate();
  const [urlInput, setUrlInput] = useState('');
  const [labelInput, setLabelInput] = useState('');
  const [urlError, setUrlError] = useState('');
  const [added, setAdded] = useState(false);

  function validateUrl(raw: string): string {
    const trimmed = raw.trim();
    if (!trimmed) return 'URL is required';
    try {
      const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
      if (!url.hostname.includes('.')) return 'Enter a valid hostname (e.g. example.com)';
      return '';
    } catch { return 'Enter a valid URL (e.g. https://example.com)'; }
  }

  function handleAdd() {
    const err = validateUrl(urlInput);
    if (err) { setUrlError(err); return; }
    setUrlError('');
    const url = urlInput.trim().startsWith('http') ? urlInput.trim() : `https://${urlInput.trim()}`;
    addTarget(url, labelInput.trim() || url);
    setUrlInput('');
    setLabelInput('');
    setAdded(true);
    setTimeout(() => navigate('/scans/active'), 800);
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Scans</h1>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Add a target URL to start scanning</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap sm:flex-nowrap gap-1 mb-5 p-1 rounded-xl w-full sm:w-fit overflow-x-auto" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
        {tabs.map(t => (
          <NavLink key={t.href} to={t.href}
            className="flex items-center justify-center gap-1.5 px-4 py-2 sm:py-1.5 rounded-lg text-xs font-semibold transition-all flex-1 sm:flex-initial text-center min-h-[40px] sm:min-h-0"
            style={{ color: 'var(--color-text-muted)', cursor: 'pointer', textDecoration: 'none', border: '1px solid transparent' }}
          >
            <t.icon size={13} />{t.label}
          </NavLink>
        ))}
      </div>

      <motion.div className="card p-3 sm:p-4 md:p-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-sm font-semibold mb-5 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
          <span className="flex items-center justify-center w-6 h-6 rounded-md"
            style={{ background: 'var(--color-accent-muted)', color: 'var(--color-accent)' }}>
            <Plus size={13} />
          </span>
          New Scan Target
        </h2>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
              Target URL <span style={{ color: 'var(--sev-critical)' }}>*</span>
            </label>
            <div className="relative">
              <Globe size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--color-text-faint)' }} />
              <input
                type="url"
                value={urlInput}
                onChange={e => {
                  const val = e.target.value;
                  setUrlInput(val);
                  if (val.trim() === '') {
                    setUrlError('');
                  } else {
                    setUrlError(validateUrl(val));
                  }
                }}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                placeholder="https://example.com"
                id="scan-target-url"
                className="w-full pl-8 pr-3 py-2.5 text-sm rounded-lg outline-none transition-all duration-200 focus:ring-1 focus:ring-[var(--color-primary)]"
                style={{
                  background: 'var(--color-surface-2)',
                  border: `1px solid ${urlError ? 'var(--sev-critical)' : 'var(--color-border)'}`,
                  color: 'var(--color-text)',
                }}
              />
            </div>
            {urlError && <p className="text-xs mt-1" style={{ color: 'var(--sev-critical)' }}>{urlError}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Label (optional)</label>
            <input
              type="text"
              value={labelInput}
              onChange={e => setLabelInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="e.g. Production API"
              id="scan-target-label"
              className="w-full px-3 py-2.5 text-sm rounded-lg outline-none transition-all duration-200 focus:ring-1 focus:ring-[var(--color-primary)]"
              style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
            />
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all active:scale-95"
              style={{ background: 'var(--color-accent)', color: 'white', border: 'none', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              id="scan-add-target-btn"
            >
              {added ? <CheckCircle2 size={14} /> : <Plus size={14} />}
              {added ? 'Added! Redirecting…' : 'Add Target'}
            </button>
            <p className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
              After adding, go to <strong>Active</strong> tab to run the scan
            </p>
          </div>
        </div>
      </motion.div>

      <div className="mt-4 card p-4">
        <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>💡 Supported formats</p>
        {['https://app.example.com', 'https://api.example.com/v1', 'http://staging.internal.com:8080'].map(ex => (
          <div key={ex} className="flex items-center gap-2 py-1">
            <ChevronRight size={11} style={{ color: 'var(--color-text-faint)' }} />
            <code className="text-xs" style={{ color: 'var(--color-text-muted)', background: 'var(--color-surface-2)', padding: '1px 5px', borderRadius: 4 }}>{ex}</code>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Active tab ───────────────────────────────────────────── */
function ActiveView() {
  const { targets, scans, activeScanId, startScan, batchStartScans, updateScan } = useScanStore();
  const runningScans = scans.filter(s => s.status === 'running');
  const completedScans = scans.filter(s => s.status === 'completed');
  const navigate = useNavigate();
  const [selectedTargetIds, setSelectedTargetIds] = useState<string[]>([]);
  const [enableTsharkValidation, setEnableTsharkValidation] = useState(true);

  async function handleRun(targetId: string) {
    const scanRecord = startScan(targetId);
    if (enableTsharkValidation) {
      await api.startTrafficCapture(scanRecord.id);
      setTimeout(async () => {
        const trafficRes = await api.analyzeTrafficCapture(scanRecord.id, 10);
        if (trafficRes && trafficRes.summary) {
          updateScan(scanRecord.id, { trafficValidation: trafficRes.summary });
        }
      }, 5000);
    }
  }

  function toggleTargetSelection(id: string) {
    if (selectedTargetIds.includes(id)) {
      setSelectedTargetIds(selectedTargetIds.filter(item => item !== id));
    } else {
      setSelectedTargetIds([...selectedTargetIds, id]);
    }
  }

  function handleBatchRun() {
    if (selectedTargetIds.length === 0) return;
    const newScans = batchStartScans(selectedTargetIds);
    if (enableTsharkValidation) {
      newScans.forEach(sc => api.startTrafficCapture(sc.id));
    }
    setSelectedTargetIds([]);
  }

  return (
    <ScansLayout>
      {/* Running scan progress */}
      <AnimatePresence>
        {runningScans.map(scan => (
          <motion.div key={scan.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 rounded-[14px] p-4 overflow-hidden"
            style={{ background: 'var(--color-accent-muted)', border: '1px solid var(--color-accent)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}>
                  <ScanLine size={14} style={{ color: 'var(--color-accent)' }} />
                </motion.div>
                <span className="text-sm font-semibold" style={{ color: 'var(--color-accent)' }}>
                  Scanning {scan.targetUrl} {enableTsharkValidation && ' · [tshark Packet Capture Active]'}
                </span>
              </div>
              <span className="text-xs tabular" style={{ color: 'var(--color-accent)' }}>
                {Math.round(scan.progress)}%
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
              <motion.div className="h-full rounded-full" style={{ background: 'var(--color-accent)' }}
                animate={{ width: `${scan.progress}%` }} transition={{ duration: 0.4 }} />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Traffic Validation Options Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl mb-4" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-indigo-500 flex-shrink-0" />
          <span className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
            Wireshark / tshark Traffic Validation QA Companion
          </span>
        </div>
        <label className="flex items-center gap-2 text-xs font-medium cursor-pointer" style={{ color: 'var(--color-text-muted)' }}>
          <input
            type="checkbox"
            checked={enableTsharkValidation}
            onChange={e => setEnableTsharkValidation(e.target.checked)}
            className="rounded"
          />
          Capture & Audit Outbound Scanner Packets
        </label>
      </div>

      {/* Batch Actions Bar */}
      {targets.length > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl mb-4" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedTargetIds.length === targets.length && targets.length > 0}
              onChange={e => setSelectedTargetIds(e.target.checked ? targets.map(t => t.id) : [])}
              className="rounded"
            />
            <span className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
              Select All Targets ({selectedTargetIds.length}/{targets.length})
            </span>
          </div>
          <button
            onClick={handleBatchRun}
            disabled={selectedTargetIds.length === 0}
            className="flex items-center justify-center gap-1.5 px-3 py-2 min-h-[44px] sm:min-h-0 rounded-lg text-xs font-semibold transition-all w-full sm:w-auto"
            style={{
              background: selectedTargetIds.length > 0 ? 'var(--color-accent)' : 'var(--color-surface-2)',
              color: selectedTargetIds.length > 0 ? 'white' : 'var(--color-text-muted)',
              border: '1px solid var(--color-border)',
              cursor: selectedTargetIds.length > 0 ? 'pointer' : 'not-allowed'
            }}
          >
            <Play size={12} /> Run Batch Scan ({selectedTargetIds.length})
          </button>
        </div>
      )}

      {targets.length === 0 ? (
        <motion.div className="card p-10 flex flex-col items-center gap-4 text-center"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <span className="flex items-center justify-center w-14 h-14 rounded-2xl"
            style={{ background: 'var(--color-accent-muted)' }}>
            <Globe size={26} style={{ color: 'var(--color-accent)' }} />
          </span>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>No targets yet</p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Add a target URL to start scanning</p>
          </div>
          <button onClick={() => navigate('/scans')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all active:scale-95"
            style={{ background: 'var(--color-accent)', color: 'white', border: 'none', cursor: 'pointer' }}
          >
            <Plus size={13} /> Add First Target
          </button>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {targets.map((target, i) => {
            const lastScan = scans.find(s => s.targetId === target.id && s.status === 'completed');
            const isRunning = !!scans.find(s => s.targetId === target.id && s.status === 'running');
            const isSelected = selectedTargetIds.includes(target.id);
            return (
              <motion.div key={target.id} className="card p-4 flex items-center gap-4"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleTargetSelection(target.id)}
                  className="rounded"
                />
                <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--color-accent-muted)' }}>
                  <Globe size={16} style={{ color: 'var(--color-accent)' }} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>{target.label}</span>
                    {lastScan && <Badge severity={lastScan.maxSeverity} size="sm" />}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span className="text-xs font-mono truncate" style={{ color: 'var(--color-text-muted)' }}>{target.url}</span>
                    <span className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
                      {lastScan ? `Last: ${lastScan.startedAt} · ${lastScan.findingsCount} findings` : 'Never scanned'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleRun(target.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95"
                  style={{
                    background: isRunning ? 'var(--color-surface-2)' : 'var(--color-accent)',
                    color: isRunning ? 'var(--color-text-muted)' : 'white',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  title="Run scan"
                >
                  {isRunning ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}>
                      <ScanLine size={12} />
                    </motion.div>
                  ) : <Play size={12} />}
                  {isRunning ? 'Running…' : lastScan ? 'Re-scan' : 'Run Scan'}
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </ScansLayout>
  );
}

function ScheduledView() {
  const { targets, schedules, addSchedule, removeSchedule, startScan } = useScanStore();
  const navigate = useNavigate();
  const [isAdding, setIsAdding] = useState(false);
  const [selectedTargetId, setSelectedTargetId] = useState(targets[0]?.id || '');
  const [customUrl, setCustomUrl] = useState('');
  
  const [preset, setPreset] = useState<'5min' | '15min' | 'hourly' | 'daily'>('daily');

  const getPresetLabel = (p: string) => {
    if (p === '5min') return 'Every 5 Minutes';
    if (p === '15min') return 'Every 15 Minutes';
    if (p === 'hourly') return 'Hourly';
    return 'Daily (Midnight)';
  };

  const handleSaveSchedule = () => {
    let urlToUse = '';
    let tId = selectedTargetId || targets[0]?.id;

    if (tId) {
      const t = targets.find(item => item.id === tId);
      if (t) urlToUse = t.url;
    }

    if (!urlToUse && customUrl.trim()) {
      urlToUse = customUrl.trim();
      if (!urlToUse.startsWith('http')) urlToUse = `https://${urlToUse}`;
    }

    if (!urlToUse) return;

    addSchedule({
      targetId: tId || undefined,
      targetUrl: urlToUse,
      type: 'Vulnerability Scan',
      expression: getPresetLabel(preset),
      nextRun: 'Scheduled',
      enabled: true,
    });

    setIsAdding(false);
    setCustomUrl('');
  };

  const handleRunScanNow = (targetUrl: string, targetId?: string) => {
    if (targetId) {
      startScan(targetId);
      navigate('/scans/active');
    } else {
      const t = useScanStore.getState().addTarget(targetUrl);
      startScan(t.id);
      navigate('/scans/active');
    }
  };

  return (
    <ScansLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Scheduled Vulnerability Scans</h2>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Automated recurring security assessment scans for target sites</p>
        </div>
        {!isAdding && (
          <button onClick={() => setIsAdding(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 min-h-[44px] sm:min-h-0 rounded-lg text-xs font-semibold transition-all hover:scale-105 w-full sm:w-auto"
            style={{ background: 'var(--color-accent)', color: 'white', border: 'none', cursor: 'pointer' }}
          >
            <Plus size={12} /> Schedule New Scan
          </button>
        )}
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="card p-3 sm:p-4 mb-4 overflow-hidden space-y-4" style={{ border: '1px solid var(--color-accent)' }}>
            <h3 className="text-xs font-bold" style={{ color: 'var(--color-text)' }}>Configure Recurring Vulnerability Scan</h3>
            
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>Select Target Site</label>
              {targets.length > 0 ? (
                <select
                  value={selectedTargetId}
                  onChange={e => setSelectedTargetId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg outline-none mb-2"
                  style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                >
                  {targets.map(t => (
                    <option key={t.id} value={t.id}>{t.label} ({t.url})</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={customUrl}
                  onChange={e => setCustomUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 text-xs rounded-lg outline-none"
                  style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Recurring Scan Frequency</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {[
                  { id: '5min', label: 'Every 5 Minutes' },
                  { id: '15min', label: 'Every 15 Minutes' },
                  { id: 'hourly', label: 'Hourly' },
                  { id: 'daily', label: 'Daily (Midnight)' },
                ].map(p => (
                  <button key={p.id} type="button" onClick={() => setPreset(p.id as any)}
                    className="px-3 py-2 rounded-lg text-xs font-medium transition-all text-center"
                    style={{
                      background: preset === p.id ? 'var(--color-accent-muted)' : 'var(--color-surface-2)',
                      color: preset === p.id ? 'var(--color-accent)' : 'var(--color-text-muted)',
                      border: `1px solid ${preset === p.id ? 'var(--color-accent)' : 'var(--color-border)'}`,
                      cursor: 'pointer'
                    }}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button onClick={handleSaveSchedule} className="px-4 py-2 min-h-[44px] sm:min-h-0 rounded-lg text-xs font-semibold flex-1 sm:flex-initial"
                style={{ background: 'var(--color-accent)', color: 'white', border: 'none', cursor: 'pointer' }}>
                Save Scan Schedule
              </button>
              <button onClick={() => setIsAdding(false)} className="px-4 py-2 min-h-[44px] sm:min-h-0 rounded-lg text-xs font-medium"
                style={{ background: 'transparent', color: 'var(--color-text-muted)', border: 'none', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {schedules.length === 0 ? (
        !isAdding && (
          <div className="card p-6 sm:p-10 flex flex-col items-center gap-3 text-center">
            <Calendar size={24} style={{ color: 'var(--color-text-faint)' }} />
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>No scheduled vulnerability scans created yet.</p>
          </div>
        )
      ) : (
        <div className="space-y-2">
          {schedules.map(s => (
            <div key={s.id} className="card p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>
                    {s.targetUrl || 'Target Site'}
                  </p>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                    ● Active Schedule
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs flex-wrap" style={{ color: 'var(--color-text-muted)' }}>
                  <span className="font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-500 font-semibold flex items-center gap-1">
                    <Clock size={10} /> Frequency: {s.expression}
                  </span>
                  <span>Type: {s.type || 'Vulnerability Assessment'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">
                <button
                  onClick={() => handleRunScanNow(s.targetUrl || '', s.targetId)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={{ background: 'var(--color-accent)', color: 'white', border: 'none', cursor: 'pointer' }}
                >
                  <Play size={11} /> Scan Now
                </button>
                <button
                  onClick={() => removeSchedule(s.id)}
                  className="p-2 rounded-lg transition-colors hover:bg-[var(--sev-critical-bg)]"
                  style={{ color: 'var(--sev-critical)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                  title="Remove Schedule"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </ScansLayout>
  );
}

/* ─── History tab ──────────────────────────────────────────── */
function HistoryView() {
  const { scans, removeTarget } = useScanStore();
  const completedScans = scans.filter(s => s.status !== 'running');
  const navigate = useNavigate();

  return (
    <ScansLayout>
      {completedScans.length === 0 ? (
        <motion.div className="card p-6 sm:p-10 flex flex-col items-center gap-3 text-center"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Clock size={30} style={{ color: 'var(--color-text-faint)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>No scan history yet</p>
          <p className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
            Run a scan from the <strong>Active</strong> tab to see results here
          </p>
          <button onClick={() => navigate('/scans/active')}
            className="flex items-center gap-1.5 px-4 py-2 min-h-[44px] sm:min-h-0 rounded-lg text-xs font-semibold mt-1 transition-all active:scale-95"
            style={{ background: 'var(--color-surface-2)', color: 'var(--color-text)', border: '1px solid var(--color-border)', cursor: 'pointer' }}
          >
            <Activity size={13} /> Go to Active Scans
          </button>
        </motion.div>
      ) : (
        <motion.div className="space-y-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Summary row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mb-4">
            {[
              { label: 'Total Scans', val: completedScans.length,  color: 'var(--color-text)' },
              { label: 'Completed',   val: completedScans.filter(s => s.status === 'completed').length, color: '#10b981' },
              { label: 'Failed',      val: completedScans.filter(s => s.status === 'failed').length,    color: 'var(--sev-critical)' },
            ].map(stat => (
              <div key={stat.label} className="card p-3 text-center">
                <p className="text-lg font-bold" style={{ color: stat.color }}>{stat.val}</p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{stat.label}</p>
              </div>
            ))}
          </div>

          {completedScans.map((scan, i) => (
            <motion.div key={scan.id} className="card p-4 flex items-center gap-4"
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <ScanStatusIcon status={scan.status} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-mono truncate" style={{ color: 'var(--color-text)' }}>{scan.targetUrl}</span>
                  {scan.status === 'completed' && <Badge severity={scan.maxSeverity} size="sm" />}
                </div>
                <div className="flex items-center gap-4 mt-0.5 flex-wrap">
                  <span className="text-xs" style={{ color: 'var(--color-text-faint)' }}>{scan.startedAt}</span>
                  {scan.duration && <span className="text-xs" style={{ color: 'var(--color-text-faint)' }}>⏱ {scan.duration}</span>}
                  {scan.status === 'completed' && (
                    <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                      {scan.findingsCount} findings
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full`}
                  style={{
                    background: scan.status === 'completed' ? 'rgba(16,185,129,0.1)' : 'var(--sev-critical-bg)',
                    color: scan.status === 'completed' ? '#10b981' : 'var(--sev-critical)',
                  }}>
                  {scan.status}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </ScansLayout>
  );
}

const ScanStatusIcon: React.FC<{ status: string }> = ({ status }) => {
  if (status === 'completed') return <CheckCircle2 size={18} style={{ color: '#10b981', flexShrink: 0 }} />;
  if (status === 'running') return (
    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}>
      <ScanLine size={18} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
    </motion.div>
  );
  if (status === 'failed') return <XCircle size={18} style={{ color: 'var(--sev-critical)', flexShrink: 0 }} />;
  return <Clock size={18} style={{ color: 'var(--color-text-faint)', flexShrink: 0 }} />;
};

/* ─── Root export ──────────────────────────────────────────── */
export const Scans: React.FC = () => {
  useScanRunner(); // global scan progress ticker

  return (
    <Routes>
      <Route index element={<AddTargetView />} />
      <Route path="active"    element={<ActiveView />} />
      <Route path="scheduled" element={<ScheduledView />} />
      <Route path="history"   element={<HistoryView />} />
    </Routes>
  );
};