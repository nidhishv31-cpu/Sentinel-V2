import React, { useState } from 'react';
import { Upload, FileCode, CheckCircle2, AlertOctagon, RefreshCw, BarChart2, Trash2, ArrowRight } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';
import { useTraceStore, type PcapSummary } from '../store/traceStore';
import { NeoButton } from '../components/ui/NeoButton';

const COLORS = ['#10b981', '#6366f1', '#f43f5e', '#06b6d4', '#f59e0b', '#3b82f6', '#ec4899'];

export const TraceIngest: React.FC = () => {
  const navigate = useNavigate();
  const { summary, uploadedFilename, setSummary, resetTrace } = useTraceStore();
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const uploadPcapFile = async (file: File) => {
    setLoading(true);
    setError('');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE_URL}/pcap/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'PCAP processing failed.');
      }
      const data = await res.json();
      setSummary(data, file.name);
    } catch (err: any) {
      setError(err.message || 'An error occurred. Ensure tshark is installed on the backend.');
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadPcapFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadPcapFile(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-3 sm:p-4 md:p-6">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
            <FileCode size={22} className="text-[var(--color-primary)]" />
            Trace File Ingest & Traffic Forensics
          </h1>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Ingest and analyze network packet capture files (.pcap/.pcapng). Persists in your session until reset.
          </p>
        </div>

        {summary && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => navigate('/forensics')}
              className="flex items-center gap-1.5 px-3 py-1.5 min-h-[44px] sm:min-h-0 rounded-xl text-xs font-bold bg-[var(--color-primary-glow)] text-[var(--color-primary)] border border-[var(--color-primary)] hover:scale-105 transition-all"
            >
              Analyze in Forensics <ArrowRight size={13} />
            </button>
            <button
              onClick={resetTrace}
              className="flex items-center gap-1.5 px-3 py-1.5 min-h-[44px] sm:min-h-0 rounded-xl text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
            >
              <Trash2 size={13} /> Reset Trace
            </button>
          </div>
        )}
      </div>

      {/* Upload Zone (Only shown if no summary is active, or if user wants to replace) */}
      {!summary ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="lg:col-span-2 card p-3 sm:p-4 md:p-6 space-y-4">
            <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--color-accent)' }}>
              <FileCode size={16} />
              Upload Captured Trace (PCAP)
            </h2>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Upload Wireshark captures to parse protocol timelines, talkers, and check threat rules logic.
            </p>
            
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-4 sm:p-8 text-center cursor-pointer transition relative min-h-[200px] flex flex-col justify-center items-center ${
                dragActive ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5' : 'border-[var(--color-border)] hover:border-slate-500 bg-[var(--color-surface-2)]/50'
              }`}
            >
              <input
                type="file"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept=".pcap,.pcapng,.cap"
              />
              {loading ? (
                <div className="space-y-3">
                  <RefreshCw size={32} className="animate-spin mx-auto text-[var(--color-primary)]" />
                  <span className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>Extracting trace headers & flows...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload size={32} style={{ color: 'var(--color-text-faint)' }} className="mx-auto" />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Drag and drop PCAP/PCAPNG trace file here</p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Retained persistently across sessions</p>
                  </div>
                  <button className="px-4 py-2 min-h-[44px] sm:min-h-0 rounded-lg text-xs font-bold hover:opacity-80 transition" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>
                    Select Trace File
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 rounded-lg text-xs flex gap-2" style={{ background: 'var(--sev-high-bg)', color: 'var(--sev-high)' }}>
                <AlertOctagon size={14} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="card p-3 sm:p-4 md:p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>Capture Requirements</h3>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-faint)' }}>
                FastAPI backend routes parsing via local `tshark` instance. Ensure Wireshark engine package is installed on the hosting server.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[var(--color-surface-2)] text-xs text-[var(--color-text-muted)] space-y-1 mt-4">
              <span className="font-bold text-[var(--color-text-primary)] block">Supported Formats:</span>
              <p>• Wireshark .pcap / .pcapng</p>
              <p>• tcpdump raw network captures</p>
              <p>• Auto stream split & extraction</p>
            </div>
          </div>
        </div>
      ) : (
        /* Summary & Visualizations of Currently Ingested File */
        <div className="space-y-6">
          {/* Active File Banner */}
          <div className="card p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-[var(--color-primary)]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--color-text-primary)]">
                  Active Capture: <span className="font-mono text-[var(--color-primary)]">{uploadedFilename || summary.capture_id}</span>
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Total Packets: <strong>{summary.total_packets.toLocaleString()}</strong> · Total Volume: <strong>{formatBytes(summary.total_bytes)}</strong> · Protocols: <strong>{summary.protocols.length}</strong>
                </p>
              </div>
            </div>

            <button
              onClick={resetTrace}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 min-h-[44px] sm:min-h-0 rounded-xl text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors w-full sm:w-auto"
            >
              <Trash2 size={13} /> Reset & Upload New File
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Protocol Distribution Pie */}
            <div className="card p-3 sm:p-4 md:p-6 flex flex-col justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--color-text-muted)' }}>
                Protocol Breakdown (Packets)
              </h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={summary.protocols}
                      dataKey="count"
                      nameKey="protocol"
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {summary.protocols.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--color-surface)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text)',
                        fontSize: '12px',
                        borderRadius: '8px'
                      }}
                      formatter={(val: any, name: any, item: any) => [
                        `${val} packets (${formatBytes(item.payload.bytes)})`,
                        name
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Talkers */}
            <div className="card p-3 sm:p-4 md:p-6">
              <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--color-text-muted)' }}>
                Top Source IP Talkers
              </h3>
              <div className="space-y-3">
                {summary.top_talkers.slice(0, 5).map((talker, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs pb-2" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                    <span className="font-mono" style={{ color: 'var(--color-text)' }}>{talker.ip}</span>
                    <div className="text-right">
                      <span className="font-semibold" style={{ color: 'var(--color-accent)' }}>{talker.packets} pkts</span>
                      <span className="ml-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>({formatBytes(talker.bytes)})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline Stream */}
            <div className="card p-3 sm:p-4 md:p-6 md:col-span-2">
              <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--color-text-muted)' }}>
                Packet Timeline Ingestion Flow
              </h3>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={summary.timeline}>
                    <XAxis dataKey="time" stroke="var(--color-text-faint)" fontSize={10} tickLine={false} />
                    <YAxis stroke="var(--color-text-faint)" fontSize={10} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--color-surface)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text)',
                        fontSize: '12px',
                        borderRadius: '8px'
                      }}
                    />
                    <Line type="monotone" dataKey="packets" stroke="var(--color-accent)" strokeWidth={2} dot={{ r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};