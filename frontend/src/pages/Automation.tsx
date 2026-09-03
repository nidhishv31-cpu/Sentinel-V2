import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Play, Pause, Plus, Trash2, Clock, Globe, RefreshCw, Mail, History, Calendar, Check, Eye, X, Filter, Send } from 'lucide-react';
import { api } from '../api/client';

const DAYS_OF_WEEK = [
  { id: '1', name: 'Mon' },
  { id: '2', name: 'Tue' },
  { id: '3', name: 'Wed' },
  { id: '4', name: 'Thu' },
  { id: '5', name: 'Fri' },
  { id: '6', name: 'Sat' },
  { id: '0', name: 'Sun' },
];

export function getCronHumanLabel(cron: string): string {
  if (!cron) return 'Manual';
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return cron;

  const [min, hour, dom, mon, dow] = parts;

  if (cron === '*/5 * * * *') return 'Every 5 Minutes';
  if (cron === '*/15 * * * *') return 'Every 15 Minutes';
  if (cron === '0 * * * *') return 'Hourly at :00';
  if (cron === '0 0 * * *') return 'Daily at Midnight (00:00)';

  let timeStr = '';
  if (min !== '*' && hour !== '*') {
    const h = parseInt(hour, 10);
    const m = parseInt(min, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    const displayM = m < 10 ? `0${m}` : m;
    timeStr = `at ${displayH}:${displayM} ${ampm}`;
  }

  if (dow !== '*') {
    const dayIds = dow.split(',');
    const dayNames = dayIds.map(id => {
      const found = DAYS_OF_WEEK.find(d => d.id === id);
      return found ? found.name : id;
    }).join(', ');
    return `${dayNames} ${timeStr}`.trim();
  }

  if (timeStr) return `Daily ${timeStr}`;
  return cron;
}

// Live Countdown Timer component
const CountdownWidget: React.FC<{ cron: string; enabled: boolean }> = ({ cron, enabled }) => {
  const [timeLeft, setTimeLeft] = useState<string>('Calculation...');

  useEffect(() => {
    if (!enabled) {
      setTimeLeft('Paused');
      return;
    }

    const calculateNextRun = () => {
      const now = new Date();
      let nextRun = new Date();

      if (cron === '*/5 * * * *') {
        const nextMin = Math.ceil((now.getMinutes() + 0.1) / 5) * 5;
        nextRun.setMinutes(nextMin, 0, 0);
      } else if (cron === '*/15 * * * *') {
        const nextMin = Math.ceil((now.getMinutes() + 0.1) / 15) * 15;
        nextRun.setMinutes(nextMin, 0, 0);
      } else if (cron === '0 * * * *') {
        nextRun.setHours(now.getHours() + 1, 0, 0, 0);
      } else {
        // Default 5m estimation fallback
        const nextMin = Math.ceil((now.getMinutes() + 0.1) / 5) * 5;
        nextRun.setMinutes(nextMin, 0, 0);
      }

      const diffMs = nextRun.getTime() - now.getTime();
      if (diffMs <= 0) {
        setTimeLeft('Scraping due now...');
        return;
      }

      const mins = Math.floor(diffMs / 60000);
      const secs = Math.floor((diffMs % 60000) / 1000);
      const mStr = mins < 10 ? `0${mins}` : `${mins}`;
      const sStr = secs < 10 ? `0${secs}` : `${secs}`;
      setTimeLeft(`${mStr}m ${sStr}s`);
    };

    calculateNextRun();
    const interval = setInterval(calculateNextRun, 1000);
    return () => clearInterval(interval);
  }, [cron, enabled]);

  return (
    <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-500 font-semibold flex items-center gap-1">
      <Clock size={10} /> Next: {timeLeft}
    </span>
  );
};

export const Automation: React.FC = () => {
  const [targets, setTargets] = useState<{ url: string; cron: string; enabled?: boolean; selector?: string; keyword?: string; webhookUrl?: string }[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  
  // Schedule state
  const [mode, setMode] = useState<'preset' | 'days_time' | 'custom'>('preset');
  const [preset, setPreset] = useState<'5min' | '15min' | 'hourly' | 'daily'>('5min');
  const [selectedDays, setSelectedDays] = useState<string[]>(['1', '2', '3', '4', '5']); // Mon-Fri
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [customCron, setCustomCron] = useState('*/5 * * * *');
  
  // Advanced filters state
  const [selectorInput, setSelectorInput] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [webhookInput, setWebhookInput] = useState('');

  const [runningUrl, setRunningUrl] = useState<string | null>(null);
  const [runMessage, setRunMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Diff Modal State
  const [diffModalUrl, setDiffModalUrl] = useState<string | null>(null);
  const [diffData, setDiffData] = useState<{ previousContent: string; currentContent: string } | null>(null);
  const [loadingDiff, setLoadingDiff] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const [tList, lList] = await Promise.all([
      api.getCronTargets(),
      api.getScraperLogs(),
    ]);
    setTargets(tList);
    setLogs(lList);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const toggleDay = (dayId: string) => {
    if (selectedDays.includes(dayId)) {
      if (selectedDays.length > 1) {
        setSelectedDays(selectedDays.filter(d => d !== dayId));
      }
    } else {
      setSelectedDays([...selectedDays, dayId]);
    }
  };

  const computeCron = (): string => {
    if (mode === 'preset') {
      if (preset === '5min') return '*/5 * * * *';
      if (preset === '15min') return '*/15 * * * *';
      if (preset === 'hourly') return '0 * * * *';
      if (preset === 'daily') return '0 0 * * *';
    } else if (mode === 'days_time') {
      const [hStr, mStr] = scheduleTime.split(':');
      const h = parseInt(hStr || '9', 10);
      const m = parseInt(mStr || '0', 10);
      const daysCsv = selectedDays.sort().join(',');
      return `${m} ${h} * * ${daysCsv}`;
    }
    return customCron;
  };

  const handleAddTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    let finalUrl = urlInput.trim();
    if (!finalUrl.startsWith('http')) finalUrl = `https://${finalUrl}`;

    const finalCron = computeCron();
    const ok = await api.addCronTarget(
      finalUrl,
      finalCron,
      selectorInput.trim(),
      keywordInput.trim(),
      webhookInput.trim()
    );

    if (ok) {
      setUrlInput('');
      setSelectorInput('');
      setKeywordInput('');
      setWebhookInput('');
      setIsAdding(false);
      loadData();
      setRunMessage({ text: `Scheduled ${finalUrl} (${getCronHumanLabel(finalCron)})`, type: 'success' });
      setTimeout(() => setRunMessage(null), 4000);
    } else {
      setRunMessage({ text: 'Failed to save schedule', type: 'error' });
    }
  };

  const handleDeleteTarget = async (url: string) => {
    if (!confirm(`Delete cron job for ${url}?`)) return;
    const ok = await api.deleteCronTarget(url);
    if (ok) {
      loadData();
      setRunMessage({ text: `Removed ${url} schedule`, type: 'info' });
      setTimeout(() => setRunMessage(null), 3000);
    }
  };

  const handleTogglePause = async (url: string, currentEnabled: boolean) => {
    const nextEnabled = !currentEnabled;
    const ok = await api.togglePauseCronTarget(url, nextEnabled);
    if (ok) {
      loadData();
      setRunMessage({ text: `${url} schedule is now ${nextEnabled ? 'ACTIVE' : 'PAUSED'}`, type: 'info' });
      setTimeout(() => setRunMessage(null), 3000);
    }
  };

  const handleRunNow = async (url: string) => {
    setRunningUrl(url);
    setRunMessage({ text: `Triggering immediate web scrape for ${url}...`, type: 'info' });

    const result = await api.runScrapeNow(url);
    setRunningUrl(null);

    if (result.success) {
      loadData();
      if ((result as any).statusType === 'CHANGES_DETECTED') {
        setRunMessage({ text: `🚨 Website update detected! Email alert sent to nidhishv31@gmail.com.`, type: 'error' });
      } else if ((result as any).statusType === 'BASELINE_CREATED') {
        setRunMessage({ text: `Baseline snapshot saved for ${url}. Email report sent.`, type: 'success' });
      } else {
        setRunMessage({ text: `Scrape finished for ${url}. No changes detected. Email report sent.`, type: 'success' });
      }
    } else {
      setRunMessage({ text: `Scrape error: ${result.error || 'Failed to complete scrape'}`, type: 'error' });
    }
  };

  const openDiffModal = async (url: string) => {
    setDiffModalUrl(url);
    setLoadingDiff(true);
    const data = await api.getSnapshotDiff(url);
    setDiffData(data);
    setLoadingDiff(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
            <Zap size={22} className="text-indigo-500" />
            Web Scraping & Cron Job Manager
          </h1>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Schedule scrapers with specific days & times, CSS selector scoping, keyword triggers, pause/resume, and Discord/Telegram webhooks
          </p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 min-h-[44px] sm:min-h-0 rounded-lg text-xs font-medium transition-all w-full sm:w-auto"
          style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh Status
        </button>
      </div>

      {/* Banner */}
      <AnimatePresence>
        {runMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`p-3.5 rounded-xl text-xs flex items-center justify-between ${
              runMessage.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
                : runMessage.type === 'error'
                ? 'bg-red-500/10 text-red-600 border border-red-500/30'
                : 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/30'
            }`}
          >
            <span>{runMessage.text}</span>
            <button onClick={() => setRunMessage(null)} className="font-bold ml-3 hover:opacity-75">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="card p-3 sm:p-4 flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-500/10 text-indigo-500 flex-shrink-0">
            <Clock size={20} />
          </span>
          <div>
            <p className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>{targets.length}</p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Configured Schedules</p>
          </div>
        </div>

        <div className="card p-3 sm:p-4 flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-500 flex-shrink-0">
            <History size={20} />
          </span>
          <div>
            <p className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>{logs.length}</p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Changes Logged (CSV)</p>
          </div>
        </div>

        <div className="card p-3 sm:p-4 flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-500/10 text-amber-500 flex-shrink-0">
            <Mail size={20} />
          </span>
          <div>
            <p className="text-xs font-semibold truncate" style={{ color: 'var(--color-text)' }}>nidhishv31@gmail.com</p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Alert Recipient Email</p>
          </div>
        </div>
      </div>

      {/* Main Section */}
      <div className="card p-3 sm:p-4 md:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Scheduled Web Scraping Jobs</h2>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Node-cron background scheduler with live ticking countdowns and pause/resume controls
            </p>
          </div>
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 min-h-[44px] sm:min-h-0 rounded-lg text-xs font-semibold transition-all w-full sm:w-auto"
              style={{ background: 'var(--color-accent)', color: 'white', border: 'none', cursor: 'pointer' }}
            >
              <Plus size={13} />
              Schedule New Job
            </button>
          )}
        </div>

        {/* Schedule Builder Form */}
        <AnimatePresence>
          {isAdding && (
            <motion.form
              onSubmit={handleAddTarget}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-5 p-4 rounded-xl space-y-4 overflow-hidden"
              style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-accent)' }}
            >
              <h3 className="text-xs font-bold" style={{ color: 'var(--color-text)' }}>Configure Web Scraper Schedule & Advanced Filters</h3>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>Target URL</label>
                <div className="relative">
                  <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-faint)' }} />
                  <input
                    type="text"
                    required
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    placeholder="https://example.com/target-page"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg outline-none"
                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                  />
                </div>
              </div>

              {/* Mode Selection */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Schedule Mode</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {[
                    { id: 'preset', label: 'Quick Interval' },
                    { id: 'days_time', label: 'Specific Days & Time' },
                    { id: 'custom', label: 'Custom Cron' },
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMode(m.id as any)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{
                        background: mode === m.id ? 'var(--color-accent)' : 'var(--color-surface)',
                        color: mode === m.id ? 'white' : 'var(--color-text-muted)',
                        border: `1px solid ${mode === m.id ? 'var(--color-accent)' : 'var(--color-border)'}`,
                        cursor: 'pointer'
                      }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {/* Sub-UI: Preset */}
                {mode === 'preset' && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { id: '5min', label: 'Every 5 Minutes' },
                      { id: '15min', label: 'Every 15 Minutes' },
                      { id: 'hourly', label: 'Hourly' },
                      { id: 'daily', label: 'Daily (Midnight)' },
                    ].map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPreset(p.id as any)}
                        className="px-3 py-2 rounded-lg text-xs font-medium transition-all text-center"
                        style={{
                          background: preset === p.id ? 'var(--color-accent-muted)' : 'var(--color-surface)',
                          color: preset === p.id ? 'var(--color-accent)' : 'var(--color-text-muted)',
                          border: `1px solid ${preset === p.id ? 'var(--color-accent)' : 'var(--color-border)'}`,
                          cursor: 'pointer'
                        }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Sub-UI: Specific Days & Time */}
                {mode === 'days_time' && (
                  <div className="p-3 rounded-lg space-y-3" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Select Days of Week</label>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => setSelectedDays(['1','2','3','4','5'])} className="text-xs text-indigo-500 hover:underline">Weekdays</button>
                          <button type="button" onClick={() => setSelectedDays(['6','0'])} className="text-xs text-indigo-500 hover:underline">Weekends</button>
                          <button type="button" onClick={() => setSelectedDays(['0','1','2','3','4','5','6'])} className="text-xs text-indigo-500 hover:underline">All Days</button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {DAYS_OF_WEEK.map(d => {
                          const isSel = selectedDays.includes(d.id);
                          return (
                            <button
                              key={d.id}
                              type="button"
                              onClick={() => toggleDay(d.id)}
                              className="px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-all"
                              style={{
                                background: isSel ? 'var(--color-accent)' : 'var(--color-surface-2)',
                                color: isSel ? 'white' : 'var(--color-text-muted)',
                                border: `1px solid ${isSel ? 'var(--color-accent)' : 'var(--color-border)'}`,
                                cursor: 'pointer'
                              }}
                            >
                              {isSel && <Check size={10} />}
                              {d.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>Specific Time (HH:MM)</label>
                      <input
                        type="time"
                        value={scheduleTime}
                        onChange={e => setScheduleTime(e.target.value)}
                        className="px-3 py-1.5 text-xs rounded-lg outline-none"
                        style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Advanced Section: CSS Selector, Keyword Filter, Webhook */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
                <div>
                  <label className="block text-xs font-medium mb-1 flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
                    <Filter size={11} /> CSS Selector (Optional)
                  </label>
                  <input
                    type="text"
                    value={selectorInput}
                    onChange={e => setSelectorInput(e.target.value)}
                    placeholder="e.g. #results, .notice-board"
                    className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg outline-none"
                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1 flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
                    <Filter size={11} /> Keyword Trigger (Optional)
                  </label>
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={e => setKeywordInput(e.target.value)}
                    placeholder="e.g. Released, Important"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg outline-none"
                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1 flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
                    <Send size={11} /> Webhook URL (Discord / Telegram)
                  </label>
                  <input
                    type="text"
                    value={webhookInput}
                    onChange={e => setWebhookInput(e.target.value)}
                    placeholder="e.g. https://discord.com/api/webhooks/..."
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg outline-none"
                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 min-h-[44px] sm:min-h-0 rounded-lg text-xs font-semibold"
                  style={{ background: 'var(--color-accent)', color: 'white', border: 'none', cursor: 'pointer' }}
                >
                  Save Schedule
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 min-h-[44px] sm:min-h-0 rounded-lg text-xs font-medium"
                  style={{ background: 'transparent', color: 'var(--color-text-muted)', border: 'none', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Target List */}
        {targets.length === 0 ? (
          <div className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>
            <p className="text-xs font-medium">No web scraping cron jobs scheduled yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {targets.map(t => {
              const isEnabled = t.enabled !== false;
              return (
                <div
                  key={t.url}
                  className="p-3 sm:p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
                  style={{
                    background: 'var(--color-surface-2)',
                    border: `1px solid ${isEnabled ? 'var(--color-border)' : 'var(--sev-medium)'}`,
                    opacity: isEnabled ? 1 : 0.85
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isEnabled ? 'bg-indigo-500/10 text-indigo-500' : 'bg-amber-500/10 text-amber-500'
                    }`}>
                      <Globe size={16} />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold truncate" style={{ color: 'var(--color-text)' }}>{t.url}</p>
                        <span className={`text-xs font-bold px-2 py-0.2 rounded-full ${
                          isEnabled ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                        }`}>
                          {isEnabled ? '● Active' : '⏸ Paused'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 font-semibold">
                          {t.cron}
                        </span>
                        <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                          🗓️ {getCronHumanLabel(t.cron)}
                        </span>
                        <CountdownWidget cron={t.cron} enabled={isEnabled} />

                        {t.selector && (
                          <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 font-semibold">
                            scope: {t.selector}
                          </span>
                        )}
                        {t.keyword && (
                          <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600">
                            keyword: {t.keyword}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => handleTogglePause(t.url, isEnabled)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isEnabled
                          ? 'bg-amber-500/10 text-amber-600 border border-amber-500/30 hover:bg-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 hover:bg-emerald-500/20'
                      }`}
                      style={{ cursor: 'pointer' }}
                      title={isEnabled ? 'Pause schedule' : 'Resume schedule'}
                    >
                      {isEnabled ? <Pause size={12} /> : <Play size={12} />}
                      {isEnabled ? 'Pause' : 'Resume'}
                    </button>

                    <button
                      onClick={() => handleRunNow(t.url)}
                      disabled={runningUrl === t.url}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        background: 'var(--color-accent)',
                        color: 'white',
                        border: 'none',
                        cursor: runningUrl === t.url ? 'wait' : 'pointer',
                        opacity: runningUrl === t.url ? 0.7 : 1
                      }}
                    >
                      <Play size={12} className={runningUrl === t.url ? 'animate-spin' : ''} />
                      {runningUrl === t.url ? 'Scraping...' : 'Scrape Now'}
                    </button>

                    <button
                      onClick={() => handleDeleteTarget(t.url)}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                      title="Delete Cron Job"
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Change Logs Table & Visual Diff Trigger */}
      <div className="card p-3 sm:p-4 md:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Scraper Change Log & Diff History</h2>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Recorded automatically in backend/logs/changes.csv upon change detection
            </p>
          </div>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-gray-500/10 text-gray-500 w-fit">
            {logs.length} entries
          </span>
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>
            <p className="text-xs font-medium">No changes detected yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Target URL</th>
                  <th className="py-2.5 px-3">Field</th>
                  <th className="py-2.5 px-3">Old Value</th>
                  <th className="py-2.5 px-3">New Value</th>
                  <th className="py-2.5 px-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, idx) => (
                  <tr key={idx} className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="py-2.5 px-3 text-xs font-mono" style={{ color: 'var(--color-text-faint)' }}>
                      {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-indigo-500 max-w-[180px] truncate">{log.target_url}</td>
                    <td className="py-2.5 px-3 font-mono text-xs">{log.field_changed}</td>
                    <td className="py-2.5 px-3 text-red-500 font-mono text-xs max-w-[150px] truncate">{log.old_value}</td>
                    <td className="py-2.5 px-3 text-emerald-500 font-mono text-xs max-w-[150px] truncate">{log.new_value}</td>
                    <td className="py-2.5 px-3">
                      <button
                        onClick={() => openDiffModal(log.target_url)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-all bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20"
                        style={{ border: 'none', cursor: 'pointer' }}
                      >
                        <Eye size={12} /> View Diff
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Interactive Visual Diff Viewer Modal */}
      <AnimatePresence>
        {diffModalUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card w-full max-w-4xl max-h-[90vh] sm:max-h-[85vh] flex flex-col overflow-hidden shadow-2xl"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            >
              <div className="p-3 sm:p-4 flex items-center justify-between border-b" style={{ borderColor: 'var(--color-border)' }}>
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                    <Eye size={16} className="text-indigo-500" />
                    Side-by-Side Visual Diff Inspection
                  </h3>
                  <p className="text-xs font-mono text-indigo-500 truncate max-w-[260px] sm:max-w-md">{diffModalUrl}</p>
                </div>
                <button onClick={() => setDiffModalUrl(null)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-200">
                  <X size={18} />
                </button>
              </div>

              <div className="p-3 sm:p-4 flex-1 overflow-y-auto space-y-4">
                {loadingDiff ? (
                  <div className="py-12 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                    <RefreshCw size={14} className="animate-spin" /> Fetching snapshot diff data...
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-red-500 mb-2 flex items-center gap-1">
                        🔴 PREVIOUS SNAPSHOT STATE
                      </h4>
                      <pre className="p-3 text-xs font-mono rounded-lg overflow-x-auto max-h-[300px] sm:max-h-[400px] border border-red-500/30 bg-red-500/5 text-red-600 dark:text-red-400 whitespace-pre-wrap">
                        {diffData?.previousContent || 'No previous snapshot saved yet.'}
                      </pre>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-emerald-500 mb-2 flex items-center gap-1">
                        🟢 CURRENT SNAPSHOT STATE
                      </h4>
                      <pre className="p-3 text-xs font-mono rounded-lg overflow-x-auto max-h-[300px] sm:max-h-[400px] border border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 whitespace-pre-wrap">
                        {diffData?.currentContent || 'No current content snapshot found.'}
                      </pre>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3 border-t flex justify-end" style={{ borderColor: 'var(--color-border)' }}>
                <button
                  onClick={() => setDiffModalUrl(null)}
                  className="px-4 py-2 min-h-[44px] sm:min-h-0 rounded-lg text-xs font-semibold"
                  style={{ background: 'var(--color-accent)', color: 'white', border: 'none', cursor: 'pointer' }}
                >
                  Close Inspection
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};