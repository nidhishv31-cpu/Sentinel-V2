import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertOctagon, RefreshCw, BarChart2 } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { API_BASE_URL } from '../config/api';

const SAMPLE_LOGS = `192.168.1.50 - - [17/Aug/2026:10:15:30 +0000] "POST /api/auth/login HTTP/1.1" 200 450 "https://sentineljwt.io/" "Mozilla/5.0"
198.51.100.1 - - [17/Aug/2026:10:20:01 +0000] "POST /api/auth/login HTTP/1.1" 401 120 "https://sentineljwt.io/" "Mozilla/5.0"
198.51.100.1 - - [17/Aug/2026:10:20:10 +0000] "POST /api/auth/login HTTP/1.1" 401 120 "https://sentineljwt.io/" "Mozilla/5.0"
198.51.100.1 - - [17/Aug/2026:10:20:15 +0000] "POST /api/auth/login HTTP/1.1" 401 120 "https://sentineljwt.io/" "Mozilla/5.0"
198.51.100.1 - - [17/Aug/2026:10:20:20 +0000] "POST /api/auth/login HTTP/1.1" 401 120 "https://sentineljwt.io/" "Mozilla/5.0"
198.51.100.1 - - [17/Aug/2026:10:20:25 +0000] "POST /api/auth/login HTTP/1.1" 401 120 "https://sentineljwt.io/" "Mozilla/5.0"
198.51.100.1 - - [17/Aug/2026:10:20:30 +0000] "POST /api/auth/login HTTP/1.1" 401 120 "https://sentineljwt.io/" "Mozilla/5.0"
203.0.113.2 - - [17/Aug/2026:10:25:00 +0000] "POST /api/auth/login HTTP/1.1" 401 120 "-" "Mozilla/5.0"
203.0.113.2 - - [17/Aug/2026:10:25:05 +0000] "POST /api/auth/login HTTP/1.1" 401 120 "-" "Mozilla/5.0"
203.0.113.2 - - [17/Aug/2026:10:25:10 +0000] "POST /api/auth/login HTTP/1.1" 401 120 "-" "Mozilla/5.0"
203.0.113.2 - - [17/Aug/2026:10:25:15 +0000] "POST /api/auth/login HTTP/1.1" 401 120 "-" "Mozilla/5.0"
{"timestamp": "2026-08-17T10:30:00Z", "source_ip": "192.168.1.100", "endpoint": "/api/dashboard", "status_code": 200, "user_agent": "Mozilla/5.0", "username": "admin"}`;

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'];

export const LogIngest: React.FC = () => {
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ success: boolean; count: number; msg: string } | null>(null);
  const [manualText, setManualText] = useState('');
  const [error, setError] = useState('');
  
  // Parsed logs dashboard state
  const [ingestedEvents, setIngestedEvents] = useState<any[]>([]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const uploadLogFile = async (file: File) => {
    setLoading(true);
    setError('');
    setStatus(null);
    setIngestedEvents([]);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE_URL}/logs/ingest`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('File upload failed.');
      const data = await res.json();
      
      setStatus({
        success: data.success,
        count: data.events_parsed,
        msg: data.message
      });

      if (data.success && data.events) {
        setIngestedEvents(data.events);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during ingestion.');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadLogFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadLogFile(e.target.files[0]);
    }
  };

  const handleManualSubmit = async () => {
    if (!manualText.trim()) return;
    setLoading(true);
    setError('');
    setStatus(null);
    setIngestedEvents([]);

    // Create file blob from text
    const blob = new Blob([manualText], { type: 'text/plain' });
    const file = new File([blob], 'manual_input.log');
    await uploadLogFile(file);
  };

  const loadSample = () => {
    setManualText(SAMPLE_LOGS);
  };

  // Compile metrics for analytics dashboard
  const getStatusCodeDistribution = () => {
    const counts: Record<string, number> = {};
    ingestedEvents.forEach(ev => {
      const details = ev.details || {};
      const code = String(details.status_code || 200);
      counts[code] = (counts[code] || 0) + 1;
    });
    return Object.keys(counts).map(code => ({
      name: `HTTP ${code}`,
      value: counts[code]
    }));
  };

  const getTopEndpoints = () => {
    const counts: Record<string, number> = {};
    ingestedEvents.forEach(ev => {
      const details = ev.details || {};
      const ep = details.endpoint || "/";
      counts[ep] = (counts[ep] || 0) + 1;
    });
    return Object.keys(counts)
      .map(ep => ({ endpoint: ep, count: counts[ep] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const getTopSourceIps = () => {
    const counts: Record<string, number> = {};
    ingestedEvents.forEach(ev => {
      counts[ev.source_ip] = (counts[ev.source_ip] || 0) + 1;
    });
    return Object.keys(counts)
      .map(ip => ({ ip, count: counts[ip] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const statusCodesData = getStatusCodeDistribution();
  const topEndpoints = getTopEndpoints();
  const topSourceIps = getTopSourceIps();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="mb-5">
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Log Ingest</h1>
        <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
          Ingest SIEM-lite logs for Apache/Nginx server access and JSON format audits
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* File Ingest Panel */}
        <div className="card p-3 sm:p-4 md:p-6 space-y-6">
          <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--color-accent)' }}>
            <Upload size={16} />
            Log File Ingest (SIEM-lite)
          </h2>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Upload server access logs in standard Apache/Nginx Combined format or JSON Lines formats. The SIEM engine will automatically index events and evaluate brute-force, stuffing, or correlation rules.
          </p>

          {/* Drag and Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-4 sm:p-8 text-center cursor-pointer transition relative min-h-[220px] flex flex-col justify-center items-center ${
              dragActive ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5' : 'border-[var(--color-border)] hover:border-slate-500 bg-[var(--color-surface-2)]/50'
            }`}
          >
            <input
              type="file"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              accept=".log,.txt,.json"
            />
            {loading ? (
              <div className="space-y-3">
                <RefreshCw size={32} className="animate-spin mx-auto" style={{ color: 'var(--color-accent)' }} />
                <span className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>Parsing and running SIEM detections...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <FileText size={32} style={{ color: 'var(--color-text-faint)' }} className="mx-auto" />
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Drag and drop your server log file here</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-faint)' }}>Supports Nginx Combined or JSON lines format (.log, .txt, .json)</p>
                </div>
                <button className="px-4 py-2 min-h-[44px] sm:min-h-0 rounded-lg text-xs font-bold hover:opacity-80 transition" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>
                  Browse Files
                </button>
              </div>
            )}
          </div>

          {/* Status outputs */}
          {status && (
            <div className="border rounded-lg p-4 flex gap-3 text-xs leading-relaxed" style={{
              borderColor: status.success ? 'rgba(16,185,129,0.3)' : 'var(--sev-medium-bg)',
              background: status.success ? 'rgba(16,185,129,0.1)' : 'var(--sev-medium-bg)',
              color: status.success ? '#10b981' : 'var(--sev-medium)'
            }}>
              <CheckCircle2 size={16} className="shrink-0" />
              <div>
                <p className="font-bold">{status.success ? 'Log Ingestion Successful' : 'Ingestion Partial/Failed'}</p>
                <p className="mt-1" style={{ color: 'var(--color-text-muted)' }}>{status.msg}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="border rounded-lg p-4 flex gap-3 text-xs leading-relaxed" style={{ borderColor: 'var(--sev-critical)', background: 'var(--sev-critical-bg)', color: 'var(--sev-critical)' }}>
              <AlertOctagon size={16} className="shrink-0" />
              <div>
                <p className="font-bold">Error Ingesting Log</p>
                <p className="mt-1" style={{ color: 'var(--color-text-muted)' }}>{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Manual Input Workspace */}
        <div className="card p-3 sm:p-4 md:p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>Raw Logs Workspace</h3>
            <button
              onClick={loadSample}
              className="text-xs font-semibold hover:underline"
              style={{ color: 'var(--color-accent)' }}
            >
              Load Sample Telemetry
            </button>
          </div>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Paste log entries below to test raw string parsing or simulate specific security incidents.
          </p>

          <textarea
            className="w-full h-64 border rounded-lg p-3 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
            placeholder="Paste log lines here..."
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
          />

          <button
            onClick={handleManualSubmit}
            disabled={loading || !manualText.trim()}
            className="w-full min-h-[44px] sm:min-h-0 text-xs font-bold py-2.5 px-4 rounded-lg transition disabled:opacity-50"
            style={{ background: 'var(--color-accent)', color: 'white', border: 'none', cursor: 'pointer' }}
          >
            Submit Workspace Logs
          </button>
        </div>
      </div>

      {/* LOWER ROW: Detailed Log Analysis Dashboard (Appears after successful ingestion) */}
      {ingestedEvents.length > 0 && (
        <div className="card p-3 sm:p-4 md:p-6 space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4" style={{ borderColor: 'var(--color-border)' }}>
            <div>
              <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                <BarChart2 size={16} style={{ color: 'var(--color-accent)' }} />
                Log Telemetry Analysis & Insights
              </h2>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Processed {ingestedEvents.length} log rows from your payload.</p>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full border border-cyan-900/30 w-fit" style={{ background: 'var(--color-surface-2)', color: 'var(--color-accent)' }}>
              LOGS STREAM ACTIVE
            </span>
          </div>

          {/* Grid charts and top lists */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            
            {/* Chart: Status Codes */}
            <div className="border rounded-xl p-5 space-y-3 flex flex-col justify-between" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-2)/30' }}>
              <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-faint)' }}>Response Codes Share</h4>
              <div className="h-40 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusCodesData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={45}
                      label={({ name, percent }) => `${name} (${(((percent ?? 0) * 100)).toFixed(0)}%)`}
                      fontSize={8}
                    >
                      {statusCodesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)', fontSize: 10 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* List: Top Requested Endpoints */}
            <div className="border rounded-xl p-5 space-y-3" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-2)/30' }}>
              <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-faint)' }}>Top Requested URIs</h4>
              <div className="space-y-2 mt-2">
                {topEndpoints.map((ep, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs font-mono py-1 border-b" style={{ borderColor: 'var(--color-border)' }}>
                    <span style={{ color: 'var(--color-accent)' }} className="truncate max-w-[170px]" title={ep.endpoint}>{ep.endpoint}</span>
                    <span style={{ color: 'var(--color-text-muted)' }} className="font-bold">{ep.count} hits</span>
                  </div>
                ))}
              </div>
            </div>

            {/* List: Top Requester IPs */}
            <div className="border rounded-xl p-5 space-y-3" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-2)/30' }}>
              <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-faint)' }}>Top Client IPs</h4>
              <div className="space-y-2 mt-2">
                {topSourceIps.map((ip, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs font-mono py-1 border-b" style={{ borderColor: 'var(--color-border)' }}>
                    <span style={{ color: 'var(--color-text)' }}>{ip.ip}</span>
                    <span style={{ color: 'var(--color-text-muted)' }} className="font-bold">{ip.count} events</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Grid: Parsed Lines Data Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-faint)' }}>Parsed Access Events List</h4>
            <div className="overflow-x-auto border rounded-xl" style={{ borderColor: 'var(--color-border)' }}>
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b text-xs uppercase font-bold font-mono text-slate-500" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-faint)' }}>
                    <th className="p-3">Time</th>
                    <th className="p-3">Source IP</th>
                    <th className="p-3">Method</th>
                    <th className="p-3">Endpoint</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">User Agent</th>
                  </tr>
                </thead>
                <tbody>
                  {ingestedEvents.map((ev, idx) => {
                    const details = ev.details || {};
                    const isFailed = details.status_code >= 400;
                    return (
                      <tr key={idx} className="border-b text-xs font-mono hover:opacity-90" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                        <td className="p-3 truncate max-w-[130px]">{ev.timestamp}</td>
                        <td className="p-3" style={{ color: 'var(--color-accent)' }}>{ev.source_ip}</td>
                        <td className="p-3 font-semibold">{details.method || "GET"}</td>
                        <td className="p-3 truncate max-w-[150px]" title={details.endpoint} style={{ color: 'var(--color-accent)' }}>{details.endpoint}</td>
                        <td className={`p-3 font-bold ${isFailed ? 'text-red-500' : 'text-emerald-500'}`}>
                          {details.status_code}
                        </td>
                        <td className="p-3 truncate max-w-[180px]" title={details.user_agent}>{details.user_agent}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default LogIngest;