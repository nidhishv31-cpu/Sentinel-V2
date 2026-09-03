import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plug, CheckCircle2, AlertCircle, ExternalLink, Send, GitPullRequest, Check } from 'lucide-react';

import { useScanStore } from '../store/scanStore';
import { api } from '../api/client';

const INTEGRATIONS = [
  { name: 'Jira',         desc: 'Auto-create tickets for findings',      color: '#0052CC' },
  { name: 'Slack',        desc: 'Send alerts to a Slack channel',        color: '#4A154B' },
  { name: 'GitHub',       desc: 'Open issues in your repo',              color: '#24292f' },
  { name: 'PagerDuty',    desc: 'Page on-call for critical findings',    color: '#06AC38' },
  { name: 'Email',        desc: 'Send email digests and alerts',         color: '#EA4335' },
  { name: 'Webhook',      desc: 'POST findings to any endpoint',         color: '#6b7280' },
  { name: 'Splunk',       desc: 'Stream findings to your SIEM',          color: '#FF5733' },
  { name: 'DefectDojo',   desc: 'Export to vulnerability management',    color: '#3b82f6' },
];

export const Integrations: React.FC = () => {
  const { integrations, toggleIntegration } = useScanStore();
  const [activeModal, setActiveModal] = useState<'webhook' | 'github' | null>(null);
  const [webhookUrlInput, setWebhookUrlInput] = useState('https://discord.com/api/webhooks/demo-scanner-channel');
  const [githubRepoInput, setGithubRepoInput] = useState('company/security-scanner');
  const [actionStatus, setActionStatus] = useState<string | null>(null);

  const handleTestWebhook = async () => {
    setActionStatus('Dispatching webhook payload...');
    const res = await api.triggerWebhook(webhookUrlInput, 'https://example.com/target-site', 5, 'CRITICAL');
    if (res.success) {
      setActionStatus(`✅ ${res.message}`);
    } else {
      setActionStatus(`❌ ${res.message}`);
    }
  };

  const handleTestGithubIssue = async () => {
    setActionStatus('Creating GitHub issue...');
    const res = await api.createGithubIssue('[SECURITY] Critical SQL Injection in /api/users', 'Automated finding from VulnScan Platform', githubRepoInput);
    if (res.success && res.issueUrl) {
      setActionStatus(`✅ Issue #${res.issueNumber} created: ${res.issueUrl}`);
    } else {
      setActionStatus('❌ Failed to create GitHub issue');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="mb-5">
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Integrations & Webhooks</h1>
        <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
          Connect VulnScan to your existing tools, webhooks, and issue trackers
        </p>
      </div>

      <motion.div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {INTEGRATIONS.map((intg, i) => {
          const isConnected = !!integrations[intg.name];
          return (
            <motion.div key={intg.name} className="card p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold text-white"
                  style={{ background: intg.color }}>
                  {intg.name[0]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>{intg.name}</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{intg.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-end">
                {intg.name === 'Webhook' && (
                  <button
                    onClick={() => { setActiveModal('webhook'); setActionStatus(null); }}
                    className="flex items-center justify-center gap-1 text-xs font-semibold px-2.5 py-1.5 min-h-[44px] sm:min-h-0 rounded-lg transition-all"
                    style={{ background: 'var(--color-surface-2)', color: 'var(--color-text)', border: '1px solid var(--color-border)', cursor: 'pointer' }}
                  >
                    <Send size={10} /> Test
                  </button>
                )}
                {intg.name === 'GitHub' && (
                  <button
                    onClick={() => { setActiveModal('github'); setActionStatus(null); }}
                    className="flex items-center justify-center gap-1 text-xs font-semibold px-2.5 py-1.5 min-h-[44px] sm:min-h-0 rounded-lg transition-all"
                    style={{ background: 'var(--color-surface-2)', color: 'var(--color-text)', border: '1px solid var(--color-border)', cursor: 'pointer' }}
                  >
                    <GitPullRequest size={10} /> Issue
                  </button>
                )}
                {isConnected ? (
                  <button onClick={() => toggleIntegration(intg.name)} className="flex items-center justify-center gap-1 text-xs font-semibold px-2.5 py-1.5 min-h-[44px] sm:min-h-0 rounded-lg transition-all hover:scale-105"
                    style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: 'none', cursor: 'pointer' }}>
                    <CheckCircle2 size={10} /> Connected
                  </button>
                ) : (
                  <button onClick={() => toggleIntegration(intg.name)} className="flex items-center justify-center gap-1.5 px-3 py-1.5 min-h-[44px] sm:min-h-0 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                    style={{ background: 'var(--color-surface-2)', color: 'var(--color-text)', border: '1px solid var(--color-border)', cursor: 'pointer' }}>
                    <Plug size={11} /> Connect
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* WEBHOOK / GITHUB MODALS */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card w-full max-w-md p-4 sm:p-5 space-y-4 shadow-xl"
              style={{ background: 'var(--color-surface)' }}
            >
              <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                {activeModal === 'webhook' ? <Send size={15} className="text-indigo-500" /> : <GitPullRequest size={15} className="text-emerald-500" />}
                {activeModal === 'webhook' ? 'Test Custom Webhook Payload' : 'Create GitHub Issue for Finding'}
              </h3>

              {activeModal === 'webhook' ? (
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>Target Webhook Endpoint URL</label>
                  <input
                    type="text"
                    value={webhookUrlInput}
                    onChange={e => setWebhookUrlInput(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg outline-none font-mono"
                    style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>GitHub Repository (owner/repo)</label>
                  <input
                    type="text"
                    value={githubRepoInput}
                    onChange={e => setGithubRepoInput(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg outline-none font-mono"
                    style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                  />
                </div>
              )}

              {actionStatus && (
                <div className="p-2.5 rounded-lg text-xs font-mono" style={{ background: 'var(--color-surface-2)', color: 'var(--color-text)' }}>
                  {actionStatus}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-3 py-1.5 min-h-[44px] sm:min-h-0 rounded-lg text-xs font-semibold"
                  style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)', border: 'none', cursor: 'pointer' }}
                >
                  Close
                </button>
                <button
                  onClick={activeModal === 'webhook' ? handleTestWebhook : handleTestGithubIssue}
                  className="px-4 py-1.5 min-h-[44px] sm:min-h-0 rounded-lg text-xs font-semibold text-white"
                  style={{ background: 'var(--color-accent)', border: 'none', cursor: 'pointer' }}
                >
                  {activeModal === 'webhook' ? 'Send Webhook Alert' : 'Create GitHub Issue'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};