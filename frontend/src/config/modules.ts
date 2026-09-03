// Scan module registry — adding a new backend module = adding one entry here
export interface ScanModule {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  category: 'web' | 'network' | 'code' | 'config';
  icon: string; // emoji fallback
}

export const SCAN_MODULES: ScanModule[] = [
  { id: 'sqli',        label: 'SQL Injection',        description: 'Detect SQLi vulnerabilities in forms and parameters', enabled: true,  category: 'web',     icon: '💉' },
  { id: 'xss',         label: 'XSS',                  description: 'Cross-site scripting detection (reflected + stored)', enabled: true,  category: 'web',     icon: '🪝' },
  { id: 'headers',     label: 'Header Check',         description: 'Security headers audit (CSP, HSTS, X-Frame-Options)', enabled: true,  category: 'web',     icon: '🧢' },
  { id: 'tls',         label: 'TLS Audit',            description: 'Certificate validity, cipher suites, protocol versions', enabled: true,  category: 'network', icon: '🔐' },
  { id: 'ports',       label: 'Port Scan',            description: 'Open port discovery and service fingerprinting',      enabled: true,  category: 'network', icon: '🔍' },
  { id: 'subdomains',  label: 'Subdomain Enum',       description: 'Passive and active subdomain enumeration',            enabled: true,  category: 'network', icon: '🌐' },
  { id: 'secrets',     label: 'Secret Exposure',      description: 'Detect exposed API keys, tokens in JS/HTML',         enabled: false, category: 'code',    icon: '🗝️' },
  { id: 'deps',        label: 'Outdated Libraries',   description: 'Identify outdated JS libraries with known CVEs',     enabled: true,  category: 'code',    icon: '📦' },
  { id: 'cors',        label: 'CORS Misconfiguration', description: 'Detect overly permissive CORS policies',            enabled: false, category: 'config',  icon: '↔️' },
  { id: 'csrf',        label: 'CSRF',                 description: 'Cross-site request forgery protection check',        enabled: true,  category: 'web',     icon: '🔄' },
  { id: 'clickjack',   label: 'Clickjacking',         description: 'Frame embedding and clickjacking protection',        enabled: true,  category: 'web',     icon: '🖱️' },
  { id: 'dirtraversal', label: 'Path Traversal',      description: 'Directory traversal and LFI detection',              enabled: false, category: 'web',     icon: '📂' },
];
