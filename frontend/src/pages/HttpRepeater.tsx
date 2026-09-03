import React, { useState, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, RefreshCw, AlertTriangle, ShieldCheck, Clock, 
  Layers, Plus, Trash2, History, Copy, Check, Lock, Globe, Server, Info, Terminal
} from 'lucide-react';
import { API_BASE_URL } from '../config/api';

interface HeaderPair {
  key: string;
  value: string;
  enabled: boolean;
}

interface HistoryItem {
  id: string;
  method: string;
  url: string;
  status: number | null;
  duration_ms: number;
  timestamp: string;
}

export const HttpRepeater: React.FC = () => {
  const [method, setMethod] = useState<string>('GET');
  const [url, setUrl] = useState<string>('https://httpbin.org/get');
  const [headers, setHeaders] = useState<HeaderPair[]>([
    { key: 'User-Agent', value: 'Sentinel-Repeater/1.0', enabled: true },
    { key: 'Accept', value: 'application/json, text/plain, */*', enabled: true }
  ]);
  const [body, setBody] = useState<string>('');
  const [activeReqTab, setActiveReqTab] = useState<'headers' | 'body'>('headers');
  const [activeRespTab, setActiveRespTab] = useState<'pretty' | 'raw' | 'headers'>('pretty');

  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [allowPrivate, setAllowPrivate] = useState<boolean>(false);
  const [ssrfWarning, setSsrfWarning] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [copied, setCopied] = useState<boolean>(false);
  const [executionMode, setExecutionMode] = useState<'backend' | 'browser'>('backend');
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Automatically read incoming target, URL, method, and headers from Zenmap or other modules
  useEffect(() => {
    if (location.state) {
      if (location.state.url) setUrl(location.state.url);
      if (location.state.method) setMethod(location.state.method);
      if (location.state.body) setBody(location.state.body);
      if (location.state.headers) {
        if (typeof location.state.headers === 'string') {
          const lines = location.state.headers.split('\n');
          const parsed: HeaderPair[] = [];
          lines.forEach((l: string) => {
            const parts = l.split(':');
            if (parts.length >= 2) {
              parsed.push({ key: parts[0].trim(), value: parts.slice(1).join(':').trim(), enabled: true });
            }
          });
          if (parsed.length > 0) setHeaders(parsed);
        }
      }
    } else if (searchParams.get('url')) {
      setUrl(searchParams.get('url')!);
    } else if (searchParams.get('target')) {
      const port = searchParams.get('port') || '80';
      const proto = ['443', '8443'].includes(port) ? 'https' : 'http';
      setUrl(`${proto}://${searchParams.get('target')}:${port}/`);
    }
  }, [location.state, searchParams]);

  const addHeader = () => {
    setHeaders(prev => [...prev, { key: '', value: '', enabled: true }]);
  };

  const removeHeader = (idx: number) => {
    setHeaders(prev => prev.filter((_, i) => i !== idx));
  };

  const updateHeader = (idx: number, field: 'key' | 'value' | 'enabled', val: any) => {
    setHeaders(prev => prev.map((h, i) => i === idx ? { ...h, [field]: val } : h));
  };

  const handleSend = async (bypassSsrf: boolean = false) => {
    setLoading(true);
    setError(null);
    setSsrfWarning(null);

    const headersObj: Record<string, string> = {};
    headers.forEach(h => {
      if (h.enabled && h.key.trim()) {
        headersObj[h.key.trim()] = h.value;
      }
    });

    const cleanUrl = url.trim();

    // 1. Try Backend Replayer (Exact raw socket transmission)
    try {
      const res = await fetch(`${API_BASE_URL}/repeater/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method,
          url: cleanUrl,
          headers: headersObj,
          body: ['GET', 'HEAD'].includes(method) ? null : body,
          allow_private_network: bypassSsrf || allowPrivate
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.status === 'blocked_ssrf') {
          setSsrfWarning(data.error || 'Request blocked by internal RFC1918 / Cloud Metadata SSRF guard.');
          setResponse(null);
          setLoading(false);
          return;
        } else {
          setExecutionMode('backend');
          setResponse(data);
          if (data.status === 'network_error') {
            setError(data.error);
          }
          recordHistory(data.response_status, data.duration_ms);
          setLoading(false);
          return;
        }
      }
    } catch (backendErr: any) {
      console.warn('Backend repeater unavailable, attempting direct browser fetch fallback:', backendErr);
    }

    // 2. Fallback: Direct Browser Fetch (For hosted / Netlify preview mode)
    const startTime = performance.now();
    try {
      const fetchOpts: RequestInit = {
        method,
        headers: headersObj,
        mode: 'cors'
      };
      if (!['GET', 'HEAD'].includes(method) && body.trim()) {
        fetchOpts.body = body;
      }

      const browserRes = await fetch(cleanUrl, fetchOpts);
      const durationMs = Math.round(performance.now() - startTime);
      const text = await browserRes.text();

      const respHeaders: Record<string, string> = {};
      browserRes.headers.forEach((v, k) => {
        respHeaders[k] = v;
      });

      setExecutionMode('browser');
      setResponse({
        status: 'success',
        url: cleanUrl,
        response_status: browserRes.status,
        response_headers: respHeaders,
        response_body: text,
        body_bytes_count: text.length,
        is_truncated: false,
        duration_ms: durationMs
      });
      recordHistory(browserRes.status, durationMs);
    } catch (browserErr: any) {
      setError(
        `Failed to reach target. If targeting an internal service, ensure the local backend daemon is running on port 8000. If targeting external sites directly, verify CORS headers on target (${browserErr.message}).`
      );
      setResponse(null);
    } finally {
      setLoading(false);
    }
  };

  const recordHistory = (status: number | null, duration_ms: number) => {
    setHistory(prev => [
      {
        id: Math.random().toString(36).substring(7),
        method,
        url,
        status,
        duration_ms,
        timestamp: new Date().toLocaleTimeString()
      },
      ...prev.slice(0, 19)
    ]);
  };

  const handleCopyBody = () => {
    if (response?.response_body) {
      navigator.clipboard.writeText(response.response_body);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold flex items-center gap-2.5 text-[var(--color-text-primary)]">
            <Globe className="text-[var(--color-primary)]" size={24} />
            Interactive HTTP Repeater
          </h1>
          <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-1">
            Burp-style raw request spec replayer with SSRF internal-guard, custom headers, and live latency timing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] cursor-pointer select-none bg-[var(--color-surface)] px-3 py-1.5 rounded-xl border border-[var(--color-border)]">
            <input
              type="checkbox"
              checked={allowPrivate}
              onChange={e => setAllowPrivate(e.target.checked)}
              className="rounded accent-[var(--color-primary)] cursor-pointer"
            />
            <span>Allow RFC1918 / Localhost (Override SSRF Guard)</span>
          </label>
        </div>
      </div>

      {/* Main Grid: Request Composer (Left 6) | Response Viewer (Right 6) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
        
        {/* ── LEFT: REQUEST COMPOSER (6 COLS) ── */}
        <div className="lg:col-span-6 card p-3 sm:p-4 md:p-6 space-y-4 flex flex-col min-h-[480px] lg:h-[76vh] rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm">
          {/* Method & URL bar */}
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={method}
              onChange={e => setMethod(e.target.value)}
              className="px-3.5 py-2.5 text-xs font-bold font-mono rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-primary)] outline-none cursor-pointer"
            >
              {['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'].map(m => (
                <option key={m} value={m} className="bg-zinc-900 text-white">{m}</option>
              ))}
            </select>

            <input
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://target.com/api/v1/resource"
              className="flex-1 px-3.5 py-2.5 text-xs font-mono rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)] transition-all min-w-0"
            />

            <button
              onClick={() => handleSend(false)}
              disabled={loading || !url.trim()}
              className="px-5 py-2.5 min-h-[44px] sm:min-h-0 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] hover:opacity-90 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md flex-shrink-0"
            >
              {loading ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
              <span>Send</span>
            </button>
          </div>

          {/* Request Sub-tabs */}
          <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-3">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveReqTab('headers')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  activeReqTab === 'headers' ? 'bg-[var(--color-primary-glow)] text-[var(--color-primary)] font-bold' : 'text-[var(--color-text-muted)] hover:text-white'
                }`}
              >
                Headers ({headers.filter(h => h.enabled && h.key).length})
              </button>
              <button
                onClick={() => setActiveReqTab('body')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  activeReqTab === 'body' ? 'bg-[var(--color-primary-glow)] text-[var(--color-primary)] font-bold' : 'text-[var(--color-text-muted)] hover:text-white'
                }`}
              >
                Body {['GET', 'HEAD'].includes(method) ? '(GET disabled)' : ''}
              </button>
            </div>

            {activeReqTab === 'headers' && (
              <button
                onClick={addHeader}
                className="text-xs text-[var(--color-primary)] font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus size={13} /> Add Header
              </button>
            )}
          </div>

          {/* Request Tab Content */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {activeReqTab === 'headers' && (
              <div className="space-y-2">
                {headers.map((h, idx) => (
                  <div key={idx} className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                    <input
                      type="checkbox"
                      checked={h.enabled}
                      onChange={e => updateHeader(idx, 'enabled', e.target.checked)}
                      className="accent-[var(--color-primary)] cursor-pointer"
                    />
                    <input
                      type="text"
                      placeholder="Header Name"
                      value={h.key}
                      onChange={e => updateHeader(idx, 'key', e.target.value)}
                      className="w-full sm:w-1/3 px-3 py-2 text-xs font-mono rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text-primary)] outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Header Value"
                      value={h.value}
                      onChange={e => updateHeader(idx, 'value', e.target.value)}
                      className="flex-1 px-3 py-2 text-xs font-mono rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text-primary)] outline-none min-w-[120px]"
                    />
                    <button
                      onClick={() => removeHeader(idx)}
                      className="p-1.5 text-zinc-500 hover:text-red-400 cursor-pointer transition-colors"
                      title="Remove Header"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeReqTab === 'body' && (
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                disabled={['GET', 'HEAD'].includes(method)}
                placeholder={['GET', 'HEAD'].includes(method) ? 'Request body not applicable for GET/HEAD requests.' : '{\n  "username": "admin",\n  "query": "SELECT * FROM users"\n}'}
                className="w-full h-full p-4 text-xs font-mono rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text-primary)] outline-none resize-none"
              />
            )}
          </div>

          {/* SSRF Guard Alert Banner */}
          {ssrfWarning && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle size={15} className="text-amber-400" />
                <span>SSRF Guard Intercept</span>
              </div>
              <p className="text-xs text-amber-200/80 leading-relaxed">
                {ssrfWarning}
              </p>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setSsrfWarning(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSend(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 text-white hover:bg-amber-500 cursor-pointer"
                >
                  Confirm Internal Replay
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: RESPONSE VIEWER (6 COLS) ── */}
        <div className="lg:col-span-6 card p-3 sm:p-4 md:p-6 space-y-4 flex flex-col min-h-[480px] lg:h-[76vh] rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm">
          {/* Response Status Bar */}
          <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                Response
              </span>
              {response?.response_status ? (
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                  response.response_status < 300 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                    : response.response_status < 400
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}>
                  {response.response_status} {response.response_status === 200 ? 'OK' : ''}
                </span>
              ) : null}

              {response?.duration_ms !== undefined && (
                <span className="text-xs font-mono text-[var(--color-text-muted)] flex items-center gap-1">
                  <Clock size={12} /> {response.duration_ms} ms
                </span>
              )}
            </div>

            {response?.response_body && (
              <button
                onClick={handleCopyBody}
                className="text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1 cursor-pointer font-bold"
              >
                {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                <span>{copied ? 'Copied!' : 'Copy Body'}</span>
              </button>
            )}
          </div>

          {/* Response Sub-tabs */}
          <div className="flex gap-2">
            {(['pretty', 'raw', 'headers'] as const).map(t => (
              <button
                key={t}
                onClick={() => setActiveRespTab(t)}
                className={`px-3 py-1.5 text-xs font-semibold capitalize rounded-lg transition-all cursor-pointer ${
                  activeRespTab === t ? 'bg-[var(--color-primary-glow)] text-[var(--color-primary)] font-bold' : 'text-[var(--color-text-muted)] hover:text-white'
                }`}
              >
                {t} {t === 'headers' && response?.response_headers ? `(${Object.keys(response.response_headers).length})` : ''}
              </button>
            ))}
          </div>

          {/* Response Content Viewport */}
          <div className="flex-1 overflow-y-auto rounded-xl bg-black/40 border border-white/5 p-4 text-xs font-mono">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center text-[var(--color-text-muted)] space-y-2">
                <RefreshCw size={24} className="animate-spin text-[var(--color-primary)]" />
                <span className="text-xs font-medium">Replaying raw request...</span>
              </div>
            ) : error ? (
              <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 text-rose-300 space-y-2">
                <div className="font-bold flex items-center gap-2">
                  <AlertTriangle size={16} className="text-rose-400" />
                  <span>Network Request Alert</span>
                </div>
                <p className="text-xs text-rose-200/80 leading-relaxed font-sans">{error}</p>
                <div className="pt-2 text-xs text-zinc-400 font-mono flex items-center gap-1.5">
                  <Terminal size={12} /> Local Backend: http://127.0.0.1:8000 (FastAPI Security Engine)
                </div>
              </div>
            ) : !response ? (
              <div className="h-full flex flex-col items-center justify-center text-[var(--color-text-muted)] space-y-2">
                <Server size={30} className="opacity-30" />
                <span className="text-xs">Ready. Click 'Send' to dispatch and inspect response.</span>
              </div>
            ) : (
              <>
                {activeRespTab === 'pretty' && (
                  <pre className="text-emerald-300 select-text whitespace-pre-wrap leading-relaxed">
                    {response.response_body || '[Empty Response Body]'}
                  </pre>
                )}

                {activeRespTab === 'raw' && (
                  <pre className="text-zinc-300 select-text whitespace-pre-wrap leading-relaxed">
                    {response.response_body || '[Empty Response Body]'}
                  </pre>
                )}

                {activeRespTab === 'headers' && (
                  <div className="space-y-1.5">
                    {Object.entries(response.response_headers || {}).map(([k, v]: any) => (
                      <div key={k} className="flex gap-2 text-xs">
                        <span className="text-cyan-400 font-bold">{k}:</span>
                        <span className="text-zinc-300 font-mono break-all">{v}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default HttpRepeater;