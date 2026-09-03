import React, { useState, useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  BackgroundVariant,
  Panel
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Network, Plus, Shield, Server, Globe, RefreshCw, ZoomIn, Lock, AlertTriangle } from 'lucide-react';
import { NeoButton } from '../components/ui/NeoButton';

const initialNodes = [
  {
    id: 'gateway-1',
    type: 'input',
    data: { label: '🌐 Core Edge Router / Firewall (192.168.1.1)' },
    position: { x: 350, y: 30 },
    style: { background: '#1e293b', color: '#38bdf8', border: '1px solid #0284c7', borderRadius: '14px', padding: '12px', fontWeight: 'bold' }
  },
  {
    id: 'dmz-1',
    data: { label: '🛡️ DMZ Web Proxy (192.168.1.10) · Ports: 80, 443' },
    position: { x: 150, y: 150 },
    style: { background: '#18181b', color: '#4ade80', border: '1px solid #22c55e', borderRadius: '12px', padding: '10px' }
  },
  {
    id: 'auth-1',
    data: { label: '🔑 Auth & OAuth2 API (192.168.1.25) · Port: 8000' },
    position: { x: 550, y: 150 },
    style: { background: '#18181b', color: '#a855f7', border: '1px solid #9333ea', borderRadius: '12px', padding: '10px' }
  },
  {
    id: 'db-1',
    data: { label: '🗄️ Primary PostgreSQL DB (192.168.1.100) · Port: 5432' },
    position: { x: 150, y: 280 },
    style: { background: '#18181b', color: '#fbbf24', border: '1px solid #d97706', borderRadius: '12px', padding: '10px' }
  },
  {
    id: 'c2-vuln-1',
    data: { label: '⚠️ Legacy Redis Cache (192.168.1.105) · CWE-89 Risk' },
    position: { x: 550, y: 280 },
    style: { background: '#270c14', color: '#f87171', border: '1px solid #ef4444', borderRadius: '12px', padding: '10px' }
  }
];

const initialEdges = [
  { id: 'e1-2', source: 'gateway-1', target: 'dmz-1', animated: true, style: { stroke: '#0284c7' } },
  { id: 'e1-3', source: 'gateway-1', target: 'auth-1', animated: true, style: { stroke: '#0284c7' } },
  { id: 'e2-4', source: 'dmz-1', target: 'db-1', style: { stroke: '#22c55e' } },
  { id: 'e3-5', source: 'auth-1', target: 'c2-vuln-1', style: { stroke: '#ef4444' } },
];

export const ZenmapStudio: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [targetSubnet, setTargetSubnet] = useState('192.168.1.0/24');

  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const handleAddHost = () => {
    const nextIdx = nodes.length + 1;
    const newNode = {
      id: `node-${nextIdx}`,
      data: { label: `💻 Discovered Host (192.168.1.${100 + nextIdx}) · Port 22` },
      position: { x: 350, y: 380 },
      style: { background: '#18181b', color: '#e2e8f0', border: '1px solid #64748b', borderRadius: '12px', padding: '10px' }
    };
    setNodes((nds) => [...nds, newNode]);
    setEdges((eds) => [...eds, { id: `e-gw-${nextIdx}`, source: 'gateway-1', target: `node-${nextIdx}`, style: { stroke: '#64748b' } }]);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 pb-12">
      {/* ── HEADER ──────────────────────────────────────────────── */}
      <div className="glass-card p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-extrabold font-display text-[var(--color-text-primary)] flex items-center gap-2">
              <Network className="text-[var(--color-primary)]" size={24} />
              Interactive React Flow Topology Studio (v2.0)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              React Flow v12 Canvas
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-1">
            Dynamic, draggable network topography with real-time subnet trust boundaries, service rings, and zero-day threat indicators.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <NeoButton size="sm" icon={<Plus size={13} />} onClick={handleAddHost}>
            Add Target Host
          </NeoButton>
        </div>
      </div>

      {/* ── INTERACTIVE CANVAS ────────────────────────────────────── */}
      <div className="card overflow-hidden border border-[var(--color-border)] rounded-2xl h-[620px] relative bg-[#090d16]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
        >
          <Controls />
          <MiniMap 
            nodeColor={(n: any) => n.style?.border ? '#0284c7' : '#64748b'}
            style={{ background: '#0f172a', borderRadius: '12px' }}
          />
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#334155" />
          
          <Panel position="top-right" className="glass-panel p-2.5 space-y-1.5 text-xs text-[var(--color-text-primary)]">
            <span className="font-bold block text-[10px] uppercase text-[var(--color-text-muted)]">Subnet Scope</span>
            <div className="font-mono text-cyan-400 font-semibold">{targetSubnet}</div>
            <div className="text-[11px] text-[var(--color-text-muted)]">{nodes.length} Live Hosts Mapped</div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
};
