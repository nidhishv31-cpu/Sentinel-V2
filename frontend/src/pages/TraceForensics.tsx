import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldAlert, Radio, FileCheck, FileCode, Download, 
  Key, Image as ImageIcon, FileText, CheckCircle2, AlertTriangle, 
  ArrowRightLeft, RefreshCw, Upload, Split, Combine, Search, Check, ChevronDown, Lock, Unlock, HelpCircle, Copy, Sparkles, X, Globe, Activity, MapPin, Eye
} from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import { useTraceStore } from '../store/traceStore';

export default function TraceForensics() {
  const [activeTab, setActiveTab] = useState<'stream' | 'compare' | 'carver' | 'geomap' | 'beacon'>('stream');

  return (
    <div className="max-w-6xl mx-auto p-2 sm:p-4 space-y-6">
      <div>
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
          <ShieldAlert size={22} className="text-indigo-500" />
          Network Packet Forensics & TCP Reassembly
        </h1>
        <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
          High-performance packet stream reassembly, multi-session TCP splitting, diff tampering analysis, and artifact carving.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 p-1 rounded-xl w-full sm:w-fit overflow-x-auto" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
        {[
          { id: 'stream', label: 'Follow TCP/QUIC Stream & TLS', icon: Radio },
          { id: 'carver', label: 'File Carver (Magic-Bytes)', icon: FileCode },
          { id: 'geomap', label: 'Geo Threat Map (ASN)', icon: Globe },
          { id: 'beacon', label: 'C2 Beaconing Detector', icon: Activity },
          { id: 'compare', label: 'Compare PCAPs (MITM check)', icon: ArrowRightLeft },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
            style={{
              background: activeTab === t.id ? 'var(--color-surface)' : 'transparent',
              color: activeTab === t.id ? 'var(--color-text)' : 'var(--color-text-muted)',
              border: activeTab === t.id ? '1px solid var(--color-border)' : '1px solid transparent',
              cursor: 'pointer',
              boxShadow: activeTab === t.id ? 'var(--shadow-card)' : 'none'
            }}
          >
            <t.icon size={13} />
            {t.label}
          </button>
        ))}
      </div>

      <motion.div 
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'stream' && <FollowStreamView />}
        {activeTab === 'carver' && <FileCarverView />}
        {activeTab === 'geomap' && <GeoThreatMapView />}
        {activeTab === 'beacon' && <BeaconingDetectorView />}
        {activeTab === 'compare' && <ComparePcapView />}
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   1. HIGH-PERFORMANCE FOLLOW TCP STREAM SUB-VIEW
   ───────────────────────────────────────────────────────────── */
function FollowStreamView() {
  const { summary: ingestSummary, uploadedFilename } = useTraceStore();
  const [captureId, setCaptureId] = useState<string>(uploadedFilename || ingestSummary?.capture_id || '');
  const [availableCaptures, setAvailableCaptures] = useState<any[]>([]);
  const [discoveredStreams, setDiscoveredStreams] = useState<any[]>([]);
  const [selectedStreamId, setSelectedStreamId] = useState<number>(0);
  const [isCombinedMode, setIsCombinedMode] = useState<boolean>(false);
  
  // TLS Decryption State
  const [keylogId, setKeylogId] = useState<string>('');
  const [availableKeylogs, setAvailableKeylogs] = useState<any[]>([]);
  const [tlsDecryptionEnabled, setTlsDecryptionEnabled] = useState<boolean>(true);
  const [uploadingKeylog, setUploadingKeylog] = useState<boolean>(false);
  const [showTlsHelp, setShowTlsHelp] = useState<boolean>(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const [dialog, setDialog] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [viewFormat, setViewFormat] = useState<'ascii' | 'hex'>('ascii');
  const [visibleCount, setVisibleCount] = useState<number>(50);
  const [expandedIndices, setExpandedIndices] = useState<Record<number, boolean>>({});

  useEffect(() => {
    loadRecentCaptures();
    loadRecentKeylogs();
  }, []);

  useEffect(() => {
    if (captureId) {
      fetchStreamsForCapture(captureId, tlsDecryptionEnabled ? keylogId : undefined);
    }
  }, [captureId, keylogId, tlsDecryptionEnabled]);

  const loadRecentCaptures = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/pcap/captures`);
      if (res.ok) {
        const data = await res.json();
        setAvailableCaptures(data);
        if (!captureId && data.length > 0) {
          setCaptureId(data[0].filename);
        }
      }
    } catch (e) {
      console.warn('Could not fetch capture list:', e);
    }
  };

  const loadRecentKeylogs = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/pcap/keylogs`);
      if (res.ok) {
        const data = await res.json();
        setAvailableKeylogs(data);
        if (!keylogId && data.length > 0) {
          setKeylogId(data[0].filename);
        }
      }
    } catch (e) {
      console.warn('Could not fetch keylog list:', e);
    }
  };

  const fetchStreamsForCapture = async (capId: string, activeKeylog?: string) => {
    try {
      const keyParam = (activeKeylog && tlsDecryptionEnabled) ? `&keylog_id=${encodeURIComponent(activeKeylog)}` : '';
      const res = await fetch(`${API_BASE_URL}/pcap/streams?capture_id=${encodeURIComponent(capId)}${keyParam}`);
      if (res.ok) {
        const data = await res.json();
        const streams = data.streams || [];
        setDiscoveredStreams(streams);
        if (streams.length > 0) {
          setSelectedStreamId(streams[0].stream_id);
          loadStreamData(capId, streams[0].stream_id, isCombinedMode, activeKeylog);
        } else {
          loadStreamData(capId, 0, isCombinedMode, activeKeylog);
        }
      }
    } catch (e) {
      console.warn('Error discovering streams:', e);
      loadStreamData(capId, 0, isCombinedMode, activeKeylog);
    }
  };

  const loadStreamData = async (capId: string, streamId: number, combineAll: boolean, activeKeylog?: string) => {
    if (!capId.trim()) return;
    setError('');
    setLoading(true);
    setVisibleCount(50);
    setExpandedIndices({});
    try {
      const kId = (activeKeylog || (tlsDecryptionEnabled ? keylogId : ''));
      const keyParam = kId ? `&keylog_id=${encodeURIComponent(kId)}` : '';
      const url = `${API_BASE_URL}/pcap/follow-stream?capture_id=${encodeURIComponent(capId.trim())}&stream_id=${streamId}&combine_all=${combineAll}${keyParam}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(await res.text() || 'Stream reassembly failed on backend');
      }
      const data = await res.json();
      setDialog(data.dialog || []);
      if ((data.dialog || []).length === 0) {
        setError(combineAll ? 'No TCP payloads found across streams.' : `No payload packets found in TCP Stream #${streamId}.`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch TCP stream.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeylogUpload = async (file: File) => {
    setUploadingKeylog(true);
    setError('');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE_URL}/pcap/upload-keylog`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Keylog upload failed');
      }
      const data = await res.json();
      const newKeyId = data.keylog_id || file.name;
      setKeylogId(newKeyId);
      setTlsDecryptionEnabled(true);
      await loadRecentKeylogs();
      if (captureId) {
        await fetchStreamsForCapture(captureId, newKeyId);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload TLS keylog file.');
    } finally {
      setUploadingKeylog(false);
    }
  };

  const handleCopyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setError('');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE_URL}/pcap/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Upload failed');
      }
      const newCapId = file.name;
      setCaptureId(newCapId);
      await loadRecentCaptures();
      await fetchStreamsForCapture(newCapId);
    } catch (err: any) {
      setError(err.message || 'Failed to upload PCAP file.');
    } finally {
      setUploading(false);
    }
  };

  const handleStreamSelect = (sId: number) => {
    setSelectedStreamId(sId);
    setIsCombinedMode(false);
    loadStreamData(captureId, sId, false);
  };

  const handleToggleCombinedMode = () => {
    const nextCombined = !isCombinedMode;
    setIsCombinedMode(nextCombined);
    loadStreamData(captureId, selectedStreamId, nextCombined);
  };

  const filteredDialog = useMemo(() => {
    if (!searchFilter.trim()) return dialog;
    const q = searchFilter.toLowerCase();
    return dialog.filter(msg => 
      (msg.payload_ascii && msg.payload_ascii.toLowerCase().includes(q)) ||
      (msg.src_ip && msg.src_ip.includes(q)) ||
      (msg.dst_ip && msg.dst_ip.includes(q))
    );
  }, [dialog, searchFilter]);

  const visibleDialog = useMemo(() => {
    return filteredDialog.slice(0, visibleCount);
  }, [filteredDialog, visibleCount]);

  const toggleExpand = (idx: number) => {
    setExpandedIndices(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleExportTranscript = () => {
    if (dialog.length === 0) return;
    let transcriptText = `--- TCP STREAM REASSEMBLY TRANSCRIPT ---\nCapture: ${captureId}\nMode: ${isCombinedMode ? 'COMBINED ALL STREAMS' : `STREAM #${selectedStreamId}`}\nTimestamp: ${new Date().toISOString()}\n\n`;
    dialog.forEach((msg) => {
      transcriptText += `[${msg.stream_id !== undefined ? `Stream ${msg.stream_id} | ` : ''}${msg.src_ip}:${msg.src_port} -> ${msg.dst_ip}:${msg.dst_port}]\n`;
      transcriptText += `${viewFormat === 'ascii' ? msg.payload_ascii : msg.payload_hex}\n\n`;
    });

    const blob = new Blob([transcriptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tcp_stream_${captureId}_${isCombinedMode ? 'combined' : `stream_${selectedStreamId}`}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
      {/* ── LEFT CONTROLS & STREAM SPLITTER (4 COLS) ── */}
      <div className="lg:col-span-4 space-y-4">
        {/* Direct Upload Card */}
        <div className="card p-3 sm:p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] flex items-center gap-1.5">
              <Upload size={14} className="text-[var(--color-primary)]" />
              Upload PCAP Trace
            </h2>
            {uploading && <RefreshCw size={13} className="animate-spin text-[var(--color-primary)]" />}
          </div>

          <label className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition flex flex-col justify-center items-center hover:border-[var(--color-primary)] bg-[var(--color-surface-2)]/50 block">
            <input
              type="file"
              onChange={e => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
              className="hidden"
              accept=".pcap,.pcapng,.cap"
            />
            <FileCode size={24} className="text-[var(--color-text-muted)] mx-auto mb-1.5" />
            <span className="text-xs font-bold text-[var(--color-text-primary)]">
              {uploading ? 'Parsing & Splitting Streams...' : 'Choose or Drop PCAP File'}
            </span>
            <span className="text-xs text-[var(--color-text-faint)] mt-0.5">
              Auto-discovers and splits conversation flows
            </span>
          </label>

          {/* Existing Capture Selector Dropdown */}
          {availableCaptures.length > 0 && (
            <div className="space-y-1 pt-1">
              <label className="text-xs font-semibold text-[var(--color-text-muted)] block">
                Or Select from Uploaded Traces:
              </label>
              <select
                value={captureId}
                onChange={e => setCaptureId(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg outline-none bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text-primary)] font-mono"
              >
                {availableCaptures.map((c, i) => (
                  <option key={i} value={c.filename}>
                    {c.filename} ({(c.size_bytes / 1024).toFixed(1)} KB)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

                {/* ── 2. TLS / HTTPS DECRYPTION STUDIO CARD ── */}
        <div className="card p-4 space-y-3 border border-emerald-500/20 bg-emerald-950/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Key size={14} className="text-emerald-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                TLS / HTTPS Decryption
              </h2>
            </div>
            
            <button
              onClick={() => setShowTlsHelp(true)}
              className="text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1 cursor-pointer font-bold"
            >
              <HelpCircle size={11} /> Guide
            </button>
          </div>

          <p className="text-xs text-[var(--color-text-muted)]">
            Decrypt HTTPS and TLS payloads in real time by supplying a browser/server <code className="text-emerald-300">SSLKEYLOGFILE</code> or RSA Private Key.
          </p>

          {/* Keylog File Upload Box */}
          <label className="border-2 border-dashed border-emerald-500/30 rounded-xl p-3 text-center cursor-pointer transition flex flex-col justify-center items-center hover:border-emerald-400 bg-black/20 block">
            <input
              type="file"
              onChange={e => {
                if (e.target.files && e.target.files[0]) {
                  handleKeylogUpload(e.target.files[0]);
                }
              }}
              className="hidden"
              accept=".log,.txt,.key,.pem"
            />
            <Unlock size={20} className="text-emerald-400 mx-auto mb-1" />
            <span className="text-xs font-bold text-emerald-300">
              {uploadingKeylog ? 'Loading Keylog...' : 'Upload SSLKEYLOGFILE (.log / .pem)'}
            </span>
            <span className="text-[9px] text-[var(--color-text-faint)] mt-0.5">
              Pre-Master Secret (PMS) / RSA Key
            </span>
          </label>

          {/* Active Key Status & Existing Keylog Selector */}
          {availableKeylogs.length > 0 && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-[var(--color-text-muted)]">
                  Active TLS Keylog:
                </label>
                <button
                  onClick={() => {
                    const nextState = !tlsDecryptionEnabled;
                    setTlsDecryptionEnabled(nextState);
                    if (captureId) fetchStreamsForCapture(captureId, nextState ? keylogId : undefined);
                  }}
                  className={`text-xs font-bold px-2 py-0.5 rounded cursor-pointer transition-colors ${
                    tlsDecryptionEnabled 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                      : 'bg-white/5 text-[var(--color-text-muted)]'
                  }`}
                >
                  {tlsDecryptionEnabled ? '🔓 Decryption ON' : '🔒 Decryption OFF'}
                </button>
              </div>

              <select
                value={keylogId}
                onChange={e => {
                  setKeylogId(e.target.value);
                  if (captureId) fetchStreamsForCapture(captureId, e.target.value);
                }}
                disabled={!tlsDecryptionEnabled}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg outline-none bg-[var(--color-surface-2)] border border-emerald-500/30 text-emerald-200 font-mono disabled:opacity-50"
              >
                {availableKeylogs.map((k, i) => (
                  <option key={i} value={k.filename}>
                    {k.filename} ({(k.size_bytes / 1024).toFixed(1)} KB)
                  </option>
                ))}
              </select>

              {keylogId && tlsDecryptionEnabled && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
                  <Check size={11} /> Decrypting TLS conversations in {captureId}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Stream Discovery & Splitter Panel */}
        <div className="card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] flex items-center gap-1.5">
                <Split size={14} className="text-[var(--color-primary)]" />
                Discovered TCP Streams ({discoveredStreams.length})
              </h2>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                Click any split flow or combine everything
              </p>
            </div>

            <button
              onClick={handleToggleCombinedMode}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                isCombinedMode 
                  ? 'bg-[var(--color-primary)] text-black border-[var(--color-primary)] shadow-sm'
                  : 'glass-panel text-[var(--color-text-secondary)] hover:text-white'
              }`}
            >
              <Combine size={12} />
              {isCombinedMode ? 'Combined Active' : 'Combine All'}
            </button>
          </div>

          {/* Stream Selector List */}
          <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 scrollbar">
            {discoveredStreams.length === 0 ? (
              <div className="p-3 rounded-lg bg-[var(--color-surface-2)] text-xs text-[var(--color-text-muted)] text-center">
                Upload a capture file to automatically split TCP streams.
              </div>
            ) : (
              discoveredStreams.map((s) => {
                const isSelected = !isCombinedMode && selectedStreamId === s.stream_id;
                return (
                  <div
                    key={s.stream_id}
                    onClick={() => handleStreamSelect(s.stream_id)}
                    className={`p-2.5 rounded-xl cursor-pointer transition-all border text-xs font-mono ${
                      isSelected
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary-glow)] text-[var(--color-text-primary)]'
                        : 'border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] hover:border-zinc-500 opacity-85 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[var(--color-primary)]">Stream #{s.stream_id}</span>
                      <span className="text-xs px-1.5 py-0.2 rounded bg-white/5 text-[var(--color-text-muted)]">
                        {s.protocol || 'TCP'} · {s.packet_count} pkts
                      </span>
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)] truncate mt-1">
                      {s.client} ➔ {s.server}
                    </div>
                    {s.preview && (
                      <div className="text-[9px] text-[var(--color-text-faint)] truncate italic mt-0.5">
                        {s.preview}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {error && (
            <div className="p-3 rounded-lg text-xs flex gap-2" style={{ background: 'var(--sev-high-bg)', color: 'var(--sev-high)' }}>
              <AlertTriangle size={14} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT STREAM DIALOGUE TRANSCRIPT (8 COLS) ── */}
      <div className="lg:col-span-8 card p-3 sm:p-4 md:p-5 flex flex-col min-h-[480px] lg:h-[78vh] overflow-hidden space-y-3">
        {/* Transcript Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--color-border-subtle)]">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)]">
                {isCombinedMode ? 'Combined Stream Transcript (All Sessions)' : `Stream #${selectedStreamId} Conversation`}
              </h2>
              {isCombinedMode && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-400 font-mono">
                  ALL STREAMS MERGED
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--color-text-muted)] font-mono">
              Trace: {captureId || 'No capture selected'} · Showing {visibleDialog.length} of {filteredDialog.length} Payloads
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View Format Toggle (ASCII / Hex) */}
            <div className="flex rounded-lg overflow-hidden border border-[var(--color-border)] text-xs font-mono">
              <button
                onClick={() => setViewFormat('ascii')}
                className={`px-2 py-1 ${viewFormat === 'ascii' ? 'bg-[var(--color-primary)] text-black font-bold' : 'bg-transparent text-[var(--color-text-muted)]'}`}
              >
                ASCII
              </button>
              <button
                onClick={() => setViewFormat('hex')}
                className={`px-2 py-1 ${viewFormat === 'hex' ? 'bg-[var(--color-primary)] text-black font-bold' : 'bg-transparent text-[var(--color-text-muted)]'}`}
              >
                HEX
              </button>
            </div>

            {/* Search Transcript */}
            <div className="relative w-36 sm:w-44">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                type="text"
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                placeholder="Filter dialogue..."
                className="w-full pl-7 pr-2 py-1 text-xs rounded-lg outline-none bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text-primary)] font-mono"
              />
            </div>

            <button
              onClick={handleExportTranscript}
              disabled={dialog.length === 0}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold glass-panel text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              <Download size={12} /> Save
            </button>
          </div>
        </div>

        {/* Transcript Dialogue Scroll Container */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-xs opacity-75 space-y-2">
              <RefreshCw size={28} className="animate-spin text-[var(--color-primary)]" />
              <span>Fast stream reassembly & payload caching in progress...</span>
            </div>
          ) : visibleDialog.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-xs opacity-50 p-6 space-y-2">
              <FileCode size={36} className="text-[var(--color-text-muted)]" />
              <p className="font-semibold text-sm text-[var(--color-text-primary)]">No Stream Dialogue to Display</p>
              <p className="text-xs text-[var(--color-text-muted)] max-w-sm">
                Upload a PCAP capture on the left panel or select a stream to reassemble the TCP conversation.
              </p>
            </div>
          ) : (
            <>
              {visibleDialog.map((msg, idx) => {
                const isOutgoing = idx % 2 === 0;
                const rawPayload = viewFormat === 'ascii' ? (msg.payload_ascii || '') : (msg.payload_hex || '');
                const isLong = rawPayload.length > 800;
                const isExpanded = !!expandedIndices[idx];
                const displayPayload = isLong && !isExpanded ? rawPayload.slice(0, 800) + '...' : rawPayload;

                return (
                  <div key={idx} className={`flex flex-col max-w-[90%] ${isOutgoing ? 'mr-auto items-start' : 'ml-auto items-end'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      {msg.stream_id !== undefined && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-white/10 text-[var(--color-primary)]">
                          Stream #{msg.stream_id}
                        </span>
                      )}
                      <span className="text-xs font-mono font-semibold text-[var(--color-text-faint)]">
                        {msg.src_ip}:{msg.src_port} &rarr; {msg.dst_ip}:{msg.dst_port}
                      </span>
                    </div>
                    <div 
                      className="p-3.5 rounded-xl text-xs font-mono whitespace-pre-wrap select-text leading-relaxed break-all border transition-all"
                      style={{
                        background: isOutgoing ? 'var(--color-surface-2)' : 'rgba(99, 102, 241, 0.08)',
                        borderColor: isOutgoing ? 'var(--color-border)' : 'rgba(99, 102, 241, 0.3)',
                        color: isOutgoing ? 'var(--color-text)' : '#a5b4fc'
                      }}
                    >
                      {displayPayload}
                      {isLong && (
                        <button
                          onClick={() => toggleExpand(idx)}
                          className="mt-2 block text-xs font-bold text-[var(--color-primary)] underline cursor-pointer"
                        >
                          {isExpanded ? 'Collapse Payload' : `Show Full Payload (${(rawPayload.length / 1024).toFixed(1)} KB)`}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {visibleCount < filteredDialog.length && (
                <div className="pt-2 text-center pb-2">
                  <button
                    onClick={() => setVisibleCount(c => c + 60)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-primary)] hover:bg-[var(--color-primary-glow)] transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <ChevronDown size={14} /> Load Next 60 Payloads ({filteredDialog.length - visibleCount} remaining)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
      {/* ── TLS HOW-TO GUIDE MODAL ── */}
      {showTlsHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-xl p-6 rounded-2xl glass-card border border-emerald-500/40 bg-[var(--color-surface-solid)] space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Unlock size={18} className="text-emerald-400" />
                <h3 className="text-sm font-bold text-white">How to Generate SSLKEYLOGFILE for Decryption</h3>
              </div>
              <button 
                onClick={() => setShowTlsHelp(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Browsers and network clients can log per-session TLS Pre-Master Secrets (PMS). When you upload this key file alongside your PCAP, our engine decrypts all HTTPS, REST APIs, and WSS conversations into cleartext.
            </p>

            <div className="space-y-3 text-xs">
              {/* Option 1: Chrome / Edge / Brave */}
              <div className="p-3 rounded-xl bg-black/30 border border-white/10 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-300">1. Windows PowerShell (Chrome, Edge, Brave, Curl):</span>
                  <button 
                    onClick={() => handleCopyCommand('$env:SSLKEYLOGFILE = "$HOME\sslkeys.log"; Start-Process chrome')}
                    className="text-xs font-mono text-[var(--color-primary)] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copiedCmd ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />} Copy
                  </button>
                </div>
                <pre className="font-mono text-xs text-zinc-300 select-text p-2 rounded bg-black/40 overflow-x-auto">
                  $env:SSLKEYLOGFILE = "$HOME\sslkeys.log"; Start-Process chrome
                </pre>
              </div>

              {/* Option 2: Linux / macOS */}
              <div className="p-3 rounded-xl bg-black/30 border border-white/10 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-300">2. Linux / macOS Bash:</span>
                  <button 
                    onClick={() => handleCopyCommand('export SSLKEYLOGFILE="$HOME/sslkeys.log" && google-chrome &')}
                    className="text-xs font-mono text-[var(--color-primary)] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copiedCmd ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />} Copy
                  </button>
                </div>
                <pre className="font-mono text-xs text-zinc-300 select-text p-2 rounded bg-black/40 overflow-x-auto">
                  export SSLKEYLOGFILE="$HOME/sslkeys.log" && google-chrome &
                </pre>
              </div>

              {/* Option 3: Python / Node.js */}
              <div className="p-3 rounded-xl bg-black/30 border border-white/10 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-300">3. Python Script with Keylog:</span>
                  <button 
                    onClick={() => handleCopyCommand('import os; os.environ["SSLKEYLOGFILE"] = "sslkeys.log"')}
                    className="text-xs font-mono text-[var(--color-primary)] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copiedCmd ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />} Copy
                  </button>
                </div>
                <pre className="font-mono text-xs text-zinc-300 select-text p-2 rounded bg-black/40 overflow-x-auto">
                  import os; os.environ["SSLKEYLOGFILE"] = "sslkeys.log"
                </pre>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowTlsHelp(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 cursor-pointer"
              >
                Got It, Let's Decrypt
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}

/* ─────────────────────────────────────────────────────────────
   2. COMPARE PCAP SUB-VIEW
   ───────────────────────────────────────────────────────────── */
function ComparePcapView() {
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  async function handleCompare(e: React.FormEvent) {
    e.preventDefault();
    if (!file1 || !file2) {
      setError('Please select both sender (source) and receiver (altered) PCAP trace files.');
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file1', file1);
    formData.append('file2', file2);

    try {
      const res = await fetch(`${API_BASE_URL}/pcap/compare`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) {
        throw new Error(await res.text() || 'Dual capture comparison failed.');
      }
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Comparison failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleCompare} className="card p-3 sm:p-4 md:p-6 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--color-text)' }}>
          Dual PCAP MITM Tampering Differential Analyzer
        </h2>
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          Compare a client-side egress trace against a server-side ingress trace to detect man-in-the-middle packet injection, payload modifications, and dropped frames.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-dashed" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-2)' }}>
            <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Source PCAP (Client Egress)</label>
            <input 
              type="file" 
              accept=".pcap,.pcapng"
              onChange={e => setFile1(e.target.files?.[0] || null)}
              className="text-xs"
              style={{ color: 'var(--color-text-muted)' }}
            />
          </div>

          <div className="p-4 rounded-xl border border-dashed" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-2)' }}>
            <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Destination PCAP (Server Ingress)</label>
            <input 
              type="file" 
              accept=".pcap,.pcapng"
              onChange={e => setFile2(e.target.files?.[0] || null)}
              className="text-xs"
              style={{ color: 'var(--color-text-muted)' }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-1.5 px-4 py-2 min-h-[44px] sm:min-h-0 rounded-lg text-xs font-semibold w-full sm:w-auto"
          style={{ background: 'var(--color-accent)', color: 'white', border: 'none', cursor: 'pointer' }}
        >
          {loading ? <RefreshCw size={13} className="animate-spin" /> : <ArrowRightLeft size={13} />}
          {loading ? 'Analyzing Differences…' : 'Run Differential Analysis'}
        </button>

        {error && (
          <div className="p-3 rounded-lg text-xs flex gap-2" style={{ background: 'var(--sev-high-bg)', color: 'var(--sev-high)' }}>
            <AlertTriangle size={14} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </form>

      {result && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              { label: 'Total Packets (Trace A)', val: result.total_packets_file1 },
              { label: 'Total Packets (Trace B)', val: result.total_packets_file2 },
              { label: 'Tampered / Modified', val: result.tampered_count, color: result.tampered_count > 0 ? 'var(--sev-critical)' : '#10b981' },
              { label: 'Dropped / Missing', val: result.missing_in_file2_count, color: result.missing_in_file2_count > 0 ? 'var(--sev-high)' : '#10b981' },
            ].map((s, idx) => (
              <div key={idx} className="card p-3 sm:p-4 text-center">
                <p className="text-xl font-bold font-mono" style={{ color: s.color || 'var(--color-text)' }}>{s.val}</p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{s.label}</p>
              </div>
            ))}
          </div>

          {result.tampered_packets && result.tampered_packets.length > 0 && (
            <div className="card p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400">Tampered Packet Diffs</h3>
              <div className="space-y-2">
                {result.tampered_packets.map((p: any, i: number) => (
                  <div key={i} className="p-3 rounded-lg text-xs font-mono space-y-1" style={{ background: 'var(--color-surface-2)' }}>
                    <div className="flex justify-between">
                      <span className="font-bold">Seq #{p.frame_number}</span>
                      <span className="text-red-400">Payload Hash Mismatch</span>
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)]">
                      Original: <span className="font-mono text-emerald-400">{p.original_hash}</span>
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)]">
                      Altered: <span className="font-mono text-red-400">{p.altered_hash}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   3. ARTIFACT EXTRACTOR SUB-VIEW
   ───────────────────────────────────────────────────────────── */
function ArtifactExtractorView() {
  const { uploadedFilename, summary } = useTraceStore();
  const [captureId, setCaptureId] = useState(uploadedFilename || summary?.capture_id || '');
  const [artifacts, setArtifacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleExtract() {
    if (!captureId.trim()) {
      setError('Please provide a capture filename.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/pcap/extract-artifacts?capture_id=${encodeURIComponent(captureId.trim())}`);
      if (!res.ok) {
        throw new Error(await res.text() || 'Artifact extraction failed.');
      }
      const data = await res.json();
      setArtifacts(data.artifacts || []);
      if ((data.artifacts || []).length === 0) {
        setError('No artifacts (images, HTTP objects, credentials) found in this capture.');
      }
    } catch (err: any) {
      setError(err.message || 'Extraction failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-6 space-y-4">
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--color-text)' }}>
          PCAP Forensic Artifact & Object Extractor
        </h2>
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          Carve transmitted images, HTTP files, plaintext passwords, and authorization tokens directly out of packet streams.
        </p>
      </div>

      <div className="flex gap-2 max-w-md">
        <input
          type="text"
          value={captureId}
          onChange={e => setCaptureId(e.target.value)}
          placeholder="e.g. sample.pcap"
          className="flex-1 px-3 py-1.5 text-xs rounded-lg outline-none font-mono"
          style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
        />
        <button
          onClick={handleExtract}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold"
          style={{ background: 'var(--color-accent)', color: 'white', border: 'none', cursor: 'pointer' }}
        >
          {loading ? <RefreshCw size={13} className="animate-spin" /> : <FileCheck size={13} />}
          Extract
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg text-xs flex gap-2" style={{ background: 'var(--sev-high-bg)', color: 'var(--sev-high)' }}>
          <AlertTriangle size={14} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {artifacts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {artifacts.map((art, idx) => (
            <div key={idx} className="card p-3 space-y-2 border border-[var(--color-border-subtle)]" style={{ background: 'var(--color-surface-2)' }}>
              <div className="flex items-center gap-2">
                {art.type === 'image' ? <ImageIcon size={14} className="text-cyan-400" /> : <Key size={14} className="text-amber-400" />}
                <span className="font-bold text-xs capitalize">{art.type} Artifact</span>
              </div>
              <p className="text-xs font-mono text-[var(--color-text-primary)] break-all">{art.name || art.filename}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Source: {art.source_ip}</p>
              {art.data_snippet && (
                <div className="p-2 rounded bg-black/40 text-xs font-mono break-all text-emerald-400">
                  {art.data_snippet}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   4. FILE CARVER & EXTRACTED MEDIA SUB-VIEW (MODULE 4)
   ───────────────────────────────────────────────────────────── */
function FileCarverView() {
  const { uploadedFilename, summary } = useTraceStore();
  const [captureId, setCaptureId] = useState(uploadedFilename || summary?.capture_id || '');
  const [carvedFiles, setCarvedFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchCarvedFiles = async () => {
    if (!captureId.trim()) {
      setError('Please specify a valid PCAP capture.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/pcap/carved/${encodeURIComponent(captureId.trim())}`);
      if (!res.ok) {
        throw new Error(await res.text() || 'File carving failed on backend.');
      }
      const data = await res.json();
      setCarvedFiles(data.artifacts || []);
      if ((data.artifacts || []).length === 0) {
        setError('No carved files (PNG, JPEG, GIF, PDF, ZIP, ELF/EXE) identified in this stream.');
      }
    } catch (err: any) {
      setError(err.message || 'File carving failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (captureId) fetchCarvedFiles();
  }, [captureId]);

  return (
    <div className="card p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-primary)] flex items-center gap-2">
            <FileCode size={16} className="text-emerald-400" />
            Automated File Carving & Extraction Engine
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            Extracts images, documents, and archives directly out of TCP stream payloads using Foremost/Scalpel magic-byte signatures.
          </p>
        </div>

        <button
          onClick={fetchCarvedFiles}
          disabled={loading || !captureId.trim()}
          className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          {loading ? <RefreshCw size={13} className="animate-spin" /> : <FileCheck size={13} />}
          <span>Re-scan & Carve</span>
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex gap-2">
          <AlertTriangle size={14} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {carvedFiles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {carvedFiles.map((f, idx) => (
            <div 
              key={idx} 
              className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300">{f.file_type}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                  f.is_truncated ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                }`}>
                  {f.is_truncated ? 'PARTIAL / TRUNCATED' : 'COMPLETE'}
                </span>
              </div>

              <div className="space-y-1 text-xs font-mono text-[var(--color-text-muted)]">
                <div>Size: <strong className="text-white">{(f.file_size / 1024).toFixed(1)} KB</strong></div>
                <div>MD5: <span className="text-zinc-400 truncate block">{f.md5_hash}</span></div>
                <div>Stream: <strong className="text-cyan-400">Stream #{f.stream_id}</strong></div>
              </div>

              <a
                href={`${API_BASE_URL}/pcap/carved/download/${encodeURIComponent(f.filename)}`}
                download
                className="w-full py-2 rounded-lg text-xs font-bold text-center block bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download size={13} />
                <span>Download Inert Blob</span>
              </a>
            </div>
          ))}
        </div>
      ) : !loading && (
        <div className="p-8 text-center text-xs text-[var(--color-text-muted)]">
          No carved artifacts loaded. Select or upload a PCAP file above.
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   5. GEOIP & ASN WORLD THREAT MAP SUB-VIEW (MODULE 5)
   ───────────────────────────────────────────────────────────── */
function GeoThreatMapView() {
  const { uploadedFilename, summary } = useTraceStore();
  const [captureId, setCaptureId] = useState(uploadedFilename || summary?.capture_id || '');
  const [geoData, setGeoData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchGeoMap = async () => {
    if (!captureId.trim()) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/pcap/geomap/${encodeURIComponent(captureId.trim())}`);
      if (!res.ok) {
        throw new Error(await res.text() || 'Geo threat map resolution failed.');
      }
      const data = await res.json();
      setGeoData(data);
    } catch (err: any) {
      setError(err.message || 'Geo lookup failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (captureId) fetchGeoMap();
  }, [captureId]);

  return (
    <div className="card p-6 space-y-6">
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-primary)] flex items-center gap-2">
          <Globe size={16} className="text-cyan-400" />
          GeoIP & Autonomous System Number (ASN) Threat Map
        </h2>
        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
          Batch-resolved and de-duplicated geographic traffic distribution across countries, autonomous systems, and cities.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-[var(--color-text-muted)] flex flex-col items-center gap-2">
          <RefreshCw size={24} className="animate-spin text-cyan-400" />
          <span>Aggregating spatial flow coordinates...</span>
        </div>
      ) : geoData ? (
        <div className="space-y-6">
          {/* Metrics summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[var(--color-surface-2)] text-center">
              <div className="text-2xl font-bold font-mono text-cyan-400">{geoData.unique_ips_count}</div>
              <div className="text-xs text-[var(--color-text-muted)] uppercase font-bold">Unique Public & LAN IPs</div>
            </div>
            <div className="p-4 rounded-xl bg-[var(--color-surface-2)] text-center">
              <div className="text-2xl font-bold font-mono text-emerald-400">{geoData.country_distribution?.length || 0}</div>
              <div className="text-xs text-[var(--color-text-muted)] uppercase font-bold">Countries Detected</div>
            </div>
            <div className="p-4 rounded-xl bg-[var(--color-surface-2)] text-center">
              <div className="text-2xl font-bold font-mono text-purple-400">{geoData.arcs?.length || 0}</div>
              <div className="text-xs text-[var(--color-text-muted)] uppercase font-bold">Active Communication Arcs</div>
            </div>
            <div className="p-4 rounded-xl bg-[var(--color-surface-2)] text-center">
              <div className="text-2xl font-bold font-mono text-amber-400">{geoData.nodes?.length || 0}</div>
              <div className="text-xs text-[var(--color-text-muted)] uppercase font-bold">Geo-Pinned Nodes</div>
            </div>
          </div>

          {/* Country Distribution Table & Node Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                Top Communicating Countries
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {geoData.country_distribution?.map((c: any, idx: number) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-[var(--color-surface-2)] flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">{c.country}</span>
                    <span className="font-mono px-2 py-0.5 rounded bg-white/5 text-cyan-300 font-bold">{c.count} endpoints</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                Autonomous Systems & Organizations
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {geoData.nodes?.slice(0, 10).map((n: any, idx: number) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-[var(--color-surface-2)] space-y-1 text-xs">
                    <div className="flex justify-between font-mono">
                      <span className="font-bold text-emerald-300">{n.ip}</span>
                      <span className="text-zinc-400">{n.country}</span>
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)] truncate">
                      {n.asn} · {n.org}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   6. C2 BEACONING & JITTER DETECTOR SUB-VIEW (MODULE 6)
   ───────────────────────────────────────────────────────────── */
function BeaconingDetectorView() {
  const { uploadedFilename, summary } = useTraceStore();
  const [captureId, setCaptureId] = useState(uploadedFilename || summary?.capture_id || '');
  const [beaconData, setBeaconData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchBeaconing = async () => {
    if (!captureId.trim()) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/pcap/beaconing/${encodeURIComponent(captureId.trim())}`);
      if (!res.ok) {
        throw new Error(await res.text() || 'Beaconing analysis failed.');
      }
      const data = await res.json();
      setBeaconData(data);
    } catch (err: any) {
      setError(err.message || 'Beaconing analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (captureId) fetchBeaconing();
  }, [captureId]);

  return (
    <div className="card p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-primary)] flex items-center gap-2">
            <Activity size={16} className="text-rose-400" />
            C2 Beaconing & Periodic Jitter Detector
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            Extracts packet departure deltas and computes Coefficient of Variation (CV) to detect automated bot check-ins and C2 heartbeats.
          </p>
        </div>

        <button
          onClick={fetchBeaconing}
          disabled={loading || !captureId.trim()}
          className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          {loading ? <RefreshCw size={13} className="animate-spin" /> : <Activity size={13} />}
          <span>Analyze Intervals</span>
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-[var(--color-text-muted)] flex flex-col items-center gap-2">
          <RefreshCw size={24} className="animate-spin text-rose-400" />
          <span>Computing inter-arrival time deltas across flows...</span>
        </div>
      ) : beaconData ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-mono p-3 rounded-xl bg-[var(--color-surface-2)]">
            <span>Packets Analyzed: <strong className="text-white">{beaconData.total_packets_analyzed}</strong></span>
            <span>Beaconing Indicators: <strong className="text-rose-400">{beaconData.beaconing_indicators_count}</strong></span>
          </div>

          {beaconData.indicators?.length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--color-text-muted)]">
              No periodic beaconing patterns detected in this capture file.
            </div>
          ) : (
            <div className="space-y-3">
              {beaconData.indicators?.map((ind: any, idx: number) => (
                <div 
                  key={idx}
                  className="p-4 rounded-xl border border-rose-500/30 bg-rose-950/10 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        {ind.finding_label}
                      </span>
                      <span className="font-mono text-xs font-bold text-white">
                        {ind.src_ip} ➔ {ind.dst_ip}:{ind.dst_port}
                      </span>
                    </div>

                    <span className="text-xs font-mono text-emerald-400">
                      Periodicity: ~{ind.mean_interval_seconds}s (Jitter: {ind.jitter_percentage})
                    </span>
                  </div>

                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    {ind.explanation}
                  </p>

                  <div className="flex items-center gap-3 text-xs font-mono text-[var(--color-text-muted)] pt-1 border-t border-white/5">
                    <span>Packets: <strong className="text-white">{ind.packet_count}</strong></span>
                    <span>Std Dev: <strong className="text-white">{ind.std_deviation}s</strong></span>
                    <span>CV Score: <strong className="text-cyan-400">{ind.coefficient_of_variation}</strong></span>
                    <span>Confidence: <strong className="text-rose-400">{ind.periodicity_confidence}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}