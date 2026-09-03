import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bug, Filter, Download, ChevronDown, ChevronRight, AlertTriangle, 
  Info, ShieldAlert, Zap, Globe, Clock, Layers, Search, ChevronUp, CheckCircle2, Play,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useScanStore, type ScanRecord, type FindingItem } from '../store/scanStore';
import { Badge } from '../components/ui/Badge';
import { NeoButton } from '../components/ui/NeoButton';
import { SEVERITY_ORDER, type SeverityLevel } from '../config/severity';
import { RemediationDrawer } from '../components/remediation/RemediationDrawer';

const SEVERITY_ICONS = {
  critical: <ShieldAlert size={14} />,
  high: <AlertTriangle size={14} />,
  medium: <AlertTriangle size={14} />,
  low: <Info size={14} />,
  info: <Info size={14} />,
};

// Default fallback scan groups if no custom scans have been run yet
const DEFAULT_INITIAL_SCANS: ScanRecord[] = [
  {
    id: 'demo-scan-1',
    targetId: 't-1',
    targetUrl: 'https://www.sastra.edu',
    engine: 'OWASP ZAP Suite',
    status: 'completed',
    startedAt: 'Today at 4:30 PM',
    completedAt: 'Today at 4:30 PM',
    duration: '2.4s',
    findingsCount: 3,
    maxSeverity: 'medium',
    progress: 100,
    findings: [
      {
        id: 'zap-f1',
        targetUrl: 'https://www.sastra.edu',
        engine: 'OWASP ZAP Suite',
        title: 'Content Security Policy (CSP) Header Not Set',
        severity: 'medium',
        endpoint: 'https://www.sastra.edu/',
        cwe: 'CWE-693',
        cvss: 5.3,
        description: 'Content Security Policy (CSP) is an added layer of security that helps to detect and mitigate certain types of attacks, including Cross-Site Scripting (XSS) and data injection attacks.',
        remediation: 'Ensure that your web server, application server, or CDN sets the Content-Security-Policy response header.',
        evidence: 'Header missing from HTTP response headers',
        discoveredAt: 'Today at 4:30 PM'
      },
      {
        id: 'zap-f2',
        targetUrl: 'https://www.sastra.edu',
        engine: 'OWASP ZAP Suite',
        title: 'Missing Anti-Clickjacking Header (X-Frame-Options)',
        severity: 'medium',
        endpoint: 'https://www.sastra.edu/',
        cwe: 'CWE-1021',
        cvss: 4.8,
        description: 'The response does not protect against Clickjacking attacks via iframe embedding. The X-Frame-Options or frame-ancestors CSP directive is missing.',
        remediation: 'Set X-Frame-Options header to DENY or SAMEORIGIN.',
        evidence: 'X-Frame-Options header missing',
        discoveredAt: 'Today at 4:30 PM'
      },
      {
        id: 'zap-f3',
        targetUrl: 'https://www.sastra.edu',
        engine: 'OWASP ZAP Suite',
        title: 'Server Leaks Version Information via Server Header',
        severity: 'low',
        endpoint: 'https://www.sastra.edu/',
        cwe: 'CWE-200',
        cvss: 3.1,
        description: 'The web server header reveals software daemon version details. This facilitates attacker reconnaissance for version-specific CVEs.',
        remediation: 'Configure the web server to suppress banner version numbers (ServerTokens Prod in Apache, server_tokens off in Nginx).',
        evidence: 'Server: Apache/2.4.52 (Ubuntu)',
        discoveredAt: 'Today at 4:30 PM'
      }
    ]
  },
  {
    id: 'demo-scan-2',
    targetId: 't-2',
    targetUrl: 'https://www.sastra.edu/api',
    engine: 'Nuclei CVE Engine',
    status: 'completed',
    startedAt: 'Today at 4:35 PM',
    completedAt: 'Today at 4:35 PM',
    duration: '3.1s',
    findingsCount: 2,
    maxSeverity: 'high',
    progress: 100,
    findings: [
      {
        id: 'nuclei-f1',
        targetUrl: 'https://www.sastra.edu/api',
        engine: 'Nuclei CVE Engine',
        title: 'Exposed Swagger UI Interactive Documentation',
        severity: 'medium',
        endpoint: 'https://www.sastra.edu/swagger-ui.html',
        cwe: 'CWE-200',
        cvss: 5.3,
        description: 'Interactive API documentation publicly accessible without authentication, exposing internal schema definitions and test harnesses.',
        remediation: 'Restrict public HTTP access to /swagger-ui.html and /openapi.json on production edge gateways.',
        evidence: 'HTTP 200 OK — Title: Swagger UI',
        discoveredAt: 'Today at 4:35 PM'
      },
      {
        id: 'nuclei-f2',
        targetUrl: 'https://www.sastra.edu/api',
        engine: 'Nuclei CVE Engine',
        title: 'Spring Boot Actuator Health Monitoring Disclosure',
        severity: 'low',
        endpoint: 'https://www.sastra.edu/actuator/health',
        cwe: 'CWE-200',
        cvss: 3.7,
        description: 'Public application health monitoring endpoint accessible disclosing internal component metrics.',
        remediation: 'Configure management.endpoints.web.exposure.include to restrict public actuator paths.',
        evidence: 'HTTP 200 OK — {"status":"UP"}',
        discoveredAt: 'Today at 4:35 PM'
      }
    ]
  }
];

export const Findings: React.FC = () => {
  const navigate = useNavigate();
  const { scans } = useScanStore();
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRemediationFinding, setSelectedRemediationFinding] = useState<FindingItem | null>(null);
  const [expandedScanIds, setExpandedScanIds] = useState<Record<string, boolean>>({
    'demo-scan-1': true,
    'demo-scan-2': true
  });

  // Combine store scans that have findings with defaults if store is empty
  const activeScansWithFindings = scans.filter(s => s.findings && s.findings.length > 0);
  const scanList = activeScansWithFindings.length > 0 ? scans : DEFAULT_INITIAL_SCANS;

  const toggleScanAccordion = (scanId: string) => {
    setExpandedScanIds(prev => {
      const current = prev[scanId] !== undefined ? prev[scanId] : true;
      return {
        ...prev,
        [scanId]: !current
      };
    });
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    scanList.forEach(s => { all[s.id] = true; });
    filteredScanList.forEach(s => { all[s.id] = true; });
    setExpandedScanIds(all);
  };

  const collapseAll = () => {
    const all: Record<string, boolean> = {};
    scanList.forEach(s => { all[s.id] = false; });
    filteredScanList.forEach(s => { all[s.id] = false; });
    setExpandedScanIds(all);
  };

  // Filter findings inside each scan
  const filteredScanList = scanList.map(scan => {
    const findings = (scan.findings || []).filter(f => {
      const matchSev = selectedSeverity === 'all' || f.severity === selectedSeverity;
      const matchSearch = !searchQuery.trim() || 
        f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.endpoint && f.endpoint.toLowerCase().includes(searchQuery.toLowerCase())) ||
        scan.targetUrl.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSev && matchSearch;
    });

    return {
      ...scan,
      filteredFindings: findings
    };
  }).filter(scan => scan.filteredFindings.length > 0 || !searchQuery.trim());

  // Aggregate statistics across all scans
  const totalFindings = scanList.reduce((acc, s) => acc + (s.findings?.length || 0), 0);
  const bySeverity = {
    critical: scanList.reduce((acc, s) => acc + (s.findings?.filter(f => f.severity === 'critical').length || 0), 0),
    high: scanList.reduce((acc, s) => acc + (s.findings?.filter(f => f.severity === 'high').length || 0), 0),
    medium: scanList.reduce((acc, s) => acc + (s.findings?.filter(f => f.severity === 'medium').length || 0), 0),
    low: scanList.reduce((acc, s) => acc + (s.findings?.filter(f => f.severity === 'low').length || 0), 0),
    info: scanList.reduce((acc, s) => acc + (s.findings?.filter(f => f.severity === 'info').length || 0), 0),
  };

  const handleExportAllJSON = () => {
    const blob = new Blob([JSON.stringify(scanList, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vulnerability_findings_report_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* ── HEADER ──────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-3 sm:p-4 md:p-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold font-display text-[var(--color-text-primary)]">
              Vulnerability Findings by Scan Session
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[var(--color-primary-glow)] text-[var(--color-primary)]">
              {scanList.length} Scans Indexed
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-1">
            Hierarchical audit view grouping every vulnerability discovery under its originating scan session.
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3">
          <NeoButton size="sm" icon={<Zap className="w-3.5 h-3.5 text-[var(--color-primary)]" />} onClick={() => navigate('/dast')}>
            Launch DAST Engine
          </NeoButton>
          <button 
            onClick={handleExportAllJSON}
            className="flex items-center justify-center gap-1.5 px-3 py-2 min-h-[40px] sm:min-h-0 rounded-xl text-xs font-semibold glass-panel text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
          >
            <Download size={13} /> Export All JSON
          </button>
        </div>
      </div>

      {/* ── SEVERITY SUMMARY CARDS ────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        <div 
          onClick={() => setSelectedSeverity('all')}
          className={`card p-2.5 sm:p-3.5 text-center cursor-pointer transition-all ${
            selectedSeverity === 'all' ? 'border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]' : 'opacity-85'
          }`}
        >
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] block">Total</span>
          <span className="text-xl sm:text-2xl font-extrabold font-mono text-[var(--color-text-primary)]">{totalFindings}</span>
        </div>

        {SEVERITY_ORDER.map(sev => {
          const count = bySeverity[sev] || 0;
          return (
            <div 
              key={sev}
              onClick={() => setSelectedSeverity(sev)}
              className={`card p-2.5 sm:p-3.5 text-center cursor-pointer transition-all ${
                selectedSeverity === sev ? 'border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]' : 'opacity-85'
              }`}
            >
              <span className="text-xs font-bold uppercase tracking-wider block capitalize" style={{ color: `var(--sev-${sev})` }}>
                {sev}
              </span>
              <span className="text-xl sm:text-2xl font-extrabold font-mono" style={{ color: `var(--sev-${sev})` }}>
                {count}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── SEARCH & ACCORDION CONTROLS ───────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 glass-panel p-3">
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search vulnerabilities, endpoints, CVEs..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg outline-none bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button 
            type="button"
            onClick={expandAll}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/20 text-[var(--color-text-primary)] border border-white/10 transition-all cursor-pointer select-none"
          >
            Expand All Scans
          </button>
          <button 
            type="button"
            onClick={collapseAll}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/20 text-[var(--color-text-primary)] border border-white/10 transition-all cursor-pointer select-none"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* ── SCAN GROUPS LIST ──────────────────────────────────────── */}
      {filteredScanList.length === 0 ? (
        <div className="card p-12 text-center space-y-3">
          <Bug size={32} className="mx-auto text-[var(--color-text-muted)]" />
          <p className="text-sm font-bold text-[var(--color-text-primary)]">No findings match your filter criteria</p>
          <p className="text-xs text-[var(--color-text-muted)]">
            Try adjusting the search keyword or severity filter above.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredScanList.map((scan) => {
            const isExpanded = expandedScanIds[scan.id] ?? true;
            const findings = scan.filteredFindings || scan.findings || [];

            return (
              <div 
                key={scan.id}
                className="card overflow-hidden border border-[var(--color-border)] transition-all duration-200"
              >
                {/* ── TOP-LEVEL SCAN HEADER (Clickable Accordion) ── */}
                <div 
                  onClick={() => toggleScanAccordion(scan.id)}
                  className="p-3 sm:p-4 md:p-5 flex flex-wrap items-center justify-between gap-3 sm:gap-4 cursor-pointer bg-[var(--color-surface)] hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                    <div className="p-2 sm:p-2.5 rounded-xl bg-[var(--color-primary-glow)] text-[var(--color-primary)] flex-shrink-0">
                      <Zap size={18} className="sm:w-5 sm:h-5" />
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs sm:text-sm font-mono text-[var(--color-text-primary)] truncate">
                          {scan.targetUrl}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white/5 text-[var(--color-text-secondary)] border border-white/10 font-mono">
                          {scan.engine || 'Autonomous Scanner'}
                        </span>
                        <Badge severity={scan.maxSeverity} size="sm" />
                      </div>
                      
                      <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-xs text-[var(--color-text-muted)] flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock size={11} /> {scan.completedAt || scan.startedAt}
                        </span>
                        {scan.duration && (
                          <span>⏱ {scan.duration}</span>
                        )}
                        <span>· Found: <strong className="text-[var(--color-primary)]">{scan.findingsCount || findings.length} items</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <span className="text-xs font-bold text-[var(--color-primary)] hidden sm:inline">
                      {isExpanded ? 'Hide Details' : 'View Details'}
                    </span>
                    <div className="p-1.5 rounded-lg bg-white/5 text-[var(--color-text-muted)]">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>
                </div>

                {/* ── INNER FINDINGS DETAILS LIST (Inside the Scan) ── */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] p-3 sm:p-4 md:p-5 space-y-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-1 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider pb-1">
                        <span>Discovered Vulnerabilities ({findings.length})</span>
                        <span className="font-mono text-xs truncate">Origin: {scan.targetUrl}</span>
                      </div>

                      {findings.length === 0 ? (
                        <p className="text-xs text-[var(--color-text-muted)] italic py-2">
                          No findings match the current search filter for this scan.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {findings.map((item: FindingItem, fIdx: number) => (
                            <div 
                              key={item.id || fIdx}
                              className="card p-3 sm:p-4 space-y-3 bg-[var(--color-surface)] border border-[var(--color-border-subtle)] hover:border-[var(--color-primary)] transition-all"
                            >
                              {/* Finding Header */}
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs sm:text-sm font-bold text-[var(--color-text-primary)]">
                                    {item.title}
                                  </span>
                                  <Badge severity={item.severity} size="sm" />
                                  {item.cwe && (
                                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/5 text-[var(--color-text-muted)]">
                                      {item.cwe}
                                    </span>
                                  )}
                                </div>

                                {item.cvss && (
                                  <span className="text-xs sm:text-xs font-mono font-bold px-2 py-0.5 rounded bg-red-500/10 text-red-400">
                                    CVSS {item.cvss.toFixed(1)}
                                  </span>
                                )}
                              </div>

                              {/* Description */}
                              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                                {item.description}
                              </p>

                              {/* Impacted Endpoint & Parameter Box */}
                              {item.endpoint && (
                                <div className="p-2.5 sm:p-3 rounded-xl bg-[var(--color-surface-2)] text-xs font-mono space-y-1 overflow-x-auto">
                                  <p className="text-[var(--color-text-muted)] text-xs uppercase font-bold">Vulnerable Target / Endpoint:</p>
                                  <p className="text-[var(--color-primary)] break-all text-xs font-semibold">{item.endpoint}</p>
                                  {item.evidence && (
                                    <p className="text-xs sm:text-xs text-[var(--color-text-secondary)] mt-1.5 pt-1.5 border-t border-white/5 break-all">
                                      <strong className="text-[var(--color-text-muted)]">PoC Evidence:</strong> {item.evidence}
                                    </p>
                                  )}
                                </div>
                              )}

                              {/* Remediation guidance & 1-Click Auto-Fix */}
                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
                                {item.remediation && (
                                  <div className="text-xs flex items-start gap-2 p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 flex-1">
                                    <span className="font-bold shrink-0">Remediation:</span>
                                    <span className="text-[var(--color-text-secondary)]">{item.remediation}</span>
                                  </div>
                                )}
                                <button
                                  onClick={() => setSelectedRemediationFinding(item)}
                                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[var(--color-primary)] text-[var(--color-primary-contrast)] shadow-md hover:opacity-90 flex items-center justify-center gap-1.5 cursor-pointer flex-shrink-0"
                                >
                                  <Sparkles size={13} />
                                  <span>⚡ AI Auto-Fix & PR</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {/* AI Remediation Studio Drawer */}
      <RemediationDrawer
        isOpen={Boolean(selectedRemediationFinding)}
        onClose={() => setSelectedRemediationFinding(null)}
        finding={selectedRemediationFinding}
      />
    </div>
  );
};

export const EmptyPage: React.FC<{ icon: React.ReactNode; title: string; desc: string; action?: React.ReactNode }> = ({ icon, title, desc, action }) => (
  <motion.div className="card p-16 flex flex-col items-center gap-4 text-center"
    initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
    <span className="flex items-center justify-center w-14 h-14 rounded-2xl"
      style={{ background: 'var(--color-surface-2)' }}>
      <span style={{ color: 'var(--color-text-faint)' }}>{icon}</span>
    </span>
    <div>
      <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{title}</p>
      <p className="text-xs mt-1 max-w-xs" style={{ color: 'var(--color-text-muted)' }}>{desc}</p>
    </div>
    {action}
  </motion.div>
);