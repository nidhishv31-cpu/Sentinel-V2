import {
  LayoutDashboard, ScanLine, Bug, Radar, Zap,
  FileBarChart, Plug, Settings, ChevronRight,
  FileCode, Radio, FileText, ShieldAlert, Sparkles,
  Globe, GitCompare, Network, GitBranch, Layers,
  Award, ShieldCheck
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  children?: { id: string; label: string; href: string }[];
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Executive & Overview',
    items: [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard, href: '/' },
      { id: 'findings', label: 'Findings Triage', icon: Bug, href: '/findings' },
      { id: 'compliance', label: 'Compliance Matrix', icon: Award, href: '/compliance' },
      { id: 'reports', label: 'Reports Center', icon: FileBarChart, href: '/reports' },
    ]
  },
  {
    title: 'DevSecOps & Code',
    items: [
      { id: 'pipeline', label: 'Pipeline Engine', icon: Layers, href: '/pipeline' },
      { id: 'repos', label: 'GitHub Repos', icon: GitBranch, href: '/repos' },
      { id: 'baseline-diff', label: 'Baseline Diff', icon: GitCompare, href: '/diff' },
    ]
  },
  {
    title: 'Dynamic & Web DAST',
    items: [
      {
        id: 'scans',
        label: 'Scans Hub',
        icon: ScanLine,
        href: '/scans',
        children: [
          { id: 'scans-active',    label: 'Active Scans',    href: '/scans/active'    },
          { id: 'scans-scheduled', label: 'Scheduled Scans', href: '/scans/scheduled' },
          { id: 'scans-history',   label: 'Scan History',    href: '/scans/history'   },
        ],
      },
      { id: 'dast-hub', label: 'DAST Scanners', icon: Zap, href: '/dast' },
      { id: 'repeater', label: 'HTTP Repeater', icon: Globe, href: '/repeater' },
      { id: 'recon', label: 'Target Recon', icon: Radar, href: '/recon' },
    ]
  },
  {
    title: 'Network & Forensics',
    items: [
      { id: 'live-capture', label: 'Live Packet Capture', icon: Radio, href: '/live-capture' },
      { id: 'forensics', label: 'Packet Forensics', icon: ShieldAlert, href: '/forensics' },
      { id: 'trace-ingest', label: 'Trace File Ingest', icon: FileCode, href: '/trace-ingest' },
      { id: 'zenmap', label: 'Zenmap Topology', icon: Network, href: '/zenmap' },
    ]
  },
  {
    title: 'Operations & Settings',
    items: [
      { id: 'threat-intel', label: 'CISA KEV Threat Intel', icon: ShieldCheck, href: '/threat-intel' },
      { id: 'log-ingest', label: 'Log Ingest & SIEM', icon: FileText, href: '/log-ingest' },
      { id: 'automation', label: 'Automation & Cron', icon: Sparkles, href: '/automation' },
      { id: 'integrations', label: 'Integrations', icon: Plug, href: '/integrations' },
      { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
    ]
  }
];

export const NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap(s => s.items);

export { ChevronRight };