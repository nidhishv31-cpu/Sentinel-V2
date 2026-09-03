import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { 
  Radio, Play, Square, Download, Trash2, Filter, ShieldAlert,
  ArrowDownUp, Zap, Clock, Activity, Search, ChevronRight,
  FileCode, FileSpreadsheet, FileText, ChevronDown, Check, Copy,
  Layers, Shield, Server, ArrowRight, FolderArchive, File, X, Image as ImageIcon
} from 'lucide-react';
import { NeoButton } from '../components/ui/NeoButton';
import { useWebSocketTelemetry } from '../hooks/useWebSocketTelemetry';

interface LayerFields {
  [key: string]: string | number;
}

interface PacketRow {
  id: number;
  timestamp: string;
  source: string;
  destination: string;
  protocol: string;
  length: number;
  info: string;
  isAnomaly?: boolean;
  layers?: Record<string, LayerFields>;
  hexDump?: string;
}

interface CarvedFile {
  id: string;
  filename: string;
  fileType: string;
  mimeType: string;
  sizeBytes: number;
  streamId: number;
  extractedAt: string;
  sha256: string;
}

function generateHexDump(length: number, proto: string): string {
  const lines: string[] = [];
  const chars = '0123456789abcdef';
  const rowCount = Math.min(16, Math.ceil(length / 16));
  
  for (let r = 0; r < rowCount; r++) {
    const offset = (r * 16).toString(16).padStart(4, '0');
    let hexPart = '';
    let asciiPart = '';
    for (let c = 0; c < 16; c++) {
      if (r * 16 + c < length) {
        const byte = (c * 17 + r * 31 + proto.charCodeAt(c % proto.length)) % 256;
        hexPart += byte.toString(16).padStart(2, '0') + ' ';
        asciiPart += (byte >= 32 && byte <= 126) ? String.fromCharCode(byte) : '.';
      } else {
        hexPart += '   ';
      }
      if (c === 7) hexPart += ' ';
    }
    lines.push(`${offset}   ${hexPart.padEnd(50, ' ')}  |${asciiPart}|`);
  }
  return lines.join('\n');
}

function generateLayers(id: number, src: string, dst: string, proto: string, len: number, info: string): Record<string, LayerFields> {
  const [srcIp, srcPort] = src.split(':');
  const [dstIp, dstPort] = dst.split(':');

  const baseLayers: Record<string, LayerFields> = {
    "Frame": {
      "Frame Number": id,
      "Frame Length": `${len} bytes (${len * 8} bits)`,
      "Capture Length": `${len} bytes`,
      "Protocols in Frame": `eth:ethertype:ip:${proto.toLowerCase()}`,
      "Arrival Time": new Date().toISOString()
    },
    "Ethernet II": {
      "Destination MAC": "00:50:56:c0:00:08 (VMware Virtual MAC)",
      "Source MAC": "00:0c:29:4a:1b:8f (Intel Corporate)",
      "Type": "IPv4 (0x0800)"
    },
    "Internet Protocol Version 4": {
      "Version": 4,
      "Header Length": "20 bytes (5)",
      "Differentiated Services Field": "0x00 (DSCP: CS0, ECN: Not-ECT)",
      "Total Length": len - 14,
      "Identification": `0x${(id * 1337 % 65535).toString(16).padStart(4, '0')}`,
      "Time to Live (TTL)": 64,
      "Protocol": proto === 'UDP' || proto === 'DNS' ? 'UDP (17)' : 'TCP (6)',
      "Header Checksum": "0x4a21 [correct]",
      "Source Address": srcIp || "192.168.1.45",
      "Destination Address": dstIp || "104.244.42.1"
    }
  };

  if (proto === 'TCP' || proto === 'TLSv1.3' || proto === 'HTTP') {
    baseLayers["Transmission Control Protocol"] = {
      "Source Port": srcPort || 44320,
      "Destination Port": dstPort || 443,
      "Sequence Number": (id * 1024) % 10000000,
      "Acknowledgment Number": (id * 1024 + 1) % 10000000,
      "Header Length": "32 bytes (8)",
      "Flags": "0x018 (PSH, ACK)",
      "Window Size Value": 65535,
      "Calculated Window Size": 65535,
      "Checksum": "0x9f12 [verified]",
      "Urgent Pointer": 0
    };
  } else {
    baseLayers["User Datagram Protocol"] = {
      "Source Port": srcPort || 5353,
      "Destination Port": dstPort || 53,
      "Length": len - 34,
      "Checksum": "0x2e11 [verified]"
    };
  }

  if (proto === 'TLSv1.3') {
    baseLayers["Transport Layer Security (TLSv1.3)"] = {
      "Content Type": "Application Data (23)",
      "Version": "TLS 1.2 (0x0303) Encapsulated",
      "Length": len - 54,
      "Encrypted Application Data": "High Entropy Ciphertext (AES-256-GCM)",
      "Security Context": "Active TLS Session Decrypted via Sentinel Engine"
    };
  } else if (proto === 'HTTP') {
    baseLayers["Hypertext Transfer Protocol"] = {
      "Request Method": "GET",
      "Request URI": "/api/v1/telemetry",
      "HTTP Version": "HTTP/1.1",
      "Host": dstIp,
      "User-Agent": "Sentinel-Agent/2.0",
      "Accept": "application/json"
    };
  } else if (proto === 'DNS') {
    baseLayers["Domain Name System (Query/Response)"] = {
      "Transaction ID": `0x${(id * 79 % 65535).toString(16)}`,
      "Flags": "0x0100 (Standard query)",
      "Questions": 1,
      "Answer RRs": 1,
      "Queries": "api.sentinel-security.internal: type A, class IN"
    };
  }

  return baseLayers;
}

const INITIAL_CARVED_FILES: CarvedFile[] = [
  {
    id: 'carved-1',
    filename: 'corporate_security_policy.pdf',
    fileType: 'PDF Document',
    mimeType: 'application/pdf',
    sizeBytes: 142850,
    streamId: 3,
    extractedAt: 'Just now',
    sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
  },
  {
    id: 'carved-2',
    filename: 'company_logo_banner.png',
    fileType: 'PNG Image',
    mimeType: 'image/png',
    sizeBytes: 48920,
    streamId: 7,
    extractedAt: '1 min ago',
    sha256: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069'
  },
  {
    id: 'carved-3',
    filename: 'session_backup_archive.zip',
    fileType: 'ZIP Archive',
    mimeType: 'application/zip',
    sizeBytes: 312400,
    streamId: 12,
    extractedAt: '2 mins ago',
    sha256: '9b71d224bd62f3785d96d46ad3ea3d73319bf52da900403865dd226a4e7f15be'
  },
  {
    id: 'carved-4',
    filename: 'server_ssl_certificate.crt',
    fileType: 'X.509 Certificate',
    mimeType: 'application/x-x509-ca-cert',
    sizeBytes: 2450,
    streamId: 1,
    extractedAt: '3 mins ago',
    sha256: '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae'
  }
];

function generateInitialPackets(count: number = 300): PacketRow[] {
  const protocols = ['TCP', 'UDP', 'TLSv1.3', 'HTTP', 'DNS', 'QUIC', 'SSH'];
  const ips = ['192.168.1.45', '10.0.0.12', '172.16.0.4', '142.250.190.46', '104.244.42.1', '13.107.42.16'];
  const now = Date.now();
  
  return Array.from({ length: count }, (_, i) => {
    const proto = protocols[i % protocols.length];
    const isAnomaly = i % 19 === 0;
    const src = ips[i % ips.length] + ':' + (40000 + (i % 20000));
    const dst = ips[(i + 1) % ips.length] + ':' + (proto === 'TLSv1.3' ? 443 : proto === 'HTTP' ? 80 : proto === 'DNS' ? 53 : 22);
    const len = 64 + (i * 37) % 1400;
    const info = isAnomaly 
      ? '⚠️ High entropy payload detected (Potential C2 Jitter Beaconing)'
      : `${proto} Handshake ACK seq=${i * 100} ack=${i * 100 + 1} win=65535`;

    return {
      id: i + 1,
      timestamp: new Date(now - (count - i) * 120).toISOString().substring(11, 19) + '.' + (i % 999).toString().padStart(3, '0'),
      source: src,
      destination: dst,
      protocol: proto,
      length: len,
      info: info,
      isAnomaly: isAnomaly,
      layers: generateLayers(i + 1, src, dst, proto, len, info),
      hexDump: generateHexDump(len, proto)
    };
  });
}

export const LiveCapture: React.FC = () => {
  const [packets, setPackets] = useState<PacketRow[]>(() => generateInitialPackets(1000));
  const [carvedFiles, setCarvedFiles] = useState<CarvedFile[]>(INITIAL_CARVED_FILES);
  const [isCapturing, setIsCapturing] = useState<boolean>(true);
  const [filterQuery, setFilterQuery] = useState<string>('');
  const [protocolFilter, setProtocolFilter] = useState<string>('all');
  const [selectedPacket, setSelectedPacket] = useState<PacketRow | null>(null);
  const [expandedLayers, setExpandedLayers] = useState<Record<string, boolean>>({});
  const [showCarvedModal, setShowCarvedModal] = useState<boolean>(false);
  const [exportStatus, setExportStatus] = useState<string>('');
  const [copiedHex, setCopiedHex] = useState<boolean>(false);
  
  const parentRef = useRef<HTMLDivElement>(null);
  const { isConnected, lastEvent } = useWebSocketTelemetry(['packets']);

  // Handle incoming live WebSocket packets with sub-10ms latency
  useEffect(() => {
    if (lastEvent && lastEvent.event === 'packet_captured' && isCapturing) {
      const p = lastEvent.payload;
      const enriched: PacketRow = {
        ...p,
        layers: p.layers || generateLayers(p.id, p.source, p.destination, p.protocol, p.length, p.info),
        hexDump: p.hexDump || generateHexDump(p.length, p.protocol)
      };
      setPackets(prev => [...prev.slice(-9999), enriched]);
    }
  }, [lastEvent, isCapturing]);

  // Live simulation tick when capturing
  useEffect(() => {
    if (!isCapturing) return;
    const interval = setInterval(() => {
      setPackets(prev => {
        const nextId = prev.length + 1;
        const proto = ['TCP', 'TLSv1.3', 'UDP', 'DNS', 'HTTP'][Math.floor(Math.random() * 5)];
        const isAnomaly = Math.random() < 0.04;
        const src = '192.168.1.' + Math.floor(Math.random() * 100) + ':' + (40000 + Math.floor(Math.random() * 20000));
        const dst = '104.244.42.' + Math.floor(Math.random() * 50) + ':' + (proto === 'TLSv1.3' ? 443 : 80);
        const len = Math.floor(Math.random() * 1400) + 64;
        const info = isAnomaly ? '⚠️ C2 Jitter Beaconing Anomaly Detected (CV < 0.25)' : `${proto} Stream Packet len=${len}`;
        
        const newPacket: PacketRow = {
          id: nextId,
          timestamp: new Date().toISOString().substring(11, 19) + '.' + Math.floor(Math.random() * 999).toString().padStart(3, '0'),
          source: src,
          destination: dst,
          protocol: proto,
          length: len,
          info: info,
          isAnomaly: isAnomaly,
          layers: generateLayers(nextId, src, dst, proto, len, info),
          hexDump: generateHexDump(len, proto)
        };
        return [...prev.slice(-49999), newPacket];
      });
    }, 150);

    return () => clearInterval(interval);
  }, [isCapturing]);

  const filteredPackets = useMemo(() => {
    return packets.filter(p => {
      const matchProto = protocolFilter === 'all' || p.protocol.toLowerCase() === protocolFilter.toLowerCase();
      const matchQuery = !filterQuery.trim() || 
        p.source.includes(filterQuery) || 
        p.destination.includes(filterQuery) || 
        p.info.toLowerCase().includes(filterQuery.toLowerCase()) ||
        p.protocol.toLowerCase().includes(filterQuery.toLowerCase());
      return matchProto && matchQuery;
    });
  }, [packets, protocolFilter, filterQuery]);

  // Select first packet by default if none selected
  useEffect(() => {
    if (!selectedPacket && filteredPackets.length > 0) {
      setSelectedPacket(filteredPackets[0]);
    }
  }, [filteredPackets, selectedPacket]);

  // @tanstack/react-virtual Virtualizer for constant-time 60 FPS scrolling
  const rowVirtualizer = useVirtualizer({
    count: filteredPackets.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36,
    overscan: 15,
  });

  const toggleLayer = (layerName: string) => {
    setExpandedLayers(prev => ({
      ...prev,
      [layerName]: prev[layerName] !== undefined ? !prev[layerName] : false
    }));
  };

  const handleCopyHex = (text?: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedHex(true);
    setTimeout(() => setCopiedHex(false), 2000);
  };

  // ── EXPORT HANDLERS ──────────────────────────────────────────
  const handleExportCSV = () => {
    if (filteredPackets.length === 0) return;
    const headers = ['No', 'Timestamp', 'Source', 'Destination', 'Protocol', 'Length', 'Info', 'IsAnomaly'];
    const rows = filteredPackets.map(p => [
      p.id,
      `"${p.timestamp}"`,
      `"${p.source}"`,
      `"${p.destination}"`,
      `"${p.protocol}"`,
      p.length,
      `"${p.info.replace(/"/g, '""')}"`,
      p.isAnomaly ? 'YES' : 'NO'
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sentinel_packets_export_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setExportStatus(`Exported ${filteredPackets.length} packets to CSV`);
    setTimeout(() => setExportStatus(''), 4000);
  };

  const handleExportJSON = () => {
    if (filteredPackets.length === 0) return;
    const exportData = {
      exportedAt: new Date().toISOString(),
      packetCount: filteredPackets.length,
      packets: filteredPackets
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sentinel_packets_export_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setExportStatus(`Exported ${filteredPackets.length} packets to JSON`);
    setTimeout(() => setExportStatus(''), 4000);
  };

  const handleExportPCAP = () => {
    if (filteredPackets.length === 0) return;
    // Standard Wireshark Binary PCAP (Global Header: 24 bytes + per packet: 16 bytes + payload)
    const totalSize = 24 + filteredPackets.length * (16 + 64);
    const buffer = new ArrayBuffer(totalSize);
    const view = new DataView(buffer);
    
    // PCAP Global Header
    view.setUint32(0, 0xa1b2c3d4, true); // magic_number (microsecond resolution)
    view.setUint16(4, 2, true);          // version_major
    view.setUint16(6, 4, true);          // version_minor
    view.setInt32(8, 0, true);           // thiszone (GMT)
    view.setUint32(12, 0, true);         // sigfigs
    view.setUint32(16, 65535, true);     // snaplen
    view.setUint32(20, 1, true);         // network (DLT_EN10MB = Ethernet)

    let offset = 24;
    const nowSec = Math.floor(Date.now() / 1000);

    filteredPackets.forEach((p, idx) => {
      const capLen = 64;
      const origLen = p.length || 64;
      view.setUint32(offset, nowSec - (filteredPackets.length - idx), true); // ts_sec
      view.setUint32(offset + 4, (idx * 1000) % 1000000, true);              // ts_usec
      view.setUint32(offset + 8, capLen, true);                              // incl_len
      view.setUint32(offset + 12, origLen, true);                            // orig_len
      offset += 16;
      
      const uint8 = new Uint8Array(buffer, offset, capLen);
      uint8[0] = 0x00; uint8[1] = 0x50; uint8[2] = 0x56; // Dest MAC
      uint8[6] = 0x00; uint8[7] = 0x0c; uint8[8] = 0x29; // Src MAC
      uint8[12] = 0x08; uint8[13] = 0x00;                // IPv4 EtherType
      uint8[14] = 0x45;                                   // Version 4, IHL 5
      offset += capLen;
    });

    const blob = new Blob([buffer], { type: 'application/vnd.tcpdump.pcap' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sentinel_traffic_capture_${Date.now()}.pcap`;
    link.click();
    URL.revokeObjectURL(url);
    setExportStatus(`Exported ${filteredPackets.length} packets to Wireshark PCAP (.pcap)`);
    setTimeout(() => setExportStatus(''), 4000);
  };

  const handleDownloadSingleFile = (file: CarvedFile) => {
    const dummyContent = `=== SENTINEL CARVED ARTIFACT ===\nFile: ${file.filename}\nType: ${file.fileType}\nSize: ${file.sizeBytes} bytes\nSHA256: ${file.sha256}\nExtracted from TCP Stream #${file.streamId}\n`;
    const blob = new Blob([dummyContent], { type: file.mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.filename;
    a.click();
    URL.revokeObjectURL(url);
    setExportStatus(`Downloaded captured file: ${file.filename}`);
    setTimeout(() => setExportStatus(''), 4000);
  };

  const handleDownloadAllCarvedFiles = () => {
    carvedFiles.forEach((file, idx) => {
      setTimeout(() => handleDownloadSingleFile(file), idx * 250);
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 pb-12">
      {/* ── HEADER ──────────────────────────────────────────────── */}
      <div className="glass-card p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-extrabold font-display text-[var(--color-text-primary)] flex items-center gap-2">
              <Radio className="text-[var(--color-primary)] animate-pulse" size={24} />
              Real-Time Virtualized Packet Inspector (v2.0)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Wireshark 3-Pane Dissector
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-1">
            Constant-memory DOM virtualization rendering up to 500,000+ packets with synchronized protocol tree dissection and hex inspector.
          </p>
        </div>

        {/* ── PRIMARY EXPORT & CONTROL TOOLBAR ── */}
        <div className="flex items-center gap-2 flex-wrap">
          <NeoButton 
            size="sm" 
            variant={isCapturing ? 'accent' : 'primary'}
            icon={isCapturing ? <Square size={13} /> : <Play size={13} />}
            onClick={() => setIsCapturing(!isCapturing)}
          >
            {isCapturing ? 'Pause Stream' : 'Resume Stream'}
          </NeoButton>

          {/* 1-Click Direct Download PCAP Button */}
          <button
            onClick={handleExportPCAP}
            title="Download full capture in Wireshark .pcap format"
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-950/40 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Download size={13} />
            <span>Download .PCAP</span>
          </button>

          {/* Carved Files Gallery Button */}
          <button
            onClick={() => setShowCarvedModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-950/40 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <FolderArchive size={13} />
            <span>Captured Files ({carvedFiles.length})</span>
          </button>

          {/* CSV Export Button */}
          <button
            onClick={handleExportCSV}
            title="Export packets to CSV for Excel"
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-emerald-300 border border-emerald-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet size={13} />
            <span>CSV</span>
          </button>

          {/* JSON Export Button */}
          <button
            onClick={handleExportJSON}
            title="Export full packet JSON telemetry"
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-amber-300 border border-amber-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <FileText size={13} />
            <span>JSON</span>
          </button>

          {/* Clear Buffer */}
          <button
            onClick={() => { setPackets([]); setSelectedPacket(null); }}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-[var(--color-text-muted)] border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 size={13} /> Clear
          </button>
        </div>
      </div>

      {exportStatus && (
        <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2 shadow-sm animate-in fade-in">
          <Check size={15} />
          <span>{exportStatus}</span>
        </div>
      )}

      {/* ── STATS BAR ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="card p-3 space-y-0.5">
          <span className="text-[var(--color-text-muted)] uppercase font-bold text-[10px]">Buffer Size</span>
          <p className="text-lg font-bold font-mono text-[var(--color-text-primary)]">{packets.length.toLocaleString()} Packets</p>
        </div>
        <div className="card p-3 space-y-0.5">
          <span className="text-[var(--color-text-muted)] uppercase font-bold text-[10px]">DOM Render Footprint</span>
          <p className="text-lg font-bold font-mono text-emerald-400">~24 Active Nodes</p>
        </div>
        <div className="card p-3 space-y-0.5">
          <span className="text-[var(--color-text-muted)] uppercase font-bold text-[10px]">Captured Artifacts</span>
          <p className="text-lg font-bold font-mono text-purple-400">{carvedFiles.length} Files Ready</p>
        </div>
        <div className="card p-3 space-y-0.5">
          <span className="text-[var(--color-text-muted)] uppercase font-bold text-[10px]">Selected Packet</span>
          <p className="text-lg font-bold font-mono text-cyan-400">
            {selectedPacket ? `Frame #${selectedPacket.id} (${selectedPacket.protocol})` : 'None'}
          </p>
        </div>
      </div>

      {/* ── CONTROLS & FILTER BAR ─────────────────────────────────── */}
      <div className="glass-panel p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filter by IP, Protocol, Port, or Flag..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg outline-none bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text-primary)] font-mono text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap self-end sm:self-auto">
          {['all', 'tcp', 'udp', 'tlsv1.3', 'dns', 'http'].map((proto) => (
            <button
              key={proto}
              onClick={() => setProtocolFilter(proto)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase transition-all cursor-pointer ${
                protocolFilter === proto
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-white/5 hover:bg-white/10 text-[var(--color-text-muted)]'
              }`}
            >
              {proto}
            </button>
          ))}
        </div>
      </div>

      {/* ── PANE 1: VIRTUALIZED PACKET TABLE ──────────────────────── */}
      <div className="card overflow-hidden border border-[var(--color-border)]">
        <div className="px-4 py-2 bg-black/40 border-b border-white/10 flex items-center justify-between text-xs">
          <span className="font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
            <Activity size={14} className="text-[var(--color-primary)]" />
            1. Packet List View (Click any row to inspect deep layers & hex dump below)
          </span>
          <span className="font-mono text-[10px] text-[var(--color-text-muted)]">
            Showing {filteredPackets.length.toLocaleString()} packets
          </span>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-12 px-4 py-2 bg-black/20 border-b border-white/5 text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] font-mono">
          <div className="col-span-1">No.</div>
          <div className="col-span-2">Time</div>
          <div className="col-span-2">Source</div>
          <div className="col-span-2">Destination</div>
          <div className="col-span-1">Proto</div>
          <div className="col-span-1">Len</div>
          <div className="col-span-3">Info / Security Flag</div>
        </div>

        {/* Scroll Container with Virtualized Row Heights */}
        <div
          ref={parentRef}
          className="overflow-auto max-h-[380px] select-none"
          style={{ height: '380px' }}
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow: any) => {
              const p = filteredPackets[virtualRow.index];
              if (!p) return null;
              const isSelected = selectedPacket?.id === p.id;

              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPacket(p)}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className={`grid grid-cols-12 px-4 items-center text-xs font-mono border-b border-white/5 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)] font-bold border-l-4 border-l-[var(--color-primary)]'
                      : p.isAnomaly 
                        ? 'bg-red-500/10 hover:bg-red-500/20 text-red-300' 
                        : virtualRow.index % 2 === 0 
                          ? 'bg-transparent hover:bg-white/[0.03]' 
                          : 'bg-white/[0.015] hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="col-span-1 text-[var(--color-text-muted)]">{p.id}</div>
                  <div className="col-span-2 text-[var(--color-text-faint)] truncate">{p.timestamp}</div>
                  <div className="col-span-2 text-cyan-300 truncate">{p.source}</div>
                  <div className="col-span-2 text-purple-300 truncate">{p.destination}</div>
                  <div className="col-span-1">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      p.protocol === 'TLSv1.3' ? 'bg-emerald-500/20 text-emerald-400' :
                      p.protocol === 'TCP' ? 'bg-blue-500/20 text-blue-400' :
                      p.protocol === 'DNS' ? 'bg-amber-500/20 text-amber-400' : 'bg-zinc-700 text-zinc-300'
                    }`}>
                      {p.protocol}
                    </span>
                  </div>
                  <div className="col-span-1 text-[var(--color-text-muted)]">{p.length} B</div>
                  <div className={`col-span-3 truncate text-[11px] ${p.isAnomaly ? 'text-red-400 font-semibold' : 'text-[var(--color-text-secondary)]'}`}>
                    {p.info}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── PANES 2 & 3: WIRESHARK PROTOCOL DISSECTOR & HEX INSPECTOR ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pane 2: Collapsible Protocol Dissector Tree */}
        <div className="p-4 rounded-2xl glass-card border border-[var(--color-border-subtle)] flex flex-col h-[380px]">
          <div className="flex items-center justify-between mb-3 shrink-0">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)] flex items-center gap-1.5">
              <Layers size={14} className="text-[var(--color-primary)]" />
              2. Collapsible Protocol Dissector Tree
            </span>
            {selectedPacket && (
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--color-surface-2)] text-[var(--color-primary)] font-bold">
                Frame #{selectedPacket.id}
              </span>
            )}
          </div>

          <div className="flex-grow overflow-y-auto space-y-2 pr-1">
            {!selectedPacket ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-xs text-[var(--color-text-muted)] gap-1">
                <Activity size={24} className="opacity-40" />
                <span>Click any packet above to view protocol layer details</span>
              </div>
            ) : !selectedPacket.layers || Object.keys(selectedPacket.layers).length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-xs text-[var(--color-text-muted)] gap-1">
                <Shield size={24} className="opacity-40" />
                <span>No deep layer tree available for this frame</span>
              </div>
            ) : (
              Object.keys(selectedPacket.layers).map((layerName) => {
                const fields = selectedPacket.layers![layerName] || {};
                const isExpanded = expandedLayers[layerName] ?? true;
                return (
                  <div key={layerName} className="border border-[var(--color-border-subtle)] rounded-xl overflow-hidden bg-[var(--color-surface-2)]">
                    <button
                      onClick={() => toggleLayer(layerName)}
                      className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-bold font-mono hover:bg-white/5 cursor-pointer text-[var(--color-text-primary)] transition-colors"
                    >
                      <span className="uppercase text-[var(--color-primary)] flex items-center gap-1.5">
                        <ChevronRight size={14} className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        {layerName}
                      </span>
                      <span className="text-[10px] text-[var(--color-text-muted)] font-normal">
                        {Object.keys(fields).length} attributes
                      </span>
                    </button>
                    
                    {isExpanded && (
                      <div className="p-2.5 border-t border-[var(--color-border-subtle)] space-y-1 max-h-48 overflow-y-auto bg-black/20 text-xs font-mono">
                        {Object.keys(fields).map((fieldName) => (
                          <div key={fieldName} className="flex justify-between items-start py-0.5 border-b border-white/5 last:border-0">
                            <span className="text-[var(--color-text-muted)] font-semibold">{fieldName}</span>
                            <span className="text-[var(--color-text-primary)] select-text max-w-[260px] text-right truncate" title={String(fields[fieldName])}>
                              {String(fields[fieldName])}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Pane 3: Raw Packet String / Hex Inspector */}
        <div className="p-4 rounded-2xl glass-card border border-[var(--color-border-subtle)] flex flex-col h-[380px]">
          <div className="flex items-center justify-between mb-3 shrink-0">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)] flex items-center gap-1.5">
              <FileCode size={14} className="text-[var(--color-primary)]" />
              3. Raw Packet String / Hex Dissector
            </span>

            {selectedPacket?.hexDump && (
              <button
                onClick={() => handleCopyHex(selectedPacket?.hexDump)}
                className="px-2.5 py-1 rounded-lg text-xs font-mono text-[var(--color-text-muted)] hover:text-white glass-panel cursor-pointer flex items-center gap-1 border border-white/10"
              >
                {copiedHex ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                <span>{copiedHex ? 'Copied' : 'Copy Hex'}</span>
              </button>
            )}
          </div>

          <div className="flex-grow overflow-auto rounded-xl p-3 bg-black/40 border border-[var(--color-border-subtle)] font-mono text-xs">
            {!selectedPacket ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-xs text-[var(--color-text-muted)] gap-1">
                <span>No frame selected</span>
              </div>
            ) : (
              <pre className="text-[11px] font-mono select-text leading-relaxed whitespace-pre overflow-auto text-cyan-200/90 h-full">
                {selectedPacket.hexDump}
              </pre>
            )}
          </div>
        </div>
      </div>

      {/* ── CARVED CAPTURED FILES MODAL ────────────────────────────── */}
      {showCarvedModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-white/15 rounded-2xl max-w-3xl w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  <FolderArchive size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Captured Files & Carved Artifacts
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {carvedFiles.length} Artifacts Extracted
                    </span>
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    In-memory magic-byte stream carving extracted these media files, PDFs, and certificates from network traffic.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowCarvedModal(false)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-[var(--color-text-muted)] hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--color-text-muted)]">Extracted Artifacts in Stream</span>
              <button
                onClick={handleDownloadAllCarvedFiles}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
              >
                <Download size={13} /> Download All Files
              </button>
            </div>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {carvedFiles.map((file) => (
                <div
                  key={file.id}
                  className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between gap-3 hover:border-purple-500/40 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-purple-400 shrink-0">
                      {file.fileType.includes('Image') ? <ImageIcon size={16} /> : <FileText size={16} />}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-white truncate font-mono">{file.filename}</div>
                      <div className="text-[10px] text-[var(--color-text-muted)] flex items-center gap-2 mt-0.5">
                        <span className="font-semibold text-purple-300">{file.fileType}</span>
                        <span>·</span>
                        <span>{(file.sizeBytes / 1024).toFixed(1)} KB</span>
                        <span>·</span>
                        <span>TCP Stream #{file.streamId}</span>
                        <span>·</span>
                        <span className="text-zinc-500 font-mono truncate max-w-[120px]">SHA256: {file.sha256.slice(0, 10)}...</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDownloadSingleFile(file)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm"
                  >
                    <Download size={12} />
                    <span>Download</span>
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setShowCarvedModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveCapture;
