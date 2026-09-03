import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, Zap, Database, Play, CheckCircle2, AlertTriangle, 
  ExternalLink, Download, ArrowRight, RefreshCw, Layers, Terminal, Sparkles, PlusCircle,
  FileCode, Code2, ShieldCheck, Check, Search
} from 'lucide-react';
import { api } from '../api/client';
import { useScanStore } from '../store/scanStore';
import { Badge } from '../components/ui/Badge';
import { NeoButton } from '../components/ui/NeoButton';
import type { SeverityLevel } from '../config/severity';

type DastEngine = 'nuclei' | 'zap' | 'sqli' | 'fuzzer';

export const DastHub: React.FC = () => {
  const { targets, addCompletedScanWithFindings } = useScanStore();
  const [selectedEngine, setSelectedEngine] = useState<DastEngine>('nuclei');
  const [targetUrl, setTargetUrl] = useState<string>(targets[0]?.url || 'https://www.sastra.edu/');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [zapScanType, setZapScanType] = useState<string>('baseline');
  const [customParams, setCustomParams] = useState<string>('id=1&cat=books');

  // OpenAPI Fuzzer state
  const [openApiSpecInput, setOpenApiSpecInput] = useState<string>('https://petstore.swagger.io/v2/swagger.json');
  const [parsedSpec, setParsedSpec] = useState<any>(null);
  const [isParsingSpec, setIsParsingSpec] = useState<boolean>(false);
  const [fuzzSuiteConfig, setFuzzSuiteConfig] = useState({
    bola: true,
    mass_assignment: true,
    sqli: true,
    auth_bypass: true
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [engineStatus, setEngineStatus] = useState<any>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [exportedCount, setExportedCount] = useState<number>(0);

  useEffect(() => {
    loadEngineStatus();
  }, []);

  const loadEngineStatus = async () => {
    try {
      const st = await api.getScannerEnginesStatus();
      setEngineStatus(st);
    } catch (e) {
      console.error('Failed to load engine status:', e);
    }
  };

  const handleParseSpec = async () => {
    if (!openApiSpecInput) return;
    setIsParsingSpec(true);
    setStatusMessage('Parsing OpenAPI / Swagger specification...');
    try {
      const res = await api.parseOpenAPISpec(openApiSpecInput);
      if (res.success) {
        setParsedSpec(res);
        if (res.base_url) {
          setTargetUrl(res.base_url);
        }
        setStatusMessage('');
      } else {
        setStatusMessage(`Spec Parsing Failed: ${res.error}`);
      }
    } catch (err: any) {
      setStatusMessage(`Failed to parse specification: ${err.message}`);
    } finally {
      setIsParsingSpec(false);
    }
  };

  const handleLaunchScan = async () => {
    if (!targetUrl && selectedEngine !== 'fuzzer') return;
    setIsLoading(true);
    setScanResult(null);
    setStatusMessage(`Running ${selectedEngine.toUpperCase()} security audit against ${targetUrl}...`);

    try {
      let res;
      if (selectedEngine === 'nuclei') {
        const sev = severityFilter === 'all' ? undefined : severityFilter;
        res = await api.runNucleiScan(targetUrl, sev);
      } else if (selectedEngine === 'zap') {
        res = await api.runZapScan(targetUrl, zapScanType);
      } else if (selectedEngine === 'sqli') {
        const paramMap: Record<string, string> = {};
        if (customParams) {
          const pairs = customParams.split('&');
          pairs.forEach(p => {
            const [k, v] = p.split('=');
            if (k) paramMap[k.trim()] = (v || '').trim();
          });
        }
        res = await api.runSqliAudit(targetUrl, Object.keys(paramMap).length > 0 ? paramMap : undefined);
      } else if (selectedEngine === 'fuzzer') {
        // If spec not parsed yet, parse default or provided input first
        let endpointsToFuzz = parsedSpec?.endpoints;
        if (!endpointsToFuzz) {
          const parseRes = await api.parseOpenAPISpec(openApiSpecInput);
          if (parseRes.success) {
            setParsedSpec(parseRes);
            endpointsToFuzz = parseRes.endpoints;
          } else {
            // Fallback endpoints if URL was unreachable
            endpointsToFuzz = [
              { path: '/api/v1/users/{userId}', method: 'GET', parameters: [{ in: 'path', name: 'userId' }], security: [] },
              { path: '/api/v1/users/profile', method: 'POST', parameters: [], security: [] },
              { path: '/api/v1/search', method: 'GET', parameters: [{ in: 'query', name: 'q' }], security: [] }
            ];
          }
        }
        res = await api.executeOpenAPIFuzzer(targetUrl || 'https://api.target.com', endpointsToFuzz, fuzzSuiteConfig);
      }
      setScanResult(res);
      setStatusMessage('');
    } catch (err: any) {
      setStatusMessage(`Scan failed or target unreachable: ${err.message || 'Error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportToFindings = () => {
    if (!scanResult) return;
    const items: any[] = [];
    let engineLabel = 'DAST Security Scanner';

    if (selectedEngine === 'nuclei' && scanResult.findings) {
      engineLabel = 'Nuclei CVE Engine';
      scanResult.findings.forEach((f: any) => {
        items.push({
          title: f.name || 'Security Finding',
          severity: (f.severity || 'info').toLowerCase(),
          endpoint: f.matched_at || targetUrl,
          cwe: f.cwe?.join(', ') || 'CWE-200',
          cvss: f.cvss_score || 5.0,
          description: f.description || 'Vulnerability detected by Nuclei template.',
          remediation: f.remediation || 'Review endpoint configuration.',
          evidence: f.extracted_results?.join(' | ') || '',
          engine: 'Nuclei CVE Engine',
        });
      });
    } else if (selectedEngine === 'zap' && scanResult.alerts) {
      engineLabel = 'OWASP ZAP Suite';
      const sevMap: Record<string, any> = {
        High: 'high',
        Medium: 'medium',
        Low: 'low',
        Informational: 'info'
      };
      scanResult.alerts.forEach((a: any) => {
        items.push({
          title: a.alert || 'OWASP Finding',
          severity: sevMap[a.risk] || 'medium',
          endpoint: a.url || targetUrl,
          cwe: a.cweid ? `CWE-${a.cweid}` : 'CWE-693',
          description: a.description || 'OWASP Top 10 security policy finding.',
          remediation: a.solution || 'Configure security headers.',
          evidence: `Parameter: ${a.param || 'N/A'} | Evidence: ${a.evidence || 'Header check'}`,
          engine: 'OWASP ZAP Suite',
        });
      });
    } else if (selectedEngine === 'sqli' && scanResult.findings) {
      engineLabel = 'SQLi Parameter Auditor';
      scanResult.findings.forEach((f: any) => {
        items.push({
          title: f.title || 'SQL Injection Vulnerability',
          severity: 'critical',
          endpoint: f.endpoint || targetUrl,
          cwe: 'CWE-89',
          cvss: 8.5,
          description: f.description || 'SQL Injection via unsanitized parameter.',
          remediation: 'Use parameterized queries.',
          evidence: `Payload: ${f.payload || 'N/A'}`,
          engine: 'SQLi Parameter Auditor',
        });
      });
    } else if (selectedEngine === 'fuzzer' && scanResult.findings) {
      engineLabel = 'OpenAPI Security Fuzzer';
      scanResult.findings.forEach((f: any) => {
        items.push({
          title: f.title,
          severity: f.severity,
          endpoint: f.endpoint,
          cwe: f.cwe,
          cvss: f.cvss,
          description: f.description,
          remediation: f.remediation,
          evidence: f.evidence,
          engine: 'OpenAPI Security Fuzzer'
        });
      });
    }

    if (items.length === 0) return;

    addCompletedScanWithFindings({
      id: `scan-dast-${Date.now()}`,
      targetUrl: targetUrl,
      engine: engineLabel,
      startedAt: new Date().toLocaleDateString(),
      completedAt: new Date().toLocaleTimeString(),
      duration: `${scanResult.duration_seconds || '1.8'}s`,
      status: 'completed',
      maxSeverity: (scanResult.summary?.critical > 0 ? 'critical' : scanResult.summary?.high > 0 ? 'high' : 'medium') as SeverityLevel,
      findingsCount: items.length,
    }, items);

    setExportedCount(items.length);
    setTimeout(() => setExportedCount(0), 4000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* ── HEADER ──────────────────────────────────────────────── */}
      <div className="glass-card p-3 sm:p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold font-display text-[var(--color-text-primary)]">
              Dynamic Application Security Testing (DAST) Hub
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[var(--color-primary-glow)] text-[var(--color-primary)]">
              Enterprise Engine
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-1">
            Black-box and Gray-box security testing suite: Nuclei templates, OWASP ZAP, SQLi fuzzers, and OpenAPI spec analyzers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <NeoButton size="sm" icon={<RefreshCw size={13} />} onClick={loadEngineStatus}>
            Refresh Engines
          </NeoButton>
        </div>
      </div>

      {/* ── ENGINE SELECTOR TABS ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            id: 'nuclei',
            name: 'Nuclei CVE Engine',
            icon: ShieldAlert,
            desc: 'Template-powered CVE & misconfiguration scanner',
            status: engineStatus?.nuclei?.mode || 'Built-in Engine',
          },
          {
            id: 'zap',
            name: 'OWASP ZAP Suite',
            icon: Zap,
            desc: 'Automated DAST & OWASP Top 10 penetration tester',
            status: engineStatus?.zap?.mode || 'Built-in OWASP Engine',
          },
          {
            id: 'sqli',
            name: 'SQLi Auditor',
            icon: Database,
            desc: 'Parameter-level database vulnerability analyzer',
            status: engineStatus?.sqli?.mode || 'Built-in Parameter Auditor',
          },
          {
            id: 'fuzzer',
            name: 'OpenAPI Fuzzer',
            icon: FileCode,
            desc: 'BOLA/IDOR, Mass Assignment & Spec security fuzzer',
            status: 'Built-in API Fuzzer',
          }
        ].map((eng) => (
          <div 
            key={eng.id}
            onClick={() => setSelectedEngine(eng.id as DastEngine)}
            className={`card p-4 cursor-pointer transition-all duration-200 border ${
              selectedEngine === eng.id 
                ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary-glow)] bg-[var(--color-surface)]' 
                : 'border-[var(--color-border-subtle)] hover:border-[var(--color-border)] opacity-85 hover:opacity-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[var(--color-primary-glow)] text-[var(--color-primary)]">
                  <eng.icon size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-[var(--color-text-primary)]">{eng.name}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{eng.desc}</p>
                </div>
              </div>
              <span className={`w-2.5 h-2.5 rounded-full ${selectedEngine === eng.id ? 'bg-[var(--color-primary)] animate-pulse' : 'bg-zinc-600'}`} />
            </div>
            <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
              <span className="text-[var(--color-text-muted)]">Active Runtime:</span>
              <span className="font-mono font-semibold text-[var(--color-primary)]">{eng.status}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── SCAN CONTROLS PANEL ───────────────────────────────────── */}
      <div className="glass-card p-3 sm:p-4 md:p-6 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-secondary)] flex items-center gap-2">
          <Terminal size={15} className="text-[var(--color-primary)]" />
          Configure {selectedEngine === 'fuzzer' ? 'OpenAPI / Swagger Security Fuzzer' : `${selectedEngine.toUpperCase()} Security Scan`}
        </h2>

        {selectedEngine === 'fuzzer' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-9 space-y-1.5">
                <label className="block text-xs font-semibold text-[var(--color-text-muted)]">
                  OpenAPI / Swagger Spec (URL or JSON endpoint)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={openApiSpecInput}
                    onChange={(e) => setOpenApiSpecInput(e.target.value)}
                    placeholder="https://api.example.com/openapi.json or paste raw schema"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl outline-none bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all font-mono"
                  />
                  <button
                    onClick={handleParseSpec}
                    disabled={isParsingSpec}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-[var(--color-text-primary)] flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
                  >
                    <Search size={13} />
                    <span>{isParsingSpec ? 'Parsing...' : 'Parse Routes'}</span>
                  </button>
                </div>

                {/* Quick Presets for 1-Click Testing */}
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  <span className="text-[11px] text-[var(--color-text-muted)] font-semibold">Quick API Specs:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenApiSpecInput('https://petstore.swagger.io/v2/swagger.json');
                      setTargetUrl('https://petstore.swagger.io/v2');
                      api.parseOpenAPISpec('https://petstore.swagger.io/v2/swagger.json').then(res => { if (res.success) setParsedSpec(res); });
                    }}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white/5 hover:bg-white/10 text-[var(--color-primary)] border border-white/10 transition-all cursor-pointer"
                  >
                    🐾 Petstore Swagger 2.0
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const authSpec = {
                        openapi: '3.0.0',
                        info: { title: 'Enterprise Auth & Admin API', version: '2.1.0' },
                        servers: [{ url: 'https://api.sentinel-auth.internal/v1' }],
                        paths: {
                          '/users/{userId}': {
                            get: { summary: 'Get User Profile', parameters: [{ in: 'path', name: 'userId' }] },
                            post: { summary: 'Update User Profile', parameters: [] }
                          },
                          '/admin/roles': {
                            get: { summary: 'List Admin Roles', parameters: [] },
                            post: { summary: 'Grant Admin Privileges', parameters: [] }
                          },
                          '/query': {
                            get: { summary: 'Search Directory', parameters: [{ in: 'query', name: 'filter' }] }
                          }
                        }
                      };
                      setOpenApiSpecInput(JSON.stringify(authSpec, null, 2));
                      setTargetUrl('https://api.sentinel-auth.internal/v1');
                      api.parseOpenAPISpec(authSpec).then(res => { if (res.success) setParsedSpec(res); });
                    }}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white/5 hover:bg-white/10 text-emerald-400 border border-white/10 transition-all cursor-pointer"
                  >
                    🛡️ Sentinel Auth & Admin API
                  </button>
                </div>
              </div>

              <div className="md:col-span-3 space-y-1.5">
                <label className="block text-xs font-semibold text-[var(--color-text-muted)]">
                  Target API Host
                </label>
                <input
                  type="text"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="https://api.example.com"
                  className="w-full px-3 py-2.5 text-xs rounded-xl outline-none bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text-primary)] font-mono"
                />
              </div>
            </div>

            {/* Parsed Endpoint Preview Card */}
            {parsedSpec && (
              <div className="p-4 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border-subtle)] space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[var(--color-text-primary)]">
                    API: <strong className="text-[var(--color-primary)]">{parsedSpec.title}</strong> (v{parsedSpec.version})
                  </span>
                  <span className="font-mono text-[var(--color-text-muted)]">{parsedSpec.endpoints_count} Endpoints Discovered</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {parsedSpec.endpoints?.slice(0, 4).map((ep: any, idx: number) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-black/30 border border-white/5 text-xs space-y-1">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        ep.method === 'GET' ? 'bg-blue-500/20 text-blue-300' :
                        ep.method === 'POST' ? 'bg-emerald-500/20 text-emerald-300' :
                        ep.method === 'PUT' ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {ep.method}
                      </span>
                      <p className="font-mono text-[11px] text-[var(--color-text-primary)] truncate">{ep.path}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fuzzing Suite Selection Checkboxes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {[
                { key: 'bola', label: 'BOLA / IDOR Probes' },
                { key: 'mass_assignment', label: 'Mass Assignment Tests' },
                { key: 'sqli', label: 'SQLi Parameter Fuzzing' },
                { key: 'auth_bypass', label: 'Missing Auth Validation' }
              ].map(opt => (
                <label key={opt.key} className="flex items-center gap-2 p-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border-subtle)] cursor-pointer text-xs font-semibold text-[var(--color-text-primary)]">
                  <input
                    type="checkbox"
                    checked={(fuzzSuiteConfig as any)[opt.key]}
                    onChange={(e) => setFuzzSuiteConfig({ ...fuzzSuiteConfig, [opt.key]: e.target.checked })}
                    className="rounded accent-[var(--color-primary)]"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-8 space-y-1.5">
              <label className="block text-xs font-semibold text-[var(--color-text-muted)]">
                Target URL
              </label>
              <input
                type="url"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl outline-none bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all font-mono"
              />
            </div>

            {selectedEngine === 'nuclei' && (
              <div className="md:col-span-4 space-y-1.5">
                <label className="block text-xs font-semibold text-[var(--color-text-muted)]">
                  Severity Filter
                </label>
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl outline-none bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text-primary)]"
                >
                  <option value="all">All Severities (Critical to Info)</option>
                  <option value="critical,high">Critical & High Only</option>
                  <option value="critical">Critical Only</option>
                  <option value="medium,low">Medium & Low Only</option>
                </select>
              </div>
            )}

            {selectedEngine === 'zap' && (
              <div className="md:col-span-4 space-y-1.5">
                <label className="block text-xs font-semibold text-[var(--color-text-muted)]">
                  Audit Profile
                </label>
                <select
                  value={zapScanType}
                  onChange={(e) => setZapScanType(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl outline-none bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text-primary)]"
                >
                  <option value="baseline">Passive Baseline (Fast, Safe)</option>
                  <option value="full">Full Active Attack (Deep)</option>
                  <option value="api">API OpenAPI / GraphQL Mode</option>
                </select>
              </div>
            )}

            {selectedEngine === 'sqli' && (
              <div className="md:col-span-4 space-y-1.5">
                <label className="block text-xs font-semibold text-[var(--color-text-muted)]">
                  Target Parameters
                </label>
                <input
                  type="text"
                  value={customParams}
                  onChange={(e) => setCustomParams(e.target.value)}
                  placeholder="id=1&cat=books"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl outline-none bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text-primary)] font-mono"
                />
              </div>
            )}
          </div>
        )}

        <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-[var(--color-text-muted)] flex items-center gap-1.5">
            {statusMessage ? (
              <span className="text-[var(--color-primary)] font-mono">{statusMessage}</span>
            ) : (
              <span>Ready to launch autonomous {selectedEngine.toUpperCase()} assessment.</span>
            )}
          </div>

          <NeoButton
            size="md"
            variant="primary"
            icon={<Play size={14} className={isLoading ? 'animate-spin' : ''} />}
            onClick={handleLaunchScan}
            disabled={isLoading}
          >
            {isLoading ? `Scanning with ${selectedEngine.toUpperCase()}...` : `Execute ${selectedEngine === 'fuzzer' ? 'OpenAPI Fuzzing' : `${selectedEngine.toUpperCase()} Scan`}`}
          </NeoButton>
        </div>
      </div>

      {/* ── SCAN RESULTS SECTION ──────────────────────────────────── */}
      {scanResult && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-3 sm:p-4 md:p-6 space-y-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--color-border-subtle)]">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-[var(--color-primary)] font-bold">
                {selectedEngine.toUpperCase()} Scan Results
              </span>
              <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                Target: {targetUrl}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportToFindings}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[var(--color-primary)] text-[var(--color-primary-contrast)] hover:opacity-90 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                {exportedCount > 0 ? (
                  <>
                    <Check size={13} />
                    <span>Exported {exportedCount} Findings!</span>
                  </>
                ) : (
                  <>
                    <PlusCircle size={13} />
                    <span>Export to Findings Triage</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results Findings Cards */}
          <div className="space-y-3">
            {(scanResult.findings || scanResult.alerts || []).map((f: any, idx: number) => (
              <div 
                key={idx}
                className="p-4 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border-subtle)] space-y-2 hover:border-[var(--color-primary)] transition-all"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[var(--color-text-primary)]">
                      {f.title || f.name || f.alert || 'Security Finding'}
                    </span>
                    <Badge severity={f.severity || f.risk || 'medium'} size="sm" />
                    {f.cwe && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-[var(--color-text-muted)]">
                        {f.cwe}
                      </span>
                    )}
                  </div>
                  {f.cvss && (
                    <span className="text-xs font-mono font-bold text-red-400">
                      CVSS {f.cvss}
                    </span>
                  )}
                </div>

                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  {f.description || f.short_description || 'Security risk detected on endpoint.'}
                </p>

                {f.endpoint && (
                  <div className="p-2.5 rounded-xl bg-black/40 font-mono text-xs text-[var(--color-primary)] truncate">
                    {f.endpoint}
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};
