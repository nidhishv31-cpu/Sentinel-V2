# 🛡️ Sentinel Enterprise Security Platform (v2.0)

> **High-Performance Cybersecurity Assessment, Real-Time Deep Packet Inspection (DPI) Forensic Suite, RustScan Pipelined Port Discovery, Nuclei YAML Engine, React Flow Topology, and Virtualized Packet Capture.**

---

## 🚀 Architectural Upgrades in v2.0

```mermaid
graph TD
    subgraph Frontend ["🖥️ V2 Frontend Client (React 19 + TypeScript + Vite)"]
        UI_VirtualTable["@tanstack/react-virtual<br/>(500k+ Packets @ 60 FPS)"]
        UI_ReactFlow["React Flow Interactive Canvas<br/>(Draggable Subnet & Trust Boundaries)"]
        UI_WSClient["WebSocket & SSE Telemetry Hook<br/>(<10ms Live Push Delivery)"]
        UI_Remediate["AI Auto-Remediation & 1-Click PRs"]
        UI_Compliance["SOC 2 & ISO 27001 Matrix"]
    end

    subgraph Backend ["⚙️ V2 Backend Core (FastAPI + Async Worker Pool)"]
        API_WS["WebSocket & SSE Telemetry Hub (`/ws/telemetry`)"]
        API_Queue["Distributed Task Queue & Worker Pool (`engine_queue.py`)"]
        ENG_RustScan["RustScan/Naabu + Nmap Pipeline (`engine_rustscan_nmap.py`)"]
        ENG_Stream["Zero-Overhead In-Memory Packet Stream Engine (`engine_packet_forensics.py`)"]
        ENG_Nuclei["Nuclei YAML Engine + NVD / CISA Caching (`engine_nuclei_cve.py`)"]
    end

    Frontend <-->|Bi-directional WebSocket| Backend
```

---

## 🛠️ Quick Start

### 1. Backend Service
```bash
cd V2/backend
pip install -r requirements.txt
python main.py
```
*API docs available at: `http://127.0.0.1:8000/docs`*

### 2. Frontend Application
```bash
cd V2/frontend
npm install
npm run dev
```
*Access UI at: `http://localhost:5174`*

---

## 🧪 Testing
```bash
# Run backend architecture test suite
python scratch/test_v2_suite.py

# Run frontend production build
cd V2/frontend
npm run build
```
