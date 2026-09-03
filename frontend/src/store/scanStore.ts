import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Target {
  id: string;
  url: string;
  label: string;
  addedAt: string;
}

export type ScanStatus = 'idle' | 'running' | 'completed' | 'failed';

export interface FindingItem {
  id: string;
  scanId?: string;
  targetUrl: string;
  engine?: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  endpoint?: string;
  cwe?: string;
  cvss?: number;
  description: string;
  remediation?: string;
  evidence?: string;
  discoveredAt: string;
}

export interface ScanRecord {
  id: string;
  targetId: string;
  targetUrl: string;
  engine?: string;
  status: ScanStatus;
  startedAt: string;
  completedAt?: string;
  duration?: string;
  findingsCount: number;
  maxSeverity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  progress: number; // 0–100
  findings?: FindingItem[];
  trafficValidation?: any;
}

export interface Schedule {
  id: string;
  targetId?: string; // which target to scan
  targetUrl?: string;
  type: string;
  expression: string;
  nextRun: string;
  enabled?: boolean;
}

export interface Preferences {
  emailCritical: boolean;
  emailCompletion: boolean;
  slackAlerts: boolean;
  weeklyDigest: boolean;
}

interface ScanStore {
  targets: Target[];
  scans: ScanRecord[];
  activeScanId: string | null;
  schedules: Schedule[];
  preferences: Preferences;
  integrations: Record<string, boolean>;
  liveInterface: string;
  livePackets: any[];
  dbSyncStatus: 'idle' | 'syncing' | 'synced' | 'error';

  addTarget: (url: string, label?: string) => Target;
  removeTarget: (id: string) => void;
  startScan: (targetId: string) => ScanRecord;
  updateScan: (id: string, patch: Partial<ScanRecord>) => void;
  addSchedule: (schedule: Omit<Schedule, 'id'>) => void;
  removeSchedule: (id: string) => void;
  updatePreference: (key: keyof Preferences, value: boolean) => void;
  toggleIntegration: (name: string) => void;
  batchStartScans: (targetIds: string[]) => ScanRecord[];
  addCompletedScanWithFindings: (scan: Partial<ScanRecord>, findings: FindingItem[]) => ScanRecord;
  addFindingsToScan: (scanId: string, findings: FindingItem[]) => void;
  clearAll: () => void;
  hasRunScans: () => boolean;
  setLiveInterface: (iface: string) => void;
  setLivePackets: (packets: any[]) => void;
  addLivePacket: (packet: any) => void;
}

function makeId() {
  return Math.random().toString(36).slice(2, 9);
}

// Auto-persist completed scans to the backend SQLite database
async function persistScanToDb(scan: ScanRecord) {
  try {
    const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || '';
    const PYTHON_API = API_BASE || 'http://localhost:8000';
    const res = await fetch(`${PYTHON_API}/api/scan/save-run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: scan.id,
        target: scan.targetUrl,
        status: scan.status,
        startedAt: scan.startedAt,
        completedAt: scan.completedAt,
        duration: scan.duration,
        findingsCount: scan.findingsCount,
        maxSeverity: scan.maxSeverity,
        findings: (scan.findings || []).map(f => ({
          title: f.title,
          severity: f.severity,
          description: f.description,
          endpoint: f.endpoint,
          cwe: f.cwe,
          cvss: f.cvss,
          remediation: f.remediation,
          evidence: f.evidence,
        })),
      }),
    });
    if (res.ok) {
      useScanStore.setState({ dbSyncStatus: 'synced' });
    }
  } catch {
    useScanStore.setState({ dbSyncStatus: 'error' });
  }
}

export const useScanStore = create<ScanStore>()(
  persist(
    (set, get) => ({
      targets: [],
      scans: [],
      activeScanId: null,
      schedules: [],
      preferences: {
        emailCritical: true,
        emailCompletion: true,
        slackAlerts: false,
        weeklyDigest: false,
      },
      integrations: {
        Email: true,
      },
      liveInterface: '',
      livePackets: [],
      dbSyncStatus: 'idle' as const,

      setLiveInterface: (liveInterface) => set({ liveInterface }),
      setLivePackets: (livePackets) => set({ livePackets }),
      addLivePacket: (packet) => set(s => ({ livePackets: [packet, ...(s.livePackets || [])].slice(0, 500) })),

      addTarget: (url, label) => {
        const clean = url.replace(/\/$/, '');
        const target: Target = {
          id: makeId(),
          url: clean,
          label: label || clean,
          addedAt: new Date().toISOString(),
        };
        set(s => ({ targets: [...s.targets, target] }));
        return target;
      },

      removeTarget: (id) =>
        set(s => ({
          targets: s.targets.filter(t => t.id !== id),
          scans: s.scans.filter(sc => sc.targetId !== id),
          schedules: s.schedules.filter(sch => sch.targetId !== id),
        })),

      startScan: (targetId) => {
        const target = get().targets.find(t => t.id === targetId);
        if (!target) throw new Error('Target not found');

        const scan: ScanRecord = {
          id: makeId(),
          targetId,
          targetUrl: target.url,
          status: 'running',
          startedAt: new Date().toLocaleString(),
          findingsCount: 0,
          maxSeverity: 'info',
          progress: 0,
        };
        set(s => ({ scans: [scan, ...s.scans], activeScanId: scan.id }));
        return scan;
      },

      batchStartScans: (targetIds) => {
        const newScans: ScanRecord[] = [];
        targetIds.forEach(tId => {
          const target = get().targets.find(t => t.id === tId);
          if (target) {
            newScans.push({
              id: makeId(),
              targetId: tId,
              targetUrl: target.url,
              status: 'running',
              startedAt: new Date().toLocaleString(),
              findingsCount: 0,
              maxSeverity: 'info',
              progress: 0,
            });
          }
        });
        if (newScans.length > 0) {
          set(s => ({ scans: [...newScans, ...s.scans], activeScanId: newScans[0].id }));
        }
        return newScans;
      },

      updateScan: (id, patch) =>
        set(s => ({
          scans: s.scans.map(sc => sc.id === id ? { ...sc, ...patch } : sc),
          activeScanId: patch.status === 'completed' || patch.status === 'failed'
            ? null
            : s.activeScanId,
        })),

      addSchedule: (schedule) => 
        set(s => ({ schedules: [...s.schedules, { ...schedule, id: makeId() }] })),
      
      removeSchedule: (id) =>
        set(s => ({ schedules: s.schedules.filter(sch => sch.id !== id) })),

      addCompletedScanWithFindings: (scanPatch, findings) => {
        const scanId = scanPatch.id || makeId();
        const fullFindings = findings.map(f => ({
          ...f,
          id: f.id || makeId(),
          scanId,
          discoveredAt: f.discoveredAt || new Date().toLocaleString(),
        }));

        const scan: ScanRecord = {
          id: scanId,
          targetId: scanPatch.targetId || makeId(),
          targetUrl: scanPatch.targetUrl || 'Target Site',
          engine: scanPatch.engine || 'Vulnerability Scanner',
          status: scanPatch.status || 'completed',
          startedAt: scanPatch.startedAt || new Date().toLocaleString(),
          completedAt: scanPatch.completedAt || new Date().toLocaleString(),
          duration: scanPatch.duration || '3s',
          findingsCount: fullFindings.length,
          maxSeverity: scanPatch.maxSeverity || (fullFindings.length > 0 ? fullFindings[0].severity : 'info'),
          progress: 100,
          findings: fullFindings,
        };

        set(s => ({ scans: [scan, ...s.scans], dbSyncStatus: 'syncing' as const }));
        
        // Auto-persist to backend database
        persistScanToDb(scan);
        
        return scan;
      },

      addFindingsToScan: (scanId, newFindings) => {
        set(s => ({
          scans: s.scans.map(sc => {
            if (sc.id !== scanId) return sc;
            const updatedFindings = [...(sc.findings || []), ...newFindings];
            return {
              ...sc,
              findings: updatedFindings,
              findingsCount: updatedFindings.length,
            };
          })
        }));
      },

      updatePreference: (key, value) =>
        set(s => ({ preferences: { ...s.preferences, [key]: value } })),

      toggleIntegration: (name) =>
        set(s => ({ integrations: { ...s.integrations, [name]: !s.integrations[name] } })),

      clearAll: () => set({ targets: [], scans: [], activeScanId: null, schedules: [] }),

      hasRunScans: () => get().scans.length > 0,
    }),
    { 
      name: 'vulnscan-store',
      partialize: (state) => Object.fromEntries(
        Object.entries(state).filter(([key]) => !['livePackets', 'activeScanId'].includes(key))
      ),
    }
  )
);
