import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught component error in ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-2xl mx-auto my-12 rounded-2xl glass-card border border-rose-500/30 bg-rose-950/20 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
            <AlertTriangle size={24} />
          </div>
          
          <div>
            <h2 className="text-base font-bold text-[var(--color-text-primary)]">
              {this.props.fallbackTitle || 'Component Rendering Exception'}
            </h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              A state or data anomaly occurred while rendering this view. Your session and settings are safe.
            </p>
          </div>

          {this.state.error && (
            <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-left font-mono text-xs text-rose-300 max-h-32 overflow-auto">
              {this.state.error.toString()}
            </div>
          )}

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 shadow-md cursor-pointer flex items-center gap-1.5 transition-all"
            >
              <RefreshCw size={13} /> Reload Page
            </button>
            <a
              href="/"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--color-text-secondary)] hover:text-white glass-panel cursor-pointer flex items-center gap-1.5 transition-all"
            >
              <Home size={13} /> Return to Dashboard
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}