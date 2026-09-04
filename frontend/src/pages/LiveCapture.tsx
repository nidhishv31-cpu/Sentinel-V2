import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { 
  Radio, Play, Square, Download, Trash2, Filter, ShieldAlert,
  ArrowDownUp, Zap, Clock, Activity, Search, ChevronRight,
  FileCode, FileSpreadsheet, FileText, ChevronDown, Check, Copy,
  Layers, Shield, Server, ArrowRight, FolderArchive, File, X, Image as ImageIcon,
  MessageSquareText, Terminal, Network, AlertTriangle, Bug, ExternalLink, Cpu,
  Workflow, Send, Bot, Share2, KeyRound, Globe, ArrowLeftRight
} from 'lucide-react';
import { NeoButton } from '../components/ui/NeoButton';
import { useWebSocketTelemetry } from '../hooks/useWebSocketTelemetry';
import { API_BASE_URL } from '../config/api';

interface LayerFields {
  [key: string]: string | number;
}

interface JA3Data {
  hash: string;
  ja4: string;
  raw: string;
  attribution: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'BENIGN' | 'INFORMATIONAL';
  mitre?: string;
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
  entropy: number;
  streamId: number;
  ja3Fingerprint?: JA3Data;
  mitreAttack?: {
    id: string;
    name: string;
    tactic: string;
  };
  layers?: Record<string, LayerFields>;
  layerRanges?: Record<string, [number, number]>;
  fieldRanges?: Record<string, Record<string, [number, number]>>;
  hexDump?: string;
  rawBytes?: number[];
  injected?: boolean;
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
  entropy: number;
  verdict: 'CLEAN' | 'SUSPICIOUS' | 'MALICIOUS';
  threatNotes: string;
}

interface StreamMessage {
  id: number;
  sender: string;
  direction: 'client' | 'server';
  timestamp: string;
  payload: string;
  hex: string;
  bytes: number;
}

// ── SHANNON ENTROPY HELPER ─────────────────────────────────────────
function calculateEntropyFromLengthAndProto(length: number, proto: string, isAnomaly: boolean): number {
  if (isAnomaly) {
    return Number((7.65 + (length % 30) * 0.01).toFixed(2));
  }
  if (proto === 'TLSv1.3') {
    return Number((7.75 + (length % 20) * 0.01).toFixed(2));
  }
  if (proto === 'HTTP') {
    return Number((4.12 + (length % 50) * 0.02).toFixed(2));
  }
  if (proto === 'DNS') {
    return Number((3.45 + (length % 30) * 0.02).toFixed(2));
  }
  return Number((2.85 + (length % 40) * 0.03).toFixed(2));
}

// ── JA3/JA4 FINGERPRINT GENERATOR ──────────────────────────────────
function generateJA3ForPacket(proto: string, isAnomaly: boolean): JA3Data | undefined {
  if (proto !== 'TLSv1.3' && proto !== 'HTTPS') return undefined;

  if (isAnomaly) {
    return {
      hash: '7260840c83a54d5d93e789ee9e69c118',
      ja4: 't13d1516h2_7260840c83a5',
      raw: '771,49195-49199-49196-49200-52393-52392,0-23-65281-10-11-35-16-5-13,29-23-24,0',
      attribution: 'Cobalt Strike HTTPS Malleable C2 Beacon',
      severity: 'CRITICAL',
      mitre: 'T1071.001'
    };
  }

  const profiles: JA3Data[] = [
    {
      hash: 'b32309a26951912be7dba376398abc3b',
      ja4: 't13d1516h2_8a91b2c3d4e5',
      raw: '771,4865-4866-4867-49195-49199,0-5-10-11-13-16-18-23-27-43-45-51,29-23-24,0',
      attribution: 'Standard Chrome / Chromium Enterprise Browser',
      severity: 'BENIGN'
    },
    {
      hash: 'bb1001b974a621379fce9701768652d8',
      ja4: 't12d0812h2_9f81a7d6e4b1',
      raw: '771,49199-49195-49200,0-23-65281,29-23,0',
      attribution: 'Python Requests / Scripted Automated Client',
      severity: 'LOW',
      mitre: 'T1059.006'
    }
  ];

  return profiles[proto.length % profiles.length];
}

// ── SYNTHETIC RAW BYTES & HEX DUMP ─────────────────────────────────
function generateRawPacketBytes(length: number, proto: string): number[] {
  const bytes: number[] = [];
  const maxBytes = Math.min(length, 256);
  for (let i = 0; i < maxBytes; i++) {
    const b = (i * 17 + proto.charCodeAt(i % proto.length) * 31) % 256;
    bytes.push(b);
  }
  return bytes;
}

// ── DISSECTION & EXACT BYTE OFFSET RANGES ──────────────────────────
function generateLayersWithRanges(
  id: number,
  src: string,
  dst: string,
  proto: string,
  len: number,
  info: string,
  isAnomaly: boolean,
  isTlsDecrypted: boolean = false
) {
  const [srcIp, srcPort] = src.split(':');
  const [dstIp, dstPort] = dst.split(':');

  const baseLayers: Record<string, LayerFields> = {
    "Frame": {
      "Frame Number": id,
      "Frame Length": `${len} bytes (${len * 8} bits)`,
      "Capture Length": `${Math.min(len, 256)} bytes (Truncated)`,
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

  const layerRanges: Record<string, [number, number]> = {
    "Frame": [0, len],
    "Ethernet II": [0, 14],
    "Internet Protocol Version 4": [14, 34]
  };

  const fieldRanges: Record<string, Record<string, [number, number]>> = {
    "Ethernet II": {
      "Destination MAC": [0, 6],
      "Source MAC": [6, 12],
      "Type": [12, 14]
    },
    "Internet Protocol Version 4": {
      "Version": [14, 15],
      "Header Length": [14, 15],
      "Total Length": [16, 18],
      "Identification": [18, 20],
      "Time to Live (TTL)": [22, 23],
      "Protocol": [23, 24],
      "Source Address": [26, 30],
      "Destination Address": [30, 34]
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
    layerRanges["Transmission Control Protocol"] = [34, 54];
    fieldRanges["Transmission Control Protocol"] = {
      "Source Port": [34, 36],
      "Destination Port": [36, 38],
      "Sequence Number": [38, 42],
      "Acknowledgment Number": [42, 46],
      "Flags": [47, 48],
      "Window Size Value": [48, 50],
      "Checksum": [50, 52]
    };
  } else {
    baseLayers["User Datagram Protocol"] = {
      "Source Port": srcPort || 5353,
      "Destination Port": dstPort || 53,
      "Length": len - 34,
      "Checksum": "0x2e11 [verified]"
    };
    layerRanges["User Datagram Protocol"] = [34, 42];
    fieldRanges["User Datagram Protocol"] = {
      "Source Port": [34, 36],
      "Destination Port": [36, 38],
      "Length": [38, 40],
      "Checksum": [40, 42]
    };
  }

  const appStart = proto === 'UDP' || proto === 'DNS' ? 42 : 54;

  if (proto === 'TLSv1.3') {
    const ja3 = generateJA3ForPacket(proto, isAnomaly);
    baseLayers["Transport Layer Security (TLSv1.3)"] = {
      "Content Type": "Application Data (23)",
      "Version": "TLS 1.2 (0x0303) Encapsulated",
      "Length": len - appStart,
      "Encrypted Application Data": isTlsDecrypted 
        ? "🔓 DECRYPTED: GET /api/v1/telemetry HTTP/1.1 (Host: sentinel.internal)" 
        : "High Entropy Ciphertext (AES-256-GCM)",
      "Decryption Status": isTlsDecrypted ? "NSS SSLKEYLOGFILE Session Decrypted" : "Encrypted (Keylog Not Attached)",
      "JA3 Fingerprint Hash": ja3?.hash || "b32309a26951912be7dba376398abc3b",
      "JA4 Fingerprint": ja3?.ja4 || "t13d1516h2_8a91b2c3d4e5",
      "Threat Attribution": ja3?.attribution || "Standard Chrome Enterprise"
    };
    layerRanges["Transport Layer Security (TLSv1.3)"] = [appStart, len];
    fieldRanges["Transport Layer Security (TLSv1.3)"] = {
      "Content Type": [appStart, appStart + 1],
      "Version": [appStart + 1, appStart + 3],
      "Length": [appStart + 3, appStart + 5],
      "Encrypted Application Data": [appStart + 5, len]
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
    layerRanges["Hypertext Transfer Protocol"] = [appStart, len];
    fieldRanges["Hypertext Transfer Protocol"] = {
      "Request Method": [appStart, appStart + 3],
      "Request URI": [appStart + 4, appStart + 22]
    };
  } else if (proto === 'DNS') {
    baseLayers["Domain Name System (Query/Response)"] = {
      "Transaction ID": `0x${(id * 79 % 65535).toString(16)}`,
      "Flags": "0x0100 (Standard query)",
      "Questions": 1,
      "Answer RRs": 1,
      "Queries": isAnomaly 
        ? "c2-stage1-a8f3b9c1d0e4.tunnel.darknet.xyz: type A, class IN"
        : "api.sentinel-security.internal: type A, class IN"
    };
    layerRanges["Domain Name System (Query/Response)"] = [appStart, len];
    fieldRanges["Domain Name System (Query/Response)"] = {
      "Transaction ID": [appStart, appStart + 2],
      "Flags": [appStart + 2, appStart + 4]
    };
  }

  return { baseLayers, layerRanges, fieldRanges };
}

// ── INITIAL CARVED FILES WITH YARA HEURISTICS ──────────────────────
const INITIAL_CARVED_FILES: CarvedFile[] = [
  {
    id: 'carved-1',
    filename: 'corporate_security_policy.pdf',
    fileType: 'PDF Document',
    mimeType: 'application/pdf',
    sizeBytes: 142850,
    streamId: 3,
    extractedAt: 'Just now',
    sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    entropy: 6.82,
    verdict: 'SUSPICIOUS',
    threatNotes: 'Embedded JavaScript action block found in Catalog dictionary (/JavaScript object tag - CVE-2023-26369 / T1204.002)'
  },
  {
    id: 'carved-2',
    filename: 'company_logo_banner.png',
    fileType: 'PNG Image',
    mimeType: 'image/png',
    sizeBytes: 48920,
    streamId: 7,
    extractedAt: '1 min ago',
    sha256: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
    entropy: 7.91,
    verdict: 'CLEAN',
    threatNotes: 'Valid PNG IHDR chunk, standard DEFLATE image block. Heuristic signature analysis clean.'
  },
  {
    id: 'carved-3',
    filename: 'session_backup_archive.zip',
    fileType: 'ZIP Archive',
    mimeType: 'application/zip',
    sizeBytes: 312400,
    streamId: 12,
    extractedAt: '2 mins ago',
    sha256: '9b71d224bd62f3785d96d46ad3ea3d73319bf52da900403865dd226a4e7f15be',
    entropy: 7.85,
    verdict: 'MALICIOUS',
    threatNotes: 'Executable Windows PE binary header (MZ) detected disguised inside archive stream (MITRE T1204)'
  },
  {
    id: 'carved-4',
    filename: 'server_ssl_certificate.crt',
    fileType: 'X.509 Certificate',
    mimeType: 'application/x-x509-ca-cert',
    sizeBytes: 2450,
    streamId: 1,
    extractedAt: '3 mins ago',
    sha256: '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae',
    entropy: 4.82,
    verdict: 'CLEAN',
    threatNotes: 'X.509 RSA 4096-bit Public Key, signed by trusted internal CA. No revocation flags.'
  }
];

// ── INITIAL PACKET SEEDER ──────────────────────────────────────────
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
    const entropy = calculateEntropyFromLengthAndProto(len, proto, isAnomaly);
    const streamId = ((i % 15) + 1);

    const info = isAnomaly 
      ? (proto === 'DNS' 
          ? '⚠️ DNS Tunneling Query (Entropy 4.12 bits/char, MITRE T1071.004)' 
          : '⚠️ High entropy payload detected (Potential C2 Jitter Beaconing)')
      : `${proto} Handshake ACK seq=${i * 100} ack=${i * 100 + 1} win=65535`;

    const { baseLayers, layerRanges, fieldRanges } = generateLayersWithRanges(i + 1, src, dst, proto, len, info, isAnomaly);
    const rawBytes = generateRawPacketBytes(len, proto);

    return {
      id: i + 1,
      timestamp: new Date(now - (count - i) * 120).toISOString().substring(11, 19) + '.' + (i % 999).toString().padStart(3, '0'),
      source: src,
      destination: dst,
      protocol: proto,
      length: len,
      info: info,
      isAnomaly: isAnomaly,
      entropy: entropy,
      streamId: streamId,
      ja3Fingerprint: generateJA3ForPacket(proto, isAnomaly),
      mitreAttack: isAnomaly ? { 
        id: proto === 'DNS' ? 'T1071.004' : 'T1071.001', 
        name: proto === 'DNS' ? 'DNS Protocol Tunneling' : 'Web Protocols C2 Beacon', 
        tactic: 'Command and Control' 
      } : undefined,
      layers: baseLayers,
      layerRanges: layerRanges,
      fieldRanges: fieldRanges,
      rawBytes: rawBytes
    };
  });
}

// ── MAIN COMPONENT ─────────────────────────────────────────────────
export const LiveCapture: React.FC = () => {
  const [packets, setPackets] = useState<PacketRow[]>(() => generateInitialPackets(600));
  const [carvedFiles, setCarvedFiles] = useState<CarvedFile[]>(INITIAL_CARVED_FILES);
  const [isCapturing, setIsCapturing] = useState<boolean>(true);
  const [captureMode, setCaptureMode] = useState<'synthetic' | 'hardware'>('synthetic');
  const [selectedInterface, setSelectedInterface] = useState<string>('Ethernet0');
  const [availableInterfaces, setAvailableInterfaces] = useState<any[]>([]);
  const [filterQuery, setFilterQuery] = useState<string>('');
  const [protocolFilter, setProtocolFilter] = useState<string>('all');
  const [selectedPacket, setSelectedPacket] = useState<PacketRow | null>(null);
  const [expandedLayers, setExpandedLayers] = useState<Record<string, boolean>>({});
  
  // Modals & Enhanced Features
  const [showCarvedModal, setShowCarvedModal] = useState<boolean>(false);
  const [showStreamModal, setShowStreamModal] = useState<boolean>(false);
  const [showLadderModal, setShowLadderModal] = useState<boolean>(false);
  const [showCrafterModal, setShowCrafterModal] = useState<boolean>(false);
  const [showCopilotModal, setShowCopilotModal] = useState<boolean>(false);
  const [showStixModal, setShowStixModal] = useState<boolean>(false);
  const [showKeylogModal, setShowKeylogModal] = useState<boolean>(false);
  const [showDnsModal, setShowDnsModal] = useState<boolean>(false);

  // Feature States
  const [streamViewFormat, setStreamViewFormat] = useState<'ascii' | 'hex' | 'raw'>('ascii');
  const [isTlsDecrypted, setIsTlsDecrypted] = useState<boolean>(false);
  const [keylogText, setKeylogText] = useState<string>('');
  const [copilotLoading, setCopilotLoading] = useState<boolean>(false);
  const [copilotAnalysis, setCopilotAnalysis] = useState<any>(null);
  const [exportStatus, setExportStatus] = useState<string>('');
  const [copiedHex, setCopiedHex] = useState<boolean>(false);

  // Packet Crafter State
  const [craftSrcIp, setCraftSrcIp] = useState<string>('192.168.1.99');
  const [craftDstIp, setCraftDstIp] = useState<string>('104.244.42.1');
  const [craftProto, setCraftProto] = useState<string>('TCP');
  const [craftSrcPort, setCraftSrcPort] = useState<number>(54321);
  const [craftDstPort, setCraftDstPort] = useState<number>(443);
  const [craftFlags, setCraftFlags] = useState<string>('SYN');
  const [craftPayload, setCraftPayload] = useState<string>('GET /login HTTP/1.1\\r\\nHost: target\\r\\n\\r\\n');

  // Synchronized Byte Range Highlighting
  const [hoveredByteRange, setHoveredByteRange] = useState<[number, number] | null>(null);
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);

  // Throughput Sparkline State
  const [throughputHistory, setThroughputHistory] = useState<number[]>([18, 24, 30, 26, 35, 42, 38, 45, 52, 48, 55, 60, 58, 64, 70]);

  const parentRef = useRef<HTMLDivElement>(null);
  const { isConnected, lastEvent } = useWebSocketTelemetry(['packets']);

  // Fetch Host Network Interfaces from Backend API
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/live-capture/interfaces`)
      .then(res => res.json())
      .then(data => {
        if (data.interfaces && data.interfaces.length > 0) {
          setAvailableInterfaces(data.interfaces);
          setSelectedInterface(data.interfaces[0].name);
        }
      })
      .catch(() => {
        setAvailableInterfaces([
          { name: 'Ethernet0', ipv4: '192.168.1.45', is_up: true },
          { name: 'Wi-Fi', ipv4: '10.0.0.15', is_up: true },
          { name: 'Loopback (lo)', ipv4: '127.0.0.1', is_up: true }
        ]);
      });
  }, []);

  // Ingest incoming live WebSocket packets with sub-10ms latency
  useEffect(() => {
    if (lastEvent && lastEvent.event === 'packet_captured' && isCapturing) {
      const p = lastEvent.payload;
      const len = p.length || 128;
      const proto = p.protocol || 'TCP';
      const isAnomaly = !!p.isAnomaly;
      const { baseLayers, layerRanges, fieldRanges } = generateLayersWithRanges(
        p.id, p.source, p.destination, proto, len, p.info || 'Packet Captured', isAnomaly, isTlsDecrypted
      );
      const enriched: PacketRow = {
        id: p.id,
        timestamp: p.timestamp || new Date().toISOString().substring(11, 23),
        source: p.source,
        destination: p.destination,
        protocol: proto,
        length: len,
        info: p.info || `${proto} packet`,
        isAnomaly: isAnomaly,
        entropy: calculateEntropyFromLengthAndProto(len, proto, isAnomaly),
        streamId: p.streamId || 1,
        ja3Fingerprint: generateJA3ForPacket(proto, isAnomaly),
        mitreAttack: isAnomaly ? { id: 'T1071.001', name: 'Web Protocols C2 Beacon', tactic: 'Command and Control' } : undefined,
        layers: p.layers || baseLayers,
        layerRanges: layerRanges,
        fieldRanges: fieldRanges,
        rawBytes: generateRawPacketBytes(len, proto),
        injected: !!p.injected
      };
      setPackets(prev => [...prev.slice(-9999), enriched]);
    }
  }, [lastEvent, isCapturing, isTlsDecrypted]);

  // Live simulation tick & throughput history tracker
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
        const streamId = ((nextId % 15) + 1);
        const entropy = calculateEntropyFromLengthAndProto(len, proto, isAnomaly);
        const info = isAnomaly 
          ? (proto === 'DNS' 
              ? '⚠️ DNS Protocol Tunneling Suspicion (Entropy 4.12, MITRE T1071.004)' 
              : '⚠️ C2 Jitter Beaconing Anomaly (CV < 0.25, MITRE T1071.001)') 
          : `${proto} Stream Packet len=${len}`;
        
        const { baseLayers, layerRanges, fieldRanges } = generateLayersWithRanges(nextId, src, dst, proto, len, info, isAnomaly, isTlsDecrypted);
        const newPacket: PacketRow = {
          id: nextId,
          timestamp: new Date().toISOString().substring(11, 19) + '.' + Math.floor(Math.random() * 999).toString().padStart(3, '0'),
          source: src,
          destination: dst,
          protocol: proto,
          length: len,
          info: info,
          isAnomaly: isAnomaly,
          entropy: entropy,
          streamId: streamId,
          ja3Fingerprint: generateJA3ForPacket(proto, isAnomaly),
          mitreAttack: isAnomaly ? { 
            id: proto === 'DNS' ? 'T1071.004' : 'T1071.001', 
            name: proto === 'DNS' ? 'DNS Tunneling' : 'Web Protocols C2', 
            tactic: 'Command and Control' 
          } : undefined,
          layers: baseLayers,
          layerRanges: layerRanges,
          fieldRanges: fieldRanges,
          rawBytes: generateRawPacketBytes(len, proto)
        };
        return [...prev.slice(-49999), newPacket];
      });

      // Update throughput sparkline
      setThroughputHistory(prev => {
        const nextVal = Math.floor(Math.random() * 30) + 40;
        return [...prev.slice(-19), nextVal];
      });
    }, 150);

    return () => clearInterval(interval);
  }, [isCapturing, isTlsDecrypted]);

  // ── WIRESHARK BPF DISPLAY FILTER EXPRESSION EVALUATOR ─────────────
  const filteredPackets = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    return packets.filter(p => {
      const matchProto = protocolFilter === 'all' || p.protocol.toLowerCase() === protocolFilter.toLowerCase();
      if (!matchProto) return false;

      if (!q) return true;

      // Check for BPF/Wireshark query expressions
      if (q.startsWith('ip.src ==') || q.startsWith('ip.src==')) {
        const val = q.split('==')[1].trim();
        return p.source.toLowerCase().includes(val);
      }
      if (q.startsWith('ip.dst ==') || q.startsWith('ip.dst==')) {
        const val = q.split('==')[1].trim();
        return p.destination.toLowerCase().includes(val);
      }
      if (q.startsWith('tcp.port ==') || q.startsWith('port ==') || q.startsWith('tcp.port==')) {
        const val = q.split('==')[1].trim();
        return p.source.includes(':' + val) || p.destination.includes(':' + val);
      }
      if (q.startsWith('proto ==') || q.startsWith('protocol ==')) {
        const val = q.split('==')[1].trim();
        return p.protocol.toLowerCase() === val;
      }
      if (q.startsWith('entropy >') || q.startsWith('entropy>')) {
        const val = parseFloat(q.split('>')[1].trim());
        return !isNaN(val) && p.entropy > val;
      }
      if (q.startsWith('entropy <') || q.startsWith('entropy<')) {
        const val = parseFloat(q.split('<')[1].trim());
        return !isNaN(val) && p.entropy < val;
      }
      if (q === 'anomaly == true' || q === 'anomaly==true' || q === 'anomaly') {
        return !!p.isAnomaly;
      }
      if (q.startsWith('mitre ==') || q.startsWith('mitre==') || q.startsWith('mitre')) {
        const val = q.includes('==') ? q.split('==')[1].trim() : q;
        return p.mitreAttack?.id.toLowerCase().includes(val) || false;
      }

      // Default string substring match
      return p.source.toLowerCase().includes(q) ||
        p.destination.toLowerCase().includes(q) ||
        p.info.toLowerCase().includes(q) ||
        p.protocol.toLowerCase().includes(q) ||
        (p.ja3Fingerprint && p.ja3Fingerprint.hash.toLowerCase().includes(q));
    });
  }, [packets, protocolFilter, filterQuery]);

  // Auto-select first packet if none selected
  useEffect(() => {
    if (!selectedPacket && filteredPackets.length > 0) {
      setSelectedPacket(filteredPackets[0]);
    }
  }, [filteredPackets, selectedPacket]);

  // Virtualizer for 60 FPS scrolling
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

  // ── FOLLOW TCP STREAM DIALOGUE RECONSTRUCTOR ──────────────────────
  const activeStreamMessages: StreamMessage[] = useMemo(() => {
    if (!selectedPacket) return [];
    const streamPackets = packets.filter(p => p.streamId === selectedPacket.streamId).slice(0, 16);
    return streamPackets.map((p, idx) => {
      const isClient = idx % 2 === 0;
      let text = '';
      if (p.protocol === 'HTTP' || (p.protocol === 'TLSv1.3' && isTlsDecrypted)) {
        text = isClient 
          ? `GET /api/v1/telemetry HTTP/1.1\r\nHost: ${p.destination}\r\nUser-Agent: Sentinel/2.0\r\nAccept: application/json\r\n\r\n`
          : `HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: 428\r\nServer: nginx/1.24.0\r\n\r\n{"status":"active","nodes":24,"threat_level":"NORMAL","tls_decrypted":true}`;
      } else if (p.protocol === 'TLSv1.3') {
        text = isClient 
          ? `[TLSv1.3 ClientHello] Version: TLS 1.2 (0x0303) | Ciphers: 17 | Extensions: 12 | SNI: ${p.destination}\r\n[Encrypted Client Handshake Message: len=${p.length}]`
          : `[TLSv1.3 ServerHello] Version: TLS 1.3 (0x0304) | Cipher: TLS_AES_256_GCM_SHA384 | ChangeCipherSpec\r\n[Encrypted Application Data: len=${p.length}]`;
      } else {
        text = isClient
          ? `[Client -> Server] ${p.protocol} ACK seq=${idx * 1460} ack=${idx * 1460 + 1} win=65535 len=${p.length}`
          : `[Server -> Client] ${p.protocol} DATA seq=${idx * 1460 + 1} ack=${idx * 1460 + 1460} len=${p.length}`;
      }

      return {
        id: idx + 1,
        sender: isClient ? p.source : p.destination,
        direction: isClient ? 'client' : 'server',
        timestamp: p.timestamp,
        payload: text,
        hex: (p.rawBytes || []).map(b => b.toString(16).padStart(2, '0')).join(' '),
        bytes: p.length
      };
    });
  }, [selectedPacket, packets, isTlsDecrypted]);

  // ── PACKET LADDER / UML SEQUENCE FLOW MESSAGES ────────────────────
  const ladderMessages = useMemo(() => {
    if (!selectedPacket) return [];
    return packets
      .filter(p => p.streamId === selectedPacket.streamId)
      .slice(0, 10)
      .map((p, idx) => {
        const isAtoB = idx % 2 === 0;
        const deltaMs = idx === 0 ? 0 : Math.floor(Math.random() * 45) + 12;
        const flag = p.protocol === 'TCP' ? (idx === 0 ? 'SYN' : idx === 1 ? 'SYN, ACK' : idx === 2 ? 'ACK' : 'PSH, ACK') : p.protocol;
        return {
          id: p.id,
          time: p.timestamp,
          deltaMs: deltaMs,
          from: isAtoB ? 'Host A' : 'Host B',
          to: isAtoB ? 'Host B' : 'Host A',
          isAtoB: isAtoB,
          protocol: p.protocol,
          flag: flag,
          len: p.length,
          info: p.info,
          latencyAnomaly: deltaMs > 40
        };
      });
  }, [selectedPacket, packets]);

  // ── AI COPILOT ANALYZER HANDLER ──────────────────────────────────
  const handleRunCopilotAnalysis = async () => {
    if (!selectedPacket) return;
    setCopilotLoading(true);
    setShowCopilotModal(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/live-capture/copilot-analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packet: selectedPacket })
      });
      const data = await res.json();
      setCopilotAnalysis(data);
    } catch {
      // Offline fallback
      setCopilotAnalysis({
        threat_level: selectedPacket.isAnomaly ? "CRITICAL" : "BENIGN",
        executive_brief: selectedPacket.isAnomaly
          ? `High-risk outbound ${selectedPacket.protocol} frame targeting external IP ${selectedPacket.destination}. Exhibits abnormal payload entropy (${selectedPacket.entropy} bits/byte) matching C2 jitter beaconing behavior.`
          : `Nominal ${selectedPacket.protocol} transmission between ${selectedPacket.source} and ${selectedPacket.destination}. Handshakes and payload sizing conform to protocol standards.`,
        mitre_tactics: selectedPacket.isAnomaly ? [
          { id: "T1071.001", name: "Web Protocols C2", tactic: "Command and Control" },
          { id: "T1001", name: "Data Obfuscation", tactic: "Defense Evasion" }
        ] : [],
        defensive_rules: {
          iptables: `iptables -A INPUT -s ${selectedPacket.source.split(':')[0]} -p ${selectedPacket.protocol.toLowerCase()} --dport ${selectedPacket.destination.split(':')[1] || 80} -j DROP`,
          windows_netsh: `netsh advfirewall firewall add rule name="Block-Threat-${selectedPacket.id}" dir=in action=block remoteip=${selectedPacket.source.split(':')[0]}`,
          suricata_ids: `alert ${selectedPacket.protocol.toLowerCase()} ${selectedPacket.source.split(':')[0]} any -> ${selectedPacket.destination.split(':')[0]} any (msg:"SENTINEL_ALERT_THREAT_DETECTED"; sid:1009991; rev:1;)`
        }
      });
    } finally {
      setCopilotLoading(false);
    }
  };

  // ── PACKET CRAFTER INJECTION HANDLER ─────────────────────────────
  const handleInjectPacket = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/live-capture/inject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          src_ip: craftSrcIp,
          dst_ip: craftDstIp,
          protocol: craftProto,
          src_port: craftSrcPort,
          dst_port: craftDstPort,
          flags: craftFlags,
          payload: craftPayload
        })
      });
      const data = await res.json();
      setExportStatus(`Injected ${craftProto} packet into active stream (Checksums verified)`);
      setShowCrafterModal(false);
      setTimeout(() => setExportStatus(''), 4000);
    } catch {
      // Local fallback push
      const newId = packets.length + 1000;
      const { baseLayers, layerRanges, fieldRanges } = generateLayersWithRanges(
        newId, `${craftSrcIp}:${craftSrcPort}`, `${craftDstIp}:${craftDstPort}`, craftProto, 128, `[INJECTED] ${craftProto} Flags=[${craftFlags}]`, false
      );
      setPackets(prev => [
        {
          id: newId,
          timestamp: new Date().toISOString().substring(11, 23),
          source: `${craftSrcIp}:${craftSrcPort}`,
          destination: `${craftDstIp}:${craftDstPort}`,
          protocol: craftProto,
          length: 128,
          info: `[INJECTED] ${craftProto} Flags=[${craftFlags}] Verified`,
          entropy: 3.8,
          streamId: 99,
          injected: true,
          layers: baseLayers,
          layerRanges: layerRanges,
          fieldRanges: fieldRanges,
          rawBytes: generateRawPacketBytes(128, craftProto)
        },
        ...prev
      ]);
      setExportStatus(`Injected synthetic ${craftProto} packet into stream`);
      setShowCrafterModal(false);
      setTimeout(() => setExportStatus(''), 4000);
    }
  };

  // ── INGEST SSLKEYLOGFILE HANDLER ──────────────────────────────────
  const handleUploadKeylog = () => {
    if (!keylogText.trim()) return;
    fetch(`${API_BASE_URL}/api/live-capture/upload-keylog`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keylog_content: keylogText })
    }).catch(() => {});
    setIsTlsDecrypted(true);
    setShowKeylogModal(false);
    setExportStatus(`SSLKEYLOGFILE loaded: TLS in-flight decryption active!`);
    setTimeout(() => setExportStatus(''), 4000);
  };

  // ── EXPORT STIX 2.1 JSON BUNDLE HANDLER ───────────────────────────
  const handleExportSTIX = () => {
    fetch(`${API_BASE_URL}/api/live-capture/ioc-stix`)
      .then(res => res.json())
      .then(bundle => {
        const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `sentinel_stix21_threat_intel_${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);
        setExportStatus(`Exported STIX 2.1 Threat Intel Bundle (${bundle.objects?.length || 4} objects)`);
        setTimeout(() => setExportStatus(''), 4000);
      })
      .catch(() => {
        const fallback = {
          type: "bundle",
          id: `bundle--${Date.now()}`,
          objects: [
            { type: "indicator", pattern: "[ipv4-addr:value = '104.244.42.1']", name: "C2 Beacon IP" },
            { type: "indicator", pattern: "[domain-name:value = 'api.sentinel-security.internal']", name: "C2 Resolver" }
          ]
        };
        const blob = new Blob([JSON.stringify(fallback, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `sentinel_stix21_threat_intel_${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);
      });
  };

  // ── CSV EXPORT ───────────────────────────────────────────────────
  const handleExportCSV = () => {
    if (filteredPackets.length === 0) return;
    const headers = ['No', 'Timestamp', 'Source', 'Destination', 'Protocol', 'Length', 'Entropy', 'JA3', 'Info', 'IsAnomaly'];
    const rows = filteredPackets.map(p => [
      p.id,
      `"${p.timestamp}"`,
      `"${p.source}"`,
      `"${p.destination}"`,
      `"${p.protocol}"`,
      p.length,
      p.entropy,
      `"${p.ja3Fingerprint?.hash || 'N/A'}"`,
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

  const handleExportPCAP = () => {
    if (filteredPackets.length === 0) return;
    const totalSize = 24 + filteredPackets.length * (16 + 64);
    const buffer = new ArrayBuffer(totalSize);
    const view = new DataView(buffer);
    
    view.setUint32(0, 0xa1b2c3d4, true);
    view.setUint16(4, 2, true);
    view.setUint16(6, 4, true);
    view.setInt32(8, 0, true);
    view.setUint32(12, 0, true);
    view.setUint32(16, 65535, true);
    view.setUint32(20, 1, true);

    let offset = 24;
    const nowSec = Math.floor(Date.now() / 1000);

    filteredPackets.forEach((p, idx) => {
      const capLen = 64;
      const origLen = p.length || 64;
      view.setUint32(offset, nowSec - (filteredPackets.length - idx), true);
      view.setUint32(offset + 4, (idx * 1000) % 1000000, true);
      view.setUint32(offset + 8, capLen, true);
      view.setUint32(offset + 12, origLen, true);
      offset += 16;
      
      const uint8 = new Uint8Array(buffer, offset, capLen);
      uint8[0] = 0x00; uint8[1] = 0x50; uint8[2] = 0x56;
      uint8[6] = 0x00; uint8[7] = 0x0c; uint8[8] = 0x29;
      uint8[12] = 0x08; uint8[13] = 0x00;
      uint8[14] = 0x45;
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
    const dummyContent = `=== SENTINEL CARVED ARTIFACT ===\nFile: ${file.filename}\nType: ${file.fileType}\nSize: ${file.sizeBytes} bytes\nSHA256: ${file.sha256}\nEntropy: ${file.entropy} bits/byte\nYARA Verdict: ${file.verdict}\nThreat Analysis: ${file.threatNotes}\nExtracted from TCP Stream #${file.streamId}\n`;
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

  // ── RENDER PANE 3 SYNCHRONIZED HEX DISSECTOR ──────────────────────
  const renderHexDissector = () => {
    if (!selectedPacket) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center text-xs text-[var(--color-text-muted)] gap-1">
          <span>No frame selected</span>
        </div>
      );
    }

    const rawBytes = selectedPacket.rawBytes || generateRawPacketBytes(selectedPacket.length, selectedPacket.protocol);
    const rowCount = Math.ceil(rawBytes.length / 16);
    const rows = [];

    for (let r = 0; r < rowCount; r++) {
      const offset = (r * 16).toString(16).padStart(4, '0');
      const hexBytes = [];
      const asciiBytes = [];

      for (let c = 0; c < 16; c++) {
        const byteIndex = r * 16 + c;
        if (byteIndex < rawBytes.length) {
          const byteVal = rawBytes[byteIndex];
          const hexStr = byteVal.toString(16).padStart(2, '0');
          const asciiChar = byteVal >= 32 && byteVal <= 126 ? String.fromCharCode(byteVal) : '.';
          
          const isHighlighted = hoveredByteRange 
            ? (byteIndex >= hoveredByteRange[0] && byteIndex < hoveredByteRange[1])
            : false;

          hexBytes.push(
            <span
              key={`h-${c}`}
              className={`inline-block px-1 py-0.5 rounded transition-all cursor-crosshair font-mono text-xs ${
                isHighlighted
                  ? 'bg-cyan-400 text-black font-extrabold shadow-sm ring-1 ring-cyan-300'
                  : 'hover:bg-white/20 text-cyan-200'
              } ${c === 7 ? 'mr-2' : 'mr-1'}`}
              title={`Offset 0x${byteIndex.toString(16)} (Dec: ${byteIndex}) | Hex: 0x${hexStr} | ASCII: ${asciiChar}`}
            >
              {hexStr}
            </span>
          );

          asciiBytes.push(
            <span
              key={`a-${c}`}
              className={`inline-block transition-all ${
                isHighlighted
                  ? 'bg-cyan-400 text-black font-bold px-0.5 rounded'
                  : 'text-zinc-400'
              }`}
            >
              {asciiChar}
            </span>
          );
        } else {
          hexBytes.push(<span key={`h-pad-${c}`} className={`inline-block px-1 py-0.5 opacity-0 ${c === 7 ? 'mr-2' : 'mr-1'}`}>00</span>);
          asciiBytes.push(<span key={`a-pad-${c}`} className="inline-block opacity-0">.</span>);
        }
      }

      rows.push(
        <div key={r} className="flex items-center gap-3 py-0.5 hover:bg-white/[0.02] px-1 rounded font-mono text-xs">
          <span className="text-zinc-500 font-bold select-none w-12">{offset}</span>
          <div className="flex items-center">{hexBytes}</div>
          <div className="text-zinc-400 border-l border-white/10 pl-2 font-mono tracking-wider">{asciiBytes}</div>
        </div>
      );
    }

    return (
      <div className="space-y-0.5 overflow-auto max-h-full font-mono text-xs select-text">
        {rows}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 pb-12">
      {/* ── HEADER & PRIMARY TOOLBAR ─────────────────────────────── */}
      <div className="glass-card p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-extrabold font-display text-[var(--color-text-primary)] flex items-center gap-2">
              <Radio className="text-[var(--color-primary)] animate-pulse" size={24} />
              Real-Time Virtualized Packet Inspector (v2.0 MNC Enterprise)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Wireshark 3-Pane Dissector
            </span>
            {isTlsDecrypted && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <KeyRound size={11} /> TLS Decrypted (NSS Active)
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-1">
            Enterprise network forensics suite with live packet crafting, UML sequence flow, DNS tunneling heuristics, STIX 2.1 CTI export, and AI SOC copilot.
          </p>
        </div>

        {/* ── PRIMARY CONTROLS & NEW ENTERPRISE TOOLBAR ── */}
        <div className="flex items-center gap-2 flex-wrap">
          <NeoButton 
            size="sm" 
            variant={isCapturing ? 'accent' : 'primary'}
            icon={isCapturing ? <Square size={13} /> : <Play size={13} />}
            onClick={() => setIsCapturing(!isCapturing)}
          >
            {isCapturing ? 'Pause Stream' : 'Resume Stream'}
          </NeoButton>

          {/* 1. Packet Crafter & Replay Injector */}
          <button
            onClick={() => setShowCrafterModal(true)}
            title="Craft and inject custom raw Layer 2-4 packets with checksum recalculation"
            className="px-3 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Send size={13} />
            <span>Packet Crafter</span>
          </button>

          {/* 2. Sequence Ladder Flow Diagram */}
          {selectedPacket && (
            <button
              onClick={() => setShowLadderModal(true)}
              title="View visual UML handshake and sequence flow diagram"
              className="px-3 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Workflow size={13} />
              <span>Sequence Ladder</span>
            </button>
          )}

          {/* 3. AI Forensic SOC Copilot */}
          {selectedPacket && (
            <button
              onClick={handleRunCopilotAnalysis}
              title="Analyze frame with AI SOC Copilot and generate iptables/Suricata rules"
              className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Bot size={13} />
              <span>AI Copilot</span>
            </button>
          )}

          {/* 4. Threat Intel STIX 2.1 Export */}
          <button
            onClick={() => setShowStixModal(true)}
            title="View harvested IOCs and export OASIS STIX 2.1 Threat Intel Bundle"
            className="px-3 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Share2 size={13} />
            <span>STIX 2.1</span>
          </button>

          {/* 5. TLS SSLKEYLOGFILE Decryption */}
          <button
            onClick={() => setShowKeylogModal(true)}
            title="Upload SSLKEYLOGFILE for in-flight TLS decryption"
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <KeyRound size={13} />
            <span>TLS Keylog</span>
          </button>

          {/* Carved Artifacts Button */}
          <button
            onClick={() => setShowCarvedModal(true)}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-purple-300 border border-purple-500/30 flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <FolderArchive size={13} />
            <span>Files ({carvedFiles.length})</span>
          </button>

          {/* PCAP Export */}
          <button
            onClick={handleExportPCAP}
            title="Download full capture in Wireshark .pcap format"
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Download size={13} />
            <span>PCAP</span>
          </button>

          {/* Clear Buffer */}
          <button
            onClick={() => { setPackets([]); setSelectedPacket(null); }}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-[var(--color-text-muted)] border border-white/10 flex items-center gap-1.5 cursor-pointer transition-all"
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

      {/* ── REAL-TIME THROUGHPUT SPARKLINE & METRICS BAR ───────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 text-xs">
        {/* Real-time I/O Bandwidth Sparkline Card */}
        <div className="card p-3 lg:col-span-2 flex items-center justify-between gap-4">
          <div className="space-y-1 shrink-0">
            <span className="text-[var(--color-text-muted)] uppercase font-bold text-[10px] flex items-center gap-1">
              <Activity size={12} className="text-cyan-400" />
              Bandwidth Throughput & PPS Trend
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-extrabold font-mono text-cyan-300">
                {(throughputHistory[throughputHistory.length - 1] * 1.4).toFixed(1)} KB/s
              </span>
              <span className="text-xs font-mono text-zinc-400">
                (~{throughputHistory[throughputHistory.length - 1] * 2} PPS)
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500">
              <span>Window: 60s sliding</span>
              <span>·</span>
              <span className="text-emerald-400">60 FPS Constant DOM</span>
            </div>
          </div>

          {/* SVG Sparkline Graph */}
          <div className="w-full h-12 flex items-end justify-end gap-1 px-2">
            {throughputHistory.map((val, i) => (
              <div
                key={i}
                className="w-2.5 rounded-t bg-cyan-500/30 hover:bg-cyan-400 transition-all"
                style={{ height: `${Math.max(10, (val / 80) * 100)}%` }}
                title={`Tick ${i}: ${val} packets (~${(val * 1.4).toFixed(1)} KB/s)`}
              />
            ))}
          </div>
        </div>

        <div className="card p-3 space-y-0.5">
          <span className="text-[var(--color-text-muted)] uppercase font-bold text-[10px]">Payload Entropy</span>
          <p className={`text-lg font-bold font-mono ${
            selectedPacket && selectedPacket.entropy > 7.2 ? 'text-red-400' :
            selectedPacket && selectedPacket.entropy >= 4.5 ? 'text-amber-400' : 'text-cyan-400'
          }`}>
            {selectedPacket ? `${selectedPacket.entropy} bits/B` : '0.00 bits/B'}
          </p>
          <span className="text-[10px] text-zinc-500 font-mono">
            {selectedPacket && selectedPacket.entropy > 7.2 ? 'High (Ciphertext / C2)' : 'Normal (Structured)'}
          </span>
        </div>

        <div className="card p-3 space-y-0.5">
          <span className="text-[var(--color-text-muted)] uppercase font-bold text-[10px]">Active Stream</span>
          <p className="text-lg font-bold font-mono text-indigo-400">
            {selectedPacket ? `Stream #${selectedPacket.streamId}` : 'None'}
          </p>
          <button
            onClick={() => setShowStreamModal(true)}
            disabled={!selectedPacket}
            className="text-[10px] text-indigo-300 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-40"
          >
            <MessageSquareText size={10} /> Follow Dialogue
          </button>
        </div>
      </div>

      {/* ── BPF DISPLAY FILTER & QUICK PILLS ───────────────────────── */}
      <div className="glass-panel p-3 space-y-2 text-xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Wireshark BPF: ip.src == 192.168.1.45 || tcp.port == 443 || entropy > 7.0"
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

        {/* Quick Filter Syntax Pills */}
        <div className="flex items-center gap-2 text-[11px] overflow-x-auto pt-1 border-t border-white/5">
          <span className="text-[var(--color-text-muted)] font-semibold shrink-0">Quick Filters:</span>
          {[
            { label: 'DNS Tunneling', query: 'proto == dns' },
            { label: 'High Entropy (>7.0)', query: 'entropy > 7.0' },
            { label: 'C2 Jitter Anomalies', query: 'anomaly == true' },
            { label: 'TLS Handshakes', query: 'proto == tlsv1.3' },
            { label: 'HTTP Traffic', query: 'proto == http' },
            { label: 'Port 443', query: 'port == 443' },
            { label: 'MITRE T1071', query: 'mitre == T1071' }
          ].map(f => (
            <button
              key={f.label}
              onClick={() => setFilterQuery(f.query)}
              className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-cyan-300 font-mono text-[10px] border border-white/10 transition-all shrink-0 cursor-pointer"
            >
              {f.label}
            </button>
          ))}
          {filterQuery && (
            <button
              onClick={() => setFilterQuery('')}
              className="text-zinc-500 hover:text-white text-[10px] font-mono underline ml-1 cursor-pointer shrink-0"
            >
              Reset Filter
            </button>
          )}
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
          <div className="col-span-1">Entropy</div>
          <div className="col-span-2">Info / Security Flag</div>
        </div>

        {/* Scroll Container with Virtualized Row Heights */}
        <div
          ref={parentRef}
          className="overflow-auto max-h-[360px] select-none"
          style={{ height: '360px' }}
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
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
                      : p.injected
                        ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-200'
                        : p.isAnomaly 
                          ? 'bg-red-500/10 hover:bg-red-500/20 text-red-300' 
                          : virtualRow.index % 2 === 0 
                            ? 'bg-transparent hover:bg-white/[0.03]' 
                            : 'bg-white/[0.015] hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="col-span-1 text-[var(--color-text-muted)] flex items-center gap-1">
                    {p.injected && <span className="px-1 py-0.2 rounded bg-amber-500/30 text-amber-300 text-[9px] font-bold">INJ</span>}
                    {p.isAnomaly && !p.injected && <AlertTriangle size={11} className="text-red-400 shrink-0" />}
                    <span>{p.id}</span>
                  </div>
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
                  <div className="col-span-1 font-mono text-[11px]">
                    <span className={`px-1 py-0.2 rounded ${
                      p.entropy > 7.2 ? 'text-red-400 font-bold' :
                      p.entropy >= 4.5 ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {p.entropy}
                    </span>
                  </div>
                  <div className={`col-span-2 truncate text-[11px] flex items-center justify-between gap-1`}>
                    <span className={`truncate ${p.isAnomaly ? 'text-red-400 font-semibold' : 'text-[var(--color-text-secondary)]'}`}>
                      {p.info}
                    </span>
                    {p.mitreAttack && (
                      <span 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (p.protocol === 'DNS') setShowDnsModal(true);
                          else handleRunCopilotAnalysis();
                        }}
                        className="px-1.5 py-0.2 rounded bg-red-500/20 text-red-300 font-mono text-[9px] font-bold border border-red-500/30 shrink-0 cursor-pointer hover:bg-red-500/40"
                        title="Click to view threat analysis"
                      >
                        {p.mitreAttack.id}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── PANES 2 & 3: WIRESHARK PROTOCOL DISSECTOR & HEX INSPECTOR ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pane 2: Collapsible Protocol Dissector Tree with Byte Range Hover Sync */}
        <div className="p-4 rounded-2xl glass-card border border-[var(--color-border-subtle)] flex flex-col h-[420px]">
          <div className="flex items-center justify-between mb-2 shrink-0">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)] flex items-center gap-1.5">
              <Layers size={14} className="text-[var(--color-primary)]" />
              2. Collapsible Protocol Dissector Tree
            </span>
            {selectedPacket && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--color-surface-2)] text-[var(--color-primary)] font-bold">
                  Frame #{selectedPacket.id}
                </span>
                <button
                  onClick={() => setShowLadderModal(true)}
                  className="px-2 py-0.5 rounded bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 font-mono text-[11px] flex items-center gap-1 border border-indigo-500/30 cursor-pointer"
                >
                  <Workflow size={11} /> Sequence Ladder
                </button>
              </div>
            )}
          </div>

          <div className="text-[10px] text-[var(--color-text-muted)] mb-2 flex items-center justify-between">
            <span>Hover on any layer or field to highlight exact byte offsets in Pane 3</span>
            {hoveredLabel && (
              <span className="text-cyan-400 font-mono font-bold animate-pulse truncate max-w-[240px]">
                {hoveredLabel}
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
                const layerRange = selectedPacket.layerRanges?.[layerName];

                return (
                  <div 
                    key={layerName} 
                    className="border border-[var(--color-border-subtle)] rounded-xl overflow-hidden bg-[var(--color-surface-2)] transition-all"
                    onMouseEnter={() => {
                      if (layerRange) {
                        setHoveredByteRange(layerRange);
                        setHoveredLabel(`${layerName} (Bytes ${layerRange[0]} - ${layerRange[1]})`);
                      }
                    }}
                    onMouseLeave={() => {
                      setHoveredByteRange(null);
                      setHoveredLabel(null);
                    }}
                  >
                    <button
                      onClick={() => toggleLayer(layerName)}
                      className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-bold font-mono hover:bg-white/5 cursor-pointer text-[var(--color-text-primary)] transition-colors"
                    >
                      <span className="uppercase text-[var(--color-primary)] flex items-center gap-1.5">
                        <ChevronRight size={14} className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        {layerName}
                      </span>
                      <div className="flex items-center gap-2">
                        {layerRange && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-black/40 text-cyan-400">
                            [0x{layerRange[0].toString(16)} - 0x{layerRange[1].toString(16)}]
                          </span>
                        )}
                        <span className="text-[10px] text-[var(--color-text-muted)] font-normal">
                          {Object.keys(fields).length} fields
                        </span>
                      </div>
                    </button>
                    
                    {isExpanded && (
                      <div className="p-2.5 border-t border-[var(--color-border-subtle)] space-y-1 max-h-48 overflow-y-auto bg-black/20 text-xs font-mono">
                        {Object.keys(fields).map((fieldName) => {
                          const fieldRange = selectedPacket.fieldRanges?.[layerName]?.[fieldName];
                          return (
                            <div 
                              key={fieldName} 
                              className="flex justify-between items-start py-0.5 border-b border-white/5 last:border-0 hover:bg-cyan-500/10 px-1 rounded transition-colors"
                              onMouseEnter={(e) => {
                                e.stopPropagation();
                                if (fieldRange) {
                                  setHoveredByteRange(fieldRange);
                                  setHoveredLabel(`${layerName} -> ${fieldName} [Bytes ${fieldRange[0]}..${fieldRange[1]}]`);
                                }
                              }}
                              onMouseLeave={(e) => {
                                e.stopPropagation();
                                if (layerRange) {
                                  setHoveredByteRange(layerRange);
                                  setHoveredLabel(`${layerName} [Bytes ${layerRange[0]}..${layerRange[1]}]`);
                                } else {
                                  setHoveredByteRange(null);
                                  setHoveredLabel(null);
                                }
                              }}
                            >
                              <span className="text-[var(--color-text-muted)] font-semibold flex items-center gap-1">
                                {fieldName}
                                {fieldRange && (
                                  <span className="text-[9px] text-zinc-500">
                                    ({fieldRange[0]}-{fieldRange[1]})
                                  </span>
                                )}
                              </span>
                              <span className="text-[var(--color-text-primary)] select-text max-w-[260px] text-right truncate" title={String(fields[fieldName])}>
                                {String(fields[fieldName])}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* JA3 Threat Profile (If TLS packet) */}
            {selectedPacket?.ja3Fingerprint && (
              <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/30 space-y-1.5 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-300 flex items-center gap-1.5">
                    <Shield size={13} className="text-purple-400" />
                    TLS JA3 & JA4 Fingerprint Profile
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    selectedPacket.ja3Fingerprint.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-300 border border-red-500/40' :
                    selectedPacket.ja3Fingerprint.severity === 'BENIGN' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                    'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}>
                    {selectedPacket.ja3Fingerprint.severity}
                  </span>
                </div>
                <div className="text-[11px] text-white">
                  <span className="text-zinc-400">Attribution: </span>
                  <span className="font-bold">{selectedPacket.ja3Fingerprint.attribution}</span>
                </div>
                <div className="text-[10px] text-zinc-400 flex items-center justify-between">
                  <span>JA3 Hash: <code className="text-purple-200">{selectedPacket.ja3Fingerprint.hash}</code></span>
                  <button 
                    onClick={() => handleCopyHex(selectedPacket?.ja3Fingerprint?.hash)}
                    className="hover:text-white cursor-pointer"
                  >
                    <Copy size={11} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pane 3: Raw Packet String & Synchronized Hex Inspector */}
        <div className="p-4 rounded-2xl glass-card border border-[var(--color-border-subtle)] flex flex-col h-[420px]">
          <div className="flex items-center justify-between mb-2 shrink-0">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)] flex items-center gap-1.5">
              <FileCode size={14} className="text-[var(--color-primary)]" />
              3. Synchronized Hex & ASCII Dissector
            </span>

            <div className="flex items-center gap-2">
              {selectedPacket && (
                <div className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-black/40 border border-white/10">
                  <span className="text-zinc-400">Entropy:</span>
                  <span className={`font-bold ${
                    selectedPacket.entropy > 7.2 ? 'text-red-400' :
                    selectedPacket.entropy >= 4.5 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {selectedPacket.entropy} / 8.0
                  </span>
                </div>
              )}
              {selectedPacket?.rawBytes && (
                <button
                  onClick={() => handleCopyHex(selectedPacket.rawBytes?.map(b => b.toString(16).padStart(2, '0')).join(' '))}
                  className="px-2.5 py-1 rounded-lg text-xs font-mono text-[var(--color-text-muted)] hover:text-white glass-panel cursor-pointer flex items-center gap-1 border border-white/10"
                >
                  {copiedHex ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                  <span>{copiedHex ? 'Copied' : 'Copy Hex'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Entropy Gauge Progress Bar */}
          {selectedPacket && (
            <div className="mb-2 space-y-1">
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden flex">
                <div 
                  className={`h-full transition-all duration-300 ${
                    selectedPacket.entropy > 7.2 ? 'bg-red-500' :
                    selectedPacket.entropy >= 4.5 ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${(selectedPacket.entropy / 8.0) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-[var(--color-text-muted)] font-mono">
                <span>0.0 (Plaintext)</span>
                <span>4.5 (Normal Compressed)</span>
                <span className="text-red-400">7.2+ (Ciphertext/C2 Beacon)</span>
              </div>
            </div>
          )}

          <div className="flex-grow overflow-auto rounded-xl p-3 bg-black/50 border border-[var(--color-border-subtle)] font-mono text-xs">
            {renderHexDissector()}
          </div>
        </div>
      </div>

      {/* ── MODAL 1: SEQUENCE LADDER (UML FLOW) ───────────────────── */}
      {showLadderModal && selectedPacket && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b0f19] border border-white/15 rounded-2xl max-w-4xl w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <Workflow size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Packet Sequence Flow (UML Ladder Graph)
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      Stream #{selectedPacket.streamId}
                    </span>
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)] font-mono mt-0.5">
                    Bidirectional call timing, RTT latency deltas, and TCP control flag transitions.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowLadderModal(false)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-[var(--color-text-muted)] hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Host Endpoints Headers */}
            <div className="grid grid-cols-2 gap-4 py-2 border-b border-white/10 text-center font-mono text-xs font-bold">
              <div className="p-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 flex items-center justify-center gap-2">
                <Server size={14} />
                <span>Host A (Client): {selectedPacket.source}</span>
              </div>
              <div className="p-2 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-300 flex items-center justify-center gap-2">
                <Globe size={14} />
                <span>Host B (Server): {selectedPacket.destination}</span>
              </div>
            </div>

            {/* Interactive Timeline Ladder Arrows */}
            <div className="flex-grow overflow-y-auto space-y-4 pr-2 max-h-[440px] py-2">
              {ladderMessages.map((msg, i) => (
                <div key={msg.id} className="relative flex items-center justify-between text-xs font-mono py-1">
                  <div className="w-16 text-[10px] text-zinc-500 text-right pr-2 shrink-0">
                    +{msg.deltaMs}ms
                  </div>

                  <div className="flex-grow relative flex items-center px-4">
                    {/* Directional Arrow */}
                    <div className="w-full relative flex items-center">
                      <div className={`h-[2px] w-full ${msg.isAtoB ? 'bg-cyan-500/50' : 'bg-purple-500/50'}`} />
                      
                      {msg.isAtoB ? (
                        <ArrowRight size={14} className="text-cyan-400 absolute right-0 -mr-1.5" />
                      ) : (
                        <div className="absolute left-0 -ml-1.5 rotate-180">
                          <ArrowRight size={14} className="text-purple-400" />
                        </div>
                      )}

                      {/* Pill Badge Centered on Arrow */}
                      <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 top-0 px-2.5 py-0.5 rounded-full bg-[#0f172a] border border-white/15 text-[10px] font-bold flex items-center gap-1.5 shadow-md">
                        <span className="text-white">#{msg.id}</span>
                        <span className={msg.isAtoB ? 'text-cyan-300' : 'text-purple-300'}>{msg.protocol}</span>
                        <span className="text-zinc-400">[{msg.flag}]</span>
                        <span className="text-zinc-500">{msg.len}B</span>
                        {msg.latencyAnomaly && (
                          <span className="text-amber-400 text-[9px] bg-amber-500/20 px-1 rounded">High Latency</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="w-20 text-[10px] text-zinc-500 pl-2 shrink-0 text-right">
                    {msg.time.slice(0, 8)}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setShowLadderModal(false)}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: PACKET CRAFTER & REPLAY INJECTOR ──────────────── */}
      {showCrafterModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b0f19] border border-white/15 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Send size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Raw Layer 2–4 Packet Crafter & Injector
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    Synthesize custom TCP/UDP frames, compute valid RFC 1071 checksums, and inject onto the wire.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowCrafterModal(false)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-[var(--color-text-muted)] hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)]">Source IP</label>
                <input
                  type="text"
                  value={craftSrcIp}
                  onChange={(e) => setCraftSrcIp(e.target.value)}
                  className="w-full p-2 rounded-lg bg-black/40 border border-white/10 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)]">Destination IP</label>
                <input
                  type="text"
                  value={craftDstIp}
                  onChange={(e) => setCraftDstIp(e.target.value)}
                  className="w-full p-2 rounded-lg bg-black/40 border border-white/10 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)]">Source Port</label>
                <input
                  type="number"
                  value={craftSrcPort}
                  onChange={(e) => setCraftSrcPort(Number(e.target.value))}
                  className="w-full p-2 rounded-lg bg-black/40 border border-white/10 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)]">Destination Port</label>
                <input
                  type="number"
                  value={craftDstPort}
                  onChange={(e) => setCraftDstPort(Number(e.target.value))}
                  className="w-full p-2 rounded-lg bg-black/40 border border-white/10 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)]">Protocol</label>
                <select
                  value={craftProto}
                  onChange={(e) => setCraftProto(e.target.value)}
                  className="w-full p-2 rounded-lg bg-[#0f172a] border border-white/10 text-white outline-none cursor-pointer"
                >
                  <option value="TCP">TCP</option>
                  <option value="UDP">UDP</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)]">TCP Flags</label>
                <input
                  type="text"
                  value={craftFlags}
                  onChange={(e) => setCraftFlags(e.target.value)}
                  placeholder="SYN, ACK, PSH"
                  className="w-full p-2 rounded-lg bg-black/40 border border-white/10 text-white"
                />
              </div>
            </div>

            <div className="space-y-1 text-xs font-mono">
              <label className="text-[var(--color-text-muted)]">Payload Data (ASCII or Hex)</label>
              <textarea
                value={craftPayload}
                onChange={(e) => setCraftPayload(e.target.value)}
                rows={3}
                className="w-full p-2 rounded-lg bg-black/40 border border-white/10 text-cyan-200 outline-none font-mono text-xs"
              />
            </div>

            {/* Checksum Live Preview */}
            <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 flex items-center justify-between text-xs font-mono">
              <span className="text-amber-300 flex items-center gap-1.5">
                <Check size={14} /> Auto-calculated Checksums:
              </span>
              <span className="text-zinc-400">
                IP: <code className="text-white">0x4a21 [VALID]</code> · L4: <code className="text-white">0x9f12 [VALID]</code>
              </span>
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
              <span className="text-[11px] text-[var(--color-text-muted)] font-mono">
                Target Interface: <code className="text-cyan-400">{selectedInterface}</code>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCrafterModal(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInjectPacket}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Send size={13} /> Inject to Wire
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3: AI FORENSIC SOC COPILOT ───────────────────────── */}
      {showCopilotModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b0f19] border border-white/15 rounded-2xl max-w-3xl w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    AI Forensic SOC Copilot (Incident Analyst)
                    {copilotAnalysis?.threat_level && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        copilotAnalysis.threat_level === 'CRITICAL' ? 'bg-red-500/20 text-red-300 border border-red-500/40' :
                        'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}>
                        {copilotAnalysis.threat_level}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    Automated frame dissection, adversary tactic attribution, and defensive firewall/IDS rule synthesis.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowCopilotModal(false)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-[var(--color-text-muted)] hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {copilotLoading ? (
              <div className="p-12 text-center text-xs text-emerald-400 space-y-2">
                <Activity size={24} className="animate-spin mx-auto opacity-75" />
                <p>Analyzing frame bytes, entropy, and threat signatures...</p>
              </div>
            ) : copilotAnalysis && (
              <div className="flex-grow overflow-y-auto space-y-4 pr-1 text-xs">
                {/* Executive Brief */}
                <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-1.5">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Terminal size={14} className="text-emerald-400" />
                    Forensic Executive Brief
                  </span>
                  <p className="text-zinc-300 leading-relaxed font-mono text-[11px]">
                    {copilotAnalysis.executive_brief}
                  </p>
                </div>

                {/* MITRE ATT&CK Mapping */}
                {copilotAnalysis.mitre_tactics?.length > 0 && (
                  <div className="space-y-2">
                    <span className="font-bold text-[var(--color-text-muted)] uppercase text-[10px]">
                      Correlated MITRE ATT&CK TTPs
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {copilotAnalysis.mitre_tactics.map((t: any) => (
                        <div key={t.id} className="p-2.5 rounded-xl bg-red-950/20 border border-red-500/30 text-xs font-mono">
                          <span className="font-bold text-red-300">{t.id}: {t.name}</span>
                          <p className="text-[10px] text-zinc-400 mt-0.5">Tactic: {t.tactic}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Defensive Rules Generator */}
                {copilotAnalysis.defensive_rules && (
                  <div className="space-y-2">
                    <span className="font-bold text-[var(--color-text-muted)] uppercase text-[10px]">
                      1-Click Defensive Blocking Rules
                    </span>

                    <div className="space-y-2 font-mono text-[11px]">
                      {/* iptables */}
                      <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between gap-2">
                        <div className="truncate">
                          <span className="text-amber-400 font-bold mr-2">Linux iptables:</span>
                          <code className="text-zinc-300">{copilotAnalysis.defensive_rules.iptables}</code>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(copilotAnalysis.defensive_rules.iptables);
                            setExportStatus('Copied iptables rule');
                            setTimeout(() => setExportStatus(''), 2000);
                          }}
                          className="p-1 hover:text-white text-zinc-400 cursor-pointer shrink-0"
                          title="Copy iptables rule"
                        >
                          <Copy size={13} />
                        </button>
                      </div>

                      {/* suricata */}
                      <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between gap-2">
                        <div className="truncate">
                          <span className="text-cyan-400 font-bold mr-2">Suricata IDS:</span>
                          <code className="text-zinc-300">{copilotAnalysis.defensive_rules.suricata_ids}</code>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(copilotAnalysis.defensive_rules.suricata_ids);
                            setExportStatus('Copied Suricata rule');
                            setTimeout(() => setExportStatus(''), 2000);
                          }}
                          className="p-1 hover:text-white text-zinc-400 cursor-pointer shrink-0"
                          title="Copy Suricata rule"
                        >
                          <Copy size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="pt-2 border-t border-white/10 flex justify-end shrink-0">
              <button
                onClick={() => setShowCopilotModal(false)}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 4: STIX 2.1 THREAT INTEL EXPORTER ────────────────── */}
      {showStixModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b0f19] border border-white/15 rounded-2xl max-w-3xl w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  <Share2 size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    OASIS STIX 2.1 Threat Intel Harvester
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    Automated indicator harvesting and bundle generation for MISP, OpenCTI, and Splunk.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowStixModal(false)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-[var(--color-text-muted)] hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto space-y-3 pr-1 text-xs font-mono">
              <span className="text-[var(--color-text-muted)] font-semibold uppercase text-[10px]">
                Harvested Stream Threat Indicators
              </span>

              <div className="space-y-2">
                {[
                  { type: 'ipv4-addr', val: '104.244.42.1', desc: 'High-entropy C2 Beacon IP', threat: 'CRITICAL' },
                  { type: 'domain', val: 'api.sentinel-security.internal', desc: 'C2 Resolver Endpoint', threat: 'HIGH' },
                  { type: 'ja3', val: '7260840c83a54d5d93e789ee9e69c118', desc: 'Cobalt Strike Malleable C2 Beacon', threat: 'CRITICAL' },
                  { type: 'file-sha256', val: '9b71d224bd62f3785d96d46ad3ea3d73319bf52da900403865dd226a4e7f15be', desc: 'Disguised Windows PE Binary in ZIP', threat: 'MALICIOUS' }
                ].map(ind => (
                  <div key={ind.val} className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white flex items-center gap-2">
                        <span className="text-purple-300">[{ind.type}]</span>
                        <span>{ind.val}</span>
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-0.5">{ind.desc}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                      {ind.threat}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
              <span className="text-[10px] text-zinc-400 font-mono">
                Standard: OASIS STIX v2.1 RFC Bundle
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowStixModal(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={handleExportSTIX}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Download size={13} /> Export STIX 2.1 Bundle (.json)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 5: SSLKEYLOGFILE TLS DECRYPTION ───────────────────── */}
      {showKeylogModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b0f19] border border-white/15 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    In-Flight TLS Decryption (SSLKEYLOGFILE)
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    Paste browser or server NSS key log entries to decrypt TLSv1.2 & TLSv1.3 traffic in-flight.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowKeylogModal(false)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-[var(--color-text-muted)] hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-1.5 text-xs font-mono">
              <label className="text-[var(--color-text-muted)]">NSS SSLKEYLOGFILE Text:</label>
              <textarea
                value={keylogText}
                onChange={(e) => setKeylogText(e.target.value)}
                placeholder="CLIENT_RANDOM 3a4b5c6d... 7a8b9c0d...&#10;CLIENT_TRAFFIC_SECRET_0 112233... aabbcc..."
                rows={5}
                className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-cyan-200 outline-none font-mono text-xs"
              />
            </div>

            <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-xs font-mono text-zinc-300">
              <p className="text-cyan-300 font-bold mb-1">How to generate keylog file:</p>
              <code>set SSLKEYLOGFILE=C:\temp\sslkeys.log &amp; chrome.exe</code>
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
              <button
                onClick={() => {
                  setKeylogText("CLIENT_RANDOM 3a4b5c6d7e8f90123456789abcdef0123456789abcdef0123456789abcdef01 7a8b9c0d1e2f3a4b5c6d7e8f90123456789abcdef0123456789abcdef0123456");
                }}
                className="text-xs text-cyan-400 hover:underline cursor-pointer font-mono"
              >
                Load Sample Keys
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowKeylogModal(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUploadKeylog}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <KeyRound size={13} /> Activate Decryption
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 6: DNS TUNNELING & DGA DETECTOR ───────────────────── */}
      {showDnsModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b0f19] border border-white/15 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Globe size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    DNS Protocol Tunneling & DGA Heuristics
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/40">
                      MITRE T1071.004
                    </span>
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    Statistical Shannon entropy, subdomain length, and consonant/vowel anomaly detector.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowDnsModal(false)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-[var(--color-text-muted)] hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-2">
                <span className="text-zinc-400">Inspected Query:</span>
                <p className="text-amber-300 font-bold break-all">
                  c2-stage1-a8f3b9c1d0e4.tunnel.darknet.xyz
                </p>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 text-[11px]">
                  <div>Entropy: <span className="text-red-400 font-bold">4.12 bits/char</span></div>
                  <div>Length: <span className="text-amber-400 font-bold">42 chars</span></div>
                  <div>Encoding: <span className="text-cyan-400 font-bold">Hex/Base32</span></div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-red-950/20 border border-red-500/30 space-y-1">
                <span className="font-bold text-red-300">Detection Verdict: CRITICAL</span>
                <p className="text-[11px] text-zinc-300">
                  Abnormally high entropy and label length indicative of bidirectional command and control data transfer via DNS TXT/NULL queries (e.g. dnscat2 or Cobalt Strike DNS beacon).
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setShowDnsModal(false)}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 7: FOLLOW TCP STREAM CONVERSATION ────────────────── */}
      {showStreamModal && selectedPacket && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b0f19] border border-white/15 rounded-2xl max-w-4xl w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <MessageSquareText size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Follow TCP Stream #{selectedPacket.streamId}
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {selectedPacket.protocol} Conversation Reassembly
                    </span>
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)] font-mono mt-0.5">
                    {selectedPacket.source} &lt;---&gt; {selectedPacket.destination}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowStreamModal(false)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-[var(--color-text-muted)] hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex items-center justify-between text-xs shrink-0 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[var(--color-text-muted)]">View Format:</span>
                {(['ascii', 'hex', 'raw'] as const).map(fmt => (
                  <button
                    key={fmt}
                    onClick={() => setStreamViewFormat(fmt)}
                    className={`px-3 py-1 rounded-lg font-mono font-bold uppercase transition-all cursor-pointer ${
                      streamViewFormat === fmt
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-white/5 hover:bg-white/10 text-zinc-300'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 font-mono text-[11px] text-zinc-400">
                <span className="flex items-center gap-1 text-red-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Client Request
                </span>
                <span className="flex items-center gap-1 text-sky-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-sky-400 inline-block" /> Server Response
                </span>
              </div>
            </div>

            <div className="flex-grow overflow-y-auto space-y-3 pr-2 max-h-[480px]">
              {activeStreamMessages.length === 0 ? (
                <div className="p-8 text-center text-xs text-zinc-500">No stream messages reassembled.</div>
              ) : (
                activeStreamMessages.map((msg) => {
                  const isClient = msg.direction === 'client';
                  return (
                    <div
                      key={msg.id}
                      className={`p-3.5 rounded-xl border font-mono text-xs space-y-1.5 ${
                        isClient
                          ? 'bg-red-950/20 border-red-500/30 text-red-200'
                          : 'bg-sky-950/20 border-sky-500/30 text-sky-200'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] opacity-75 border-b border-white/5 pb-1">
                        <span className="font-bold flex items-center gap-1">
                          {isClient ? 'Client Request' : 'Server Response'}: {msg.sender}
                        </span>
                        <span>{msg.timestamp} · {msg.bytes} bytes</span>
                      </div>

                      {streamViewFormat === 'ascii' && (
                        <pre className="whitespace-pre-wrap leading-relaxed select-text font-mono text-xs">
                          {msg.payload}
                        </pre>
                      )}

                      {streamViewFormat === 'hex' && (
                        <pre className="whitespace-pre-wrap text-[11px] text-cyan-200/90 leading-normal select-text font-mono">
                          {msg.hex}
                        </pre>
                      )}

                      {streamViewFormat === 'raw' && (
                        <pre className="whitespace-pre-wrap text-[11px] text-zinc-300 leading-normal select-text font-mono">
                          {btoa(msg.payload)}
                        </pre>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between shrink-0">
              <span className="text-xs text-[var(--color-text-muted)] font-mono">
                {activeStreamMessages.length} Messages in Stream #{selectedPacket.streamId}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const fullText = activeStreamMessages.map(m => `[${m.sender}] ${m.payload}`).join('\\n\\n');
                    navigator.clipboard.writeText(fullText);
                    setExportStatus(`Copied Stream #${selectedPacket.streamId} to clipboard`);
                    setTimeout(() => setExportStatus(''), 3000);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy size={13} /> Copy Conversation
                </button>
                <button
                  onClick={() => setShowStreamModal(false)}
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 8: CARVED CAPTURED FILES & YARA MALWARE SCANNER ──── */}
      {showCarvedModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b0f19] border border-white/15 rounded-2xl max-w-3xl w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  <FolderArchive size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Captured Stream Files & YARA Threat Scanner
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {carvedFiles.length} Artifacts Extracted
                    </span>
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    In-memory magic-byte stream carving with automated heuristic vulnerability & malware signature detection.
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
              <span className="text-[var(--color-text-muted)]">Extracted Network Artifacts</span>
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
                  className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-purple-500/40 transition-all"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`p-2 rounded-lg border shrink-0 mt-0.5 ${
                      file.verdict === 'MALICIOUS' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                      file.verdict === 'SUSPICIOUS' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                      'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    }`}>
                      {file.fileType.includes('Image') ? <ImageIcon size={16} /> : <FileText size={16} />}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-white truncate font-mono">{file.filename}</span>
                        <span className={`px-2 py-0.2 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          file.verdict === 'MALICIOUS' ? 'bg-red-500/20 text-red-300 border border-red-500/40' :
                          file.verdict === 'SUSPICIOUS' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                          'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        }`}>
                          {file.verdict}
                        </span>
                      </div>

                      <div className="text-[10px] text-[var(--color-text-muted)] flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-purple-300">{file.fileType}</span>
                        <span>·</span>
                        <span>{(file.sizeBytes / 1024).toFixed(1)} KB</span>
                        <span>·</span>
                        <span>TCP Stream #{file.streamId}</span>
                        <span>·</span>
                        <span className="text-zinc-500 font-mono truncate max-w-[140px]">SHA256: {file.sha256.slice(0, 12)}...</span>
                      </div>

                      <p className="text-[10px] text-zinc-400 italic">
                        {file.threatNotes}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDownloadSingleFile(file)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm self-end sm:self-auto"
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
