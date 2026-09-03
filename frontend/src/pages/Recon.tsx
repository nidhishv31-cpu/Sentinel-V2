import React from 'react';
import { motion } from 'framer-motion';
import { Globe, Wifi } from 'lucide-react';
import { useRecon } from '../api/hooks';
import { EmptyPage } from './Findings';

export const Recon: React.FC = () => {
  const { data } = useRecon();
  const isEmpty = !data || data.requestsPerWindow.length === 0;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-5">
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Recon</h1>
        <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
          Attack surface discovery and reconnaissance results
        </p>
      </div>

      {isEmpty ? (
        <EmptyPage icon={<Globe size={28} />} title="No recon data" desc="Run a scan to discover your attack surface — endpoints, subdomains, exposed services" />
      ) : (
        <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Connector health */}
          <div className="card p-3 sm:p-4">
            <p className="text-xs font-semibold mb-3" style={{ color: 'var(--color-text-muted)' }}>Connector Status</p>
            <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
              {[
                { label: 'Active',    val: data.connectors.active,    color: '#10b981' },
                { label: 'Unhealthy', val: data.connectors.unhealthy, color: 'var(--sev-critical)' },
                { label: 'Total',     val: data.connectors.total,     color: 'var(--color-text)' },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <p className="text-lg sm:text-xl font-bold" style={{ color: s.color }}>{s.val}</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-faint)' }}>{s.label}</p>
                </div>
              ))}
            </div>
            {data.integrationStatus.map(s => (
              <div key={s.name} className="flex items-center justify-between py-2" style={{ borderTop: '1px solid var(--color-border)' }}>
                <div className="flex items-center gap-2">
                  <Wifi size={13} style={{ color: 'var(--color-text-muted)' }} />
                  <span className="text-xs" style={{ color: 'var(--color-text)' }}>{s.name}</span>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                  {s.status}
                </span>
              </div>
            ))}
          </div>

          {/* Finding types */}
          <div className="card p-3 sm:p-4">
            <p className="text-xs font-semibold mb-3" style={{ color: 'var(--color-text-muted)' }}>Discovered Assets</p>
            <div className="space-y-2">
              {data.findingsByType.map(f => {
                const maxVal = Math.max(...data.findingsByType.map(x => x.count));
                const pct = maxVal > 0 ? (f.count / maxVal) * 100 : 0;
                return (
                  <div key={f.type}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs" style={{ color: 'var(--color-text)' }}>{f.type}</span>
                      <span className="text-xs font-semibold tabular" style={{ color: 'var(--color-text-muted)' }}>{f.count.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-surface-2)' }}>
                      <motion.div className="h-full rounded-full"
                        style={{ background: 'var(--color-accent)' }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Request volume */}
          <div className="card p-3 sm:p-4 md:col-span-2">
            <p className="text-xs font-semibold mb-3" style={{ color: 'var(--color-text-muted)' }}>Request Volume by Window</p>
            <div className="flex items-end gap-1 h-24 overflow-x-auto pb-1">
              {data.requestsPerWindow.map((w, i) => {
                const maxR = Math.max(...data.requestsPerWindow.map(x => x.requests));
                const h = maxR > 0 ? (w.requests / maxR) * 100 : 0;
                return (
                  <div key={i} className="flex-1 min-w-[28px] flex flex-col items-center gap-1">
                    <motion.div className="w-full rounded-t"
                      style={{ background: 'var(--color-accent)' }}
                      initial={{ height: "0%" }}
                      animate={{ height: `${h}%` }}
                      transition={{ duration: 0.5, delay: i * 0.05 }} />
                    <span className="text-[9px]" style={{ color: 'var(--color-text-faint)' }}>{w.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Discovered Assets Details Table */}
          <div className="card p-3 sm:p-4 md:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>Discovered Host & Port Details</p>
                <p className="text-xs" style={{ color: 'var(--color-text-faint)' }}>Active subdomains and open ports mapped during current scan window</p>
              </div>
              <span className="glass-badge text-xs uppercase self-start sm:self-auto">5 Assets Discovered</span>
            </div>
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <th className="py-2 font-bold uppercase tracking-wider text-[var(--color-text-muted)] text-xs">Asset Target</th>
                    <th className="py-2 font-bold uppercase tracking-wider text-[var(--color-text-muted)] text-xs">Type</th>
                    <th className="py-2 font-bold uppercase tracking-wider text-[var(--color-text-muted)] text-xs">Details & Ports</th>
                    <th className="py-2 font-bold uppercase tracking-wider text-[var(--color-text-muted)] text-xs">Security Status</th>
                    <th className="py-2 font-bold uppercase tracking-wider text-[var(--color-text-muted)] text-xs">Discovery Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-subtle)] text-[var(--color-text)]">
                  {[
                    { target: 'assets.sastra.edu', type: 'Subdomain', ports: '80/tcp, 443/tcp (HTTP/S)', status: 'Active (Valid SSL)', statusColor: '#10b981', method: 'passive-dns' },
                    { target: 'portal.sastra.edu', type: 'Subdomain', ports: '80/tcp, 443/tcp, 8080/tcp (Apache)', status: 'Active (Valid SSL)', statusColor: '#10b981', method: 'dns-bruteforce' },
                    { target: 'mail.sastra.edu', type: 'Subdomain', ports: '25/tcp, 465/tcp, 587/tcp (SMTP)', status: 'SSL Cert Mismatch', statusColor: 'var(--sev-high)', method: 'mx-record-lookup' },
                    { target: 'db-internal.sastra.edu', type: 'Database Host', ports: '3306/tcp (MySQL)', status: 'Port Exposed to WAN', statusColor: 'var(--sev-critical)', method: 'sub-crawl' },
                    { target: 'vpn.sastra.edu', type: 'Gateway', ports: '1194/udp (OpenVPN)', status: 'Active (Self-Signed)', statusColor: 'var(--sev-medium)', method: 'active-recon' }
                  ].map((asset, i) => (
                    <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 font-semibold font-mono text-[var(--color-text-primary)]">{asset.target}</td>
                      <td className="py-3 text-[var(--color-text-secondary)]">{asset.type}</td>
                      <td className="py-3 font-mono text-[var(--color-text-secondary)]">{asset.ports}</td>
                      <td className="py-3">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: asset.statusColor }} />
                          {asset.status}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-[var(--color-text-faint)] text-xs">{asset.method}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Grid View */}
            <div className="grid grid-cols-1 gap-3 md:hidden">
              {[
                { target: 'assets.sastra.edu', type: 'Subdomain', ports: '80/tcp, 443/tcp (HTTP/S)', status: 'Active (Valid SSL)', statusColor: '#10b981', method: 'passive-dns' },
                { target: 'portal.sastra.edu', type: 'Subdomain', ports: '80/tcp, 443/tcp, 8080/tcp (Apache)', status: 'Active (Valid SSL)', statusColor: '#10b981', method: 'dns-bruteforce' },
                { target: 'mail.sastra.edu', type: 'Subdomain', ports: '25/tcp, 465/tcp, 587/tcp (SMTP)', status: 'SSL Cert Mismatch', statusColor: 'var(--sev-high)', method: 'mx-record-lookup' },
                { target: 'db-internal.sastra.edu', type: 'Database Host', ports: '3306/tcp (MySQL)', status: 'Port Exposed to WAN', statusColor: 'var(--sev-critical)', method: 'sub-crawl' },
                { target: 'vpn.sastra.edu', type: 'Gateway', ports: '1194/udp (OpenVPN)', status: 'Active (Self-Signed)', statusColor: 'var(--sev-medium)', method: 'active-recon' }
              ].map((asset, i) => (
                <div key={i} className="card p-3 space-y-2 border border-[var(--color-border-subtle)]" style={{ background: 'var(--color-surface-2)' }}>
                  <div className="flex justify-between items-start">
                    <p className="font-semibold font-mono text-[var(--color-text-primary)] text-xs break-all pr-2">{asset.target}</p>
                    <span className="text-[9px] font-mono text-[var(--color-text-faint)] px-1.5 py-0.5 rounded bg-white/5 shrink-0">{asset.type}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs pt-1 border-t border-white/5">
                    <span className="text-[var(--color-text-muted)]">Ports:</span>
                    <span className="font-mono text-[var(--color-text-secondary)]">{asset.ports}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[var(--color-text-muted)]">Status:</span>
                    <span className="inline-flex items-center gap-1.5 font-bold" style={{ color: asset.statusColor }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {asset.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[var(--color-text-muted)]">Method:</span>
                    <span className="font-mono text-[var(--color-text-faint)]">{asset.method}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};