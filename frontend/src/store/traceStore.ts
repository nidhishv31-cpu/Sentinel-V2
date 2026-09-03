import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ProtocolEntry {
  protocol: string;
  count: number;
  bytes: number;
}

export interface TalkerEntry {
  ip: string;
  packets: number;
  bytes: number;
}

export interface TimelineEntry {
  time: string;
  packets: number;
}

export interface PcapSummary {
  capture_id: string;
  total_packets: number;
  total_bytes: number;
  protocols: ProtocolEntry[];
  top_talkers: TalkerEntry[];
  timeline: TimelineEntry[];
  filename?: string;
  uploadedAt?: string;
}

interface TraceStore {
  summary: PcapSummary | null;
  uploadedFilename: string | null;
  setSummary: (summary: PcapSummary | null, filename?: string) => void;
  resetTrace: () => void;
}

export const useTraceStore = create<TraceStore>()(
  persist(
    (set) => ({
      summary: null,
      uploadedFilename: null,
      setSummary: (summary, filename) => set({ 
        summary, 
        uploadedFilename: filename || summary?.capture_id || null 
      }),
      resetTrace: () => set({ summary: null, uploadedFilename: null }),
    }),
    { name: 'vulnscan-trace-store' }
  )
);