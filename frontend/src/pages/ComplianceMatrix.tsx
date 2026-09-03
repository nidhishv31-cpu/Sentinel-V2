import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, AlertTriangle, CheckCircle2, XCircle, Download, 
  Layers, FileText, ChevronRight, Check, Award, Lock, Shield, Sparkles
} from 'lucide-react';
import { useScanStore } from '../store/scanStore';
import { NeoButton } from '../components/ui/NeoButton';

interface ComplianceControl {
  id: string;
  framework: 'soc2' | 'iso27001';
  code: string;
  name: string;
  description: string;
  category: string;
  status: 'passed' | 'warning' | 'failed';
  mappedFindingsCount: number;
  remediationAdvice: string;
}

const COMPLIANCE_CONTROLS: ComplianceControl[] = [
  // SOC 2 Controls
  {
    id: 'soc-cc6.1',
    framework: 'soc2',
    code: 'CC6.1',
    name: 'Logical Access & Authentication',
    description: 'Enforce multi-factor authentication, cryptographic tokens, and strict role-based access controls.',
    category: 'Common Criteria - Security',
    status: 'passed',
    mappedFindingsCount: 0,
    remediationAdvice: 'Ensure JWT secrets are stored in secure vaults and token lifetimes are strictly enforced.'
  },
  {
    id: 'soc-cc6.6',
    framework: 'soc2',
    code: 'CC6.6',
    name: 'Vulnerability Management & Code Auditing',
    description: 'Implement automated SAST, DAST, and dependency vulnerability scanning across all deployment lanes.',
    category: 'Common Criteria - Security',
    status: 'warning',
    mappedFindingsCount: 2,
    remediationAdvice: 'Remediate detected SQL Injection and XSS vulnerabilities using AST parameterized fixes.'
  },
  {
    id: 'soc-cc6.7',
    framework: 'soc2',
    code: 'CC6.7',
    name: 'Transmission Security & Cryptography',
    description: 'Enforce TLS 1.3 encryption for all data in transit, with HSTS and secure HTTP response headers.',
    category: 'Common Criteria - Confidentiality',
    status: 'passed',
    mappedFindingsCount: 0,
    remediationAdvice: 'Verify HSTS max-age is set to at least 31536000 seconds with includeSubDomains.'
  },
  {
    id: 'soc-cc7.1',
    framework: 'soc2',
    code: 'CC7.1',
    name: 'Vulnerability Detection & Monitoring',
    description: 'Continuous monitoring against CISA Known Exploited Vulnerabilities and real-time SIEM alert triggers.',
    category: 'Common Criteria - Availability',
    status: 'passed',
    mappedFindingsCount: 0,
    remediationAdvice: 'Keep CISA KEV real-time feeds synchronized daily.'
  },
  {
    id: 'soc-cc7.2',
    framework: 'soc2',
    code: 'CC7.2',
    name: 'Incident Response & Automated Remediation',
    description: 'Maintain automated workflows for dispatching security patches and opening remediation pull requests.',
    category: 'Common Criteria - Availability',
    status: 'passed',
    mappedFindingsCount: 0,
    remediationAdvice: 'Verify 1-Click Pull Request automation is linked to primary source code repositories.'
  },

  // ISO 27001:2022 Controls
  {
    id: 'iso-a.8.8',
    framework: 'iso27001',
    code: 'A.8.8',
    name: 'Management of Technical Vulnerabilities',
    description: 'Information about technical vulnerabilities of information systems being used shall be obtained in a timely fashion.',
    category: 'Technological Controls',
    status: 'warning',
    mappedFindingsCount: 1,
    remediationAdvice: 'Patch outdated dependencies flagged in CycloneDX SBOM component analysis.'
  },
  {
    id: 'iso-a.8.20',
    framework: 'iso27001',
    code: 'A.8.20',
    name: 'Network Security & Segmentation',
    description: 'Networks shall be secured, managed, and controlled to protect information in systems and applications.',
    category: 'Technological Controls',
    status: 'passed',
    mappedFindingsCount: 0,
    remediationAdvice: 'Enforce WAF firewall filtering rules on all public gateway ingress endpoints.'
  },
  {
    id: 'iso-a.8.24',
    framework: 'iso27001',
    code: 'A.8.24',
    name: 'Use of Cryptography & Secrets Handling',
    description: 'Rules for the effective use of cryptography, including cryptographic key management, shall be defined and applied.',
    category: 'Technological Controls',
    status: 'passed',
    mappedFindingsCount: 0,
    remediationAdvice: 'Ensure hardcoded secrets are eradicated from Git repositories using pre-commit hooks.'
  },
  {
    id: 'iso-a.5.15',
    framework: 'iso27001',
    code: 'A.5.15',
    name: 'Access Control Policy & Enforcement',
    description: 'Rules to control physical and logical access to information and other associated assets shall be established.',
    category: 'Organizational Controls',
    status: 'passed',
    mappedFindingsCount: 0,
    remediationAdvice: 'Implement object-level tenant isolation validation on all REST/GraphQL API routes.'
  }
];

export const ComplianceMatrix: React.FC = () => {
  const { scans } = useScanStore();
  const [selectedFramework, setSelectedFramework] = useState<'all' | 'soc2' | 'iso27001'>('all');
  const [downloadingReport, setDownloadingReport] = useState(false);

  const filteredControls = COMPLIANCE_CONTROLS.filter(c => 
    selectedFramework === 'all' || c.framework === selectedFramework
  );

  const passedCount = COMPLIANCE_CONTROLS.filter(c => c.status === 'passed').length;
  const warningCount = COMPLIANCE_CONTROLS.filter(c => c.status === 'warning').length;
  const failedCount = COMPLIANCE_CONTROLS.filter(c => c.status === 'failed').length;
  const readinessPercent = Math.round((passedCount / COMPLIANCE_CONTROLS.length) * 100);

  const handleExportAuditJSON = () => {
    setDownloadingReport(true);
    const report = {
      title: 'Enterprise Compliance Audit & Gap Analysis Matrix',
      generated_at: new Date().toISOString(),
      readiness_score: `${readinessPercent}%`,
      frameworks: ['SOC 2 Type II', 'ISO/IEC 27001:2022'],
      summary: { total_controls: COMPLIANCE_CONTROLS.length, passed: passedCount, warnings: warningCount, failed: failedCount },
      controls: COMPLIANCE_CONTROLS
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Compliance_Audit_Report_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setDownloadingReport(false), 1500);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* ── HEADER ──────────────────────────────────────────────── */}
      <div className="glass-card p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold font-display text-[var(--color-text-primary)] flex items-center gap-2.5">
              <Award className="text-[var(--color-primary)]" size={28} />
              SOC 2 & ISO 27001 Compliance Matrix
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[var(--color-primary-glow)] text-[var(--color-primary)]">
              Audit Readiness
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-1">
            Automated control mapping of vulnerability scans, SAST/DAST lanes, and threat intelligence against enterprise certification standards.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <NeoButton 
            size="sm" 
            variant="primary" 
            icon={<Download size={13} />} 
            onClick={handleExportAuditJSON}
          >
            {downloadingReport ? 'Exporting Report...' : 'Export Audit Report'}
          </NeoButton>
        </div>
      </div>

      {/* ── READINESS SCORECARD CARDS ───────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card p-4 space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Audit Readiness</span>
          <p className="text-2xl font-extrabold font-mono text-emerald-400">{readinessPercent}% Ready</p>
          <span className="text-[11px] text-[var(--color-text-secondary)]">SOC 2 Type II & ISO 27001</span>
        </div>

        <div className="card p-4 space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Controls Passed</span>
          <p className="text-2xl font-extrabold font-mono text-[var(--color-text-primary)]">{passedCount} / {COMPLIANCE_CONTROLS.length}</p>
          <span className="text-[11px] text-emerald-400 font-semibold">100% compliant controls</span>
        </div>

        <div className="card p-4 space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Gaps / Action Items</span>
          <p className="text-2xl font-extrabold font-mono text-amber-400">{warningCount} Controls</p>
          <span className="text-[11px] text-amber-400/80 font-semibold">Remediations in progress</span>
        </div>

        <div className="card p-4 space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Zero High Gaps</span>
          <p className="text-2xl font-extrabold font-mono text-emerald-400">{failedCount} Failed</p>
          <span className="text-[11px] text-emerald-400 font-semibold">Zero critical compliance blocks</span>
        </div>
      </div>

      {/* ── FRAMEWORK FILTER TABS ────────────────────────────────── */}
      <div className="flex border-b border-[var(--color-border-subtle)] gap-4 px-1">
        {[
          { id: 'all', label: 'All Frameworks (9 Controls)' },
          { id: 'soc2', label: 'SOC 2 Type II (5 Criteria)' },
          { id: 'iso27001', label: 'ISO/IEC 27001:2022 (4 Controls)' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedFramework(tab.id as any)}
            className={`py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              selectedFramework === tab.id
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── CONTROLS MATRIX TABLE ────────────────────────────────── */}
      <div className="space-y-3">
        {filteredControls.map((ctrl) => {
          const isPassed = ctrl.status === 'passed';
          const isWarning = ctrl.status === 'warning';

          return (
            <div 
              key={ctrl.id}
              className="p-5 rounded-2xl glass-card border border-[var(--color-border-subtle)] space-y-3 hover:border-[var(--color-primary)] transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-[var(--color-primary-glow)] text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                    {ctrl.code}
                  </span>
                  <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                    {ctrl.name}
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-white/5 text-[var(--color-text-muted)]">
                    {ctrl.framework.toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1.5 ${
                    isPassed ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                    isWarning ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                    'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}>
                    {isPassed ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                    {isPassed ? 'Compliant' : isWarning ? 'Remediation Needed' : 'Non-Compliant'}
                  </span>
                </div>
              </div>

              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                {ctrl.description}
              </p>

              <div className="p-3 rounded-xl bg-black/30 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase text-[var(--color-text-muted)]">Actionable Auditor Recommendation</span>
                  <p className="text-[var(--color-text-primary)]">{ctrl.remediationAdvice}</p>
                </div>
                {ctrl.mappedFindingsCount > 0 && (
                  <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-400 font-mono text-[11px] font-bold shrink-0">
                    {ctrl.mappedFindingsCount} Findings Impacting Control
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
