# 🛡️ Sentinel Enterprise Security Platform (v2.0)

> **MNC-Grade Real-Time Deep Packet Inspection (DPI) Forensics, Automated Threat Hunting, AI SOC Copilot, and High-Performance Network Telemetry Platform.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.13+](https://img.shields.io/badge/Python-3.13%2B-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com)
[![React 19](https://img.shields.io/badge/React-19.0-61DAFB.svg)](https://react.dev)
[![TypeScript 5.8](https://img.shields.io/badge/TypeScript-5.8-3178C6.svg)](https://typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.0-38B2AC.svg)](https://tailwindcss.com)
[![Vite](https://img.shields.io/badge/Vite-6.4-646CFF.svg)](https://vitejs.dev)
[![STIX 2.1](https://img.shields.io/badge/OASIS-STIX%202.1-red.svg)](https://oasis-open.github.io/cti-documentation/)
[![MITRE ATT&CK](https://img.shields.io/badge/MITRE-ATT%26CK%20v14-orange.svg)](https://attack.mitre.org)

---

## 📋 Executive Overview

**Sentinel Enterprise Platform (v2.0)** is an enterprise-grade, full-stack network forensics, threat hunting, and packet inspection suite designed for Security Operations Centers (SOC), Digital Forensics & Incident Response (DFIR) teams, and network security engineers. 

Engineered with a **FastAPI asynchronous backend** and a **React 19 / TypeScript 60 FPS virtualized frontend**, Sentinel bridges the gap between low-level packet dissection (Wireshark-grade deep analysis) and modern automated security workflows (AI-driven incident briefing, MITRE ATT&CK mapping, and automated firewall/IDS rule generation).

### 📑 Enterprise Technical Documentation & Deliverables
- 📄 **Executive Technical Report (.docx):** [`Sentinel_Enterprise_v2_Technical_Report.docx`](Sentinel_Enterprise_v2_Technical_Report.docx) — Complete 45 KB enterprise architecture specification, tech stack rationale, and DFIR playbook.
- 📊 **Executive Presentation Deck (.pptx):** [`Sentinel_Enterprise_v2_Presentation.pptx`](Sentinel_Enterprise_v2_Presentation.pptx) — 16:9 widescreen presentation with vector architecture diagrams, bento container flows, and comprehensive speaker notes.

---

## 🏛️ System Architecture

```mermaid
flowchart TB
    subgraph CaptureLayer ["🛰️ Real-Time Packet Capture & Network I/O"]
        NIC["Hardware Interfaces (Scapy / psutil / Npcap)"]
        StreamEng["Streaming Engine (engine_live_sniffer.py)"]
        NIC --> StreamEng
    end

    subgraph ForensicCore ["⚙️ Forensics & Threat Hunting Engine"]
        RFC["RFC 1071 16-Bit Checksum Engine"]
        Entropy["Shannon Entropy Calculator (H(X) Meter)"]
        JA3["TLS JA3 / JA4 Fingerprint Dissector"]
        YARA["YARA Heuristic Artifact Carving Scanner"]
        DNSDet["DNS Tunneling & DGA Statistical Model"]
        Reassembly["TCP Bi-Directional Stream Reassembly"]
        Crafter["Layer 2-4 Raw Frame Crafter & Injector"]
        Keylog["NSS SSLKEYLOGFILE Ingestion Engine"]
        STIX["OASIS STIX 2.1 Threat Intel Harvester"]
        AICopilot["AI SOC Forensic Copilot & Rule Synthesizer"]
        
        StreamEng --> RFC
        StreamEng --> Entropy
        StreamEng --> JA3
        StreamEng --> YARA
        StreamEng --> DNSDet
        StreamEng --> Reassembly
        StreamEng --> Keylog
    end

    subgraph BackendServices ["⚡ Backend Application Services (FastAPI)"]
        REST["REST API Router (/api/live-capture/*)"]
        WSHub["WebSocket Broadcaster (/ws/telemetry, /ws/packets)"]
        
        ForensicCore --> REST
        ForensicCore --> WSHub
    end

    subgraph FrontendUI ["🖥️ Frontend Analyst Workstation (React 19 + Vite)"]
        VirtualGrid["@tanstack/react-virtual Frame Dissector (500k+ @ 60 FPS)"]
        HexView["Synchronized Hex-to-Tree Byte Range Dissector"]
        ThroughputChart["Real-Time Vector SVG PPS & Bandwidth Sparkline"]
        UMLFlow["Interactive UML Call Flow Sequence Ladder Diagram"]
        CrafterModal["Raw Packet Crafter & Repeater Terminal"]
        CopilotDrawer["AI SOC Incident Brief & Rule Drawer (iptables/netsh/Suricata)"]
        STIXModal["OASIS STIX 2.1 JSON Visualizer & Exporter"]
        KeylogModal["In-Flight NSS TLS Decryption Console"]
        DNSTunnelModal["DNS Tunneling & DGA Inspector (MITRE T1071.004)"]
        
        REST <--> FrontendUI
        WSHub <--> FrontendUI
    end
```

---

## 🌟 7 MNC-Grade Enterprise Capabilities

### 1. 📈 Real-Time I/O Bandwidth & PPS Throughput Sparkline
- Continuous vector SVG sparkline in the header navigation tracking rolling **Packets-Per-Second (PPS)** and **Bandwidth Throughput (KB/s)**.
- Dynamic color-graded area gradient fills (Cyan to Purple) with live pulse indicators, peak rate metric readouts, and automatic windowed smoothing.

### 2. 🪜 Interactive Packet Sequence Flow / Ladder Diagram (UML Call Flow)
- Visualizes bidirectional client-server transaction timelines as a horizontal UML ladder diagram.
- Categorizes transaction types (HTTP requests/responses, DNS resolutions, TCP 3-way handshakes, TLS alerts, anomalies) with directional vectors, delta timestamps, and interactive frame inspection popovers.

### 3. 🧬 DNS Protocol Tunneling & DGA Statistical Model Detector
- **MITRE ATT&CK:** [T1071.004 (Application Layer Protocol: DNS)](https://attack.mitre.org/techniques/T1071/004/)
- Evaluates multi-label subdomain queries against statistical heuristics:
  - **Shannon Entropy ($H(X) \ge 3.8$ bits/char):** Identifies encrypted or obfuscated payload segments.
  - **Subdomain Query Length ($\ge 35$ characters):** Flags payload packing.
  - **Consonant-to-Vowel Ratio ($\ge 3.5$):** Identifies machine-generated DGAs (Domain Generation Algorithms).
  - **Encoding Analysis:** Detects Base32, Base64, and Hex encoding formats used in DNS C2 exfiltration.

### 4. 💉 Layer 2–4 Raw Packet Crafter & Replay Injector ("Raw Packet Repeater")
- Synthesizes fully customized Ethernet II, IPv4, and TCP/UDP frames directly from analyst inputs (Source/Destination IP, Ports, TCP Control Flags, Sequence Numbers, Custom Payload).
- Features an **RFC 1071 One's Complement 16-bit Internet Checksum Engine** ensuring full protocol-compliant frame validity.
- Injects synthesized frames into live capture streams and broadcasts them to all connected analysts over WebSockets.

### 5. 🤖 AI Forensic SOC Copilot Drawer & Defensive Firewall/IDS Rule Generator
- Real-time incident assessment copilot offering plain-English forensic incident summaries, MITRE ATT&CK TTP classifications, and automated defensive mitigation rules:
  - **Linux `iptables`**: `iptables -A INPUT -s <src> -p <proto> --dport <port> -j DROP`
  - **Windows `netsh`**: `netsh advfirewall firewall add rule name="SENTINEL_DROP_..." dir=in action=block`
  - **Suricata IDS Rule**: `alert <proto> <src> any -> any <port> (msg:"SENTINEL DETECT..."; sid:1000001; rev:1;)`
- Includes 1-click clipboard rule copying for instantaneous perimeter lockdown.

### 6. 🌐 Automated Threat Intel Harvester & OASIS STIX 2.1 JSON Exporter
- Harvests high-confidence Indicators of Compromise (malicious IPs, C2 domains, suspicious payload hashes) detected during live network captures.
- Assembles them into an RFC-compliant **OASIS STIX 2.1 JSON bundle** (`bundle`, `indicator`, `ipv4-addr`, `domain-name`, `file`).
- Provides 1-click download and clipboard export for rapid ingestion into SIEMs (Splunk, Microsoft Sentinel, Elastic Security) and Threat Intelligence Platforms (MISP, OpenCTI).

### 7. 🔓 In-Flight TLS Decryption via NSS `SSLKEYLOGFILE`
- Ingests standard NSS key logs (`CLIENT_RANDOM <random> <master_secret>`) exported by browsers (Chrome, Firefox) and CLI tools (`curl`).
- Matches pre-master secrets with live encrypted TLS sessions, decrypting encrypted TLS session data into cleartext HTTP/JSON payload streams in real time.

---

## 🔬 Core Forensics Engine Specifications

| Feature | Specification / Algorithm | Implementation Detail |
| :--- | :--- | :--- |
| **Virtual Dissection Table** | `@tanstack/react-virtual` | 500k+ frames with zero-DOM lag, 60 FPS continuous scroll. |
| **Hex-to-Tree Highlighting** | Byte Offset Interval Mapping | Hovering over any layer/field in Pane 2 illuminates the exact hex byte range in Pane 3 with glowing cyan highlights. |
| **TCP Conversation Reassembly** | 4-Tuple Stream Tracker | Wireshark-grade Follow TCP Stream with Red/Blue dialogue color coding, ASCII/Hex/Raw modes, and byte volume telemetry. |
| **Payload Entropy Gauge** | $H(X) = -\sum p_i \log_2(p_i)$ | Evaluates payload bytes from 0.0 to 8.0 bits/byte to distinguish plaintext (<4.5), compressed binary (4.5–6.8), and encrypted C2 (>7.2). |
| **TLS Fingerprinting** | JA3 MD5 & JA4 Hash | Evaluates ClientHello ciphers, extensions, curves, and attributes known malware (e.g. Cobalt Strike Malleable C2). |
| **Carved Artifact Analysis** | YARA Heuristic Heuristics | Deep inspection of carved network files for disguised PE binaries (`MZ`/`PE\0\0`), PDF JavaScript (`/JavaScript`, `/OpenAction`), and packed payloads. |
| **BPF Query Filtering** | Custom Expression Evaluator | Real-time query syntax: `ip.src == 192.168.1.45`, `proto == tlsv1.3`, `entropy > 7.0`, `tcp.port == 443`, `anomaly == true`. |

---

## 🛠️ Technology Stack & Frameworks

### Frontend Workstation
- **Framework:** React 19 (`react`, `react-dom`)
- **Language:** TypeScript 5.8 (Strict type safety, zero compile warnings)
- **Build Tooling:** Vite 6.4 (ESM bundling, Hot Module Replacement)
- **Styling:** Tailwind CSS 4.0 (Modern utility styling, responsive dark mode)
- **Virtualization:** `@tanstack/react-virtual` (High-performance DOM recycling)
- **Icons:** `lucide-react` (Crisp vector cybersecurity iconography)
- **State Management:** React hooks (`useMemo`, `useCallback`, `useRef`, `useState`)

### Backend Core Engine
- **Runtime:** Python 3.13 / 3.14
- **API Framework:** FastAPI 0.115+ (High-throughput async ASGI web server)
- **ASGI Server:** Uvicorn (UVLoop event loop)
- **Packet Dissection & Raw I/O:** Scapy 2.6+ & `struct` binary bit-packing
- **Hardware Telemetry:** `psutil` (NIC enumeration, interface status, traffic I/O)
- **Data Modeling & Validation:** Pydantic v2
- **Testing:** `unittest`, `fastapi.testclient`, `httpx`

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.13+
- Node.js 20+ & npm
- Npcap (Windows) or `libpcap` (Linux/macOS) for promiscuous mode hardware sniffing

### 1. Backend Setup
```bash
cd backend
pip install -r requirements.txt
python main.py
```
*Backend API server runs at: `http://127.0.0.1:8000`*  
*Interactive Swagger UI at: `http://127.0.0.1:8000/docs`*

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Analyst UI launches at: `http://localhost:5174`*

---

## 🧪 Automated Testing & Verification

Sentinel includes rigorous automated testing across both backend API services and frontend TypeScript builds.

### Backend Automated Test Suites
```bash
# Run the Enterprise Capabilities Test Suite
cd backend
python test_enterprise_suite.py

# Run the Live Sniffer Base Test Suite
python test_live_sniffer.py
```

**Test Execution Results:**
```text
[OK] DNS Tunneling: Normal=False, C2=True (High entropy 4.375 bits/char detected)
[OK] Packet Crafter: Frame #1001 injected with checksums 0x789c [verified]
[OK] STIX 2.1 Exporter: Validated bundle with 4 indicator objects
[OK] AI Copilot: Threat=CRITICAL, MITRE=T1071.001
[OK] SSLKEYLOGFILE Ingestion: 2 TLS pre-master secrets loaded
[OK] All 5 New Enterprise FastAPI REST endpoints verified (200 OK)
Ran 6 tests in 0.579s — OK
```

### Frontend Production Build Verification
```bash
cd frontend
npm run build
```
**Build Output:**
```text
> sentinel-v2-frontend@2.0.0 build
> tsc -b && vite build

vite v6.4.3 building for production...
transforming...
✓ 3351 modules transformed.
rendering chunks...
dist/index.html                              0.88 kB │ gzip:   0.50 kB
dist/assets/index-B0pfFVPj.css              87.31 kB │ gzip:  15.05 kB
dist/assets/index-BnibKm1A.js            1,939.92 kB │ gzip: 555.91 kB
✓ built in 7.20s (0 TypeScript errors)
```

---

## 📡 REST API Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/live-capture/interfaces` | `GET` | Enumerate active physical & virtual network interfaces on host. |
| `/api/live-capture/start` | `POST` | Start packet sniffing on specified interface with BPF filter. |
| `/api/live-capture/stop` | `POST` | Stop active packet sniffing session. |
| `/api/live-capture/stream/{id}` | `GET` | Reassemble bidirectional TCP conversation stream by Stream ID. |
| `/api/live-capture/inspect-carved` | `POST` | Execute YARA & heuristic analysis on carved stream artifacts. |
| `/api/live-capture/inject` | `POST` | Synthesize and inject custom Layer 2–4 raw packet into capture stream. |
| `/api/live-capture/detect-dns-tunnel` | `POST` | Analyze DNS queries for DGA patterns and data exfiltration tunneling. |
| `/api/live-capture/upload-keylog` | `POST` | Ingest NSS `SSLKEYLOGFILE` pre-master secrets for TLS decryption. |
| `/api/live-capture/ioc-stix` | `GET` | Export harvested session IOCs in OASIS STIX 2.1 JSON bundle format. |
| `/api/live-capture/copilot-analyze` | `POST` | Generate AI SOC forensic incident brief and defensive firewall/IDS rules. |

---

## 🔒 Security & Defensive Mitigations

Sentinel features built-in defensive rule generation supporting multi-vendor infrastructure:
- **Linux `iptables`**: Kernel-level packet filtering with automated target port and source IP drop rules.
- **Windows Firewall (`netsh`)**: Advanced firewall block rules for host-based defense.
- **Suricata / Snort IDS**: Syntactically valid signature rules matching packet headers, payload keywords, and protocol anomalies.

---

## 📄 License
This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
