import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Shell } from './components/layout/Shell';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Overview } from './pages/Overview';
import { LandingPage } from './pages/LandingPage';
import { DesignSystem } from './pages/DesignSystem';
import { Scans } from './pages/Scans';
import { Findings } from './pages/Findings';
import { Recon } from './pages/Recon';
import { LiveCapture } from './pages/LiveCapture';
import { TraceIngest } from './pages/TraceIngest';
import { LogIngest } from './pages/LogIngest';
import { Automation } from './pages/Automation';
import { Reports } from './pages/Reports';
import { Integrations } from './pages/Integrations';
import { Settings } from './pages/Settings';
import TraceForensics from './pages/TraceForensics';
import { DastHub } from './pages/DastHub';
import { HttpRepeater } from './pages/HttpRepeater';
import { BaselineDiff } from './pages/BaselineDiff';
import { ZenmapStudio } from './pages/ZenmapStudio';

import { PipelineRuns } from './pages/PipelineRuns';
import { Repositories } from './pages/Repositories';
import { ThreatIntel } from './pages/ThreatIntel';
import { ComplianceMatrix } from './pages/ComplianceMatrix';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Shell>
          <ErrorBoundary>
            <Routes>
              <Route path="/"             element={<Overview />} />
              <Route path="/pipeline"     element={<PipelineRuns />} />
              <Route path="/repos"        element={<Repositories />} />
              <Route path="/threat-intel" element={<ThreatIntel />} />
              <Route path="/compliance"   element={<ComplianceMatrix />} />
              <Route path="/landing"      element={<LandingPage />} />
              <Route path="/design-system" element={<DesignSystem />} />
              <Route path="/scans/*"      element={<Scans />} />
              <Route path="/findings"     element={<Findings />} />
              <Route path="/repeater"     element={<HttpRepeater />} />
              <Route path="/diff"         element={<BaselineDiff />} />
              <Route path="/zenmap"       element={<ZenmapStudio />} />
              <Route path="/recon"        element={<Recon />} />
              <Route path="/live-capture" element={<LiveCapture />} />
              <Route path="/trace-ingest" element={<TraceIngest />} />
              <Route path="/log-ingest"   element={<LogIngest />} />
              <Route path="/automation"   element={<Automation />} />
              <Route path="/reports"      element={<Reports />} />
              <Route path="/integrations" element={<Integrations />} />
              <Route path="/settings"     element={<Settings />} />
              <Route path="/forensics"    element={<TraceForensics />} />
              <Route path="/dast"         element={<DastHub />} />
              <Route path="*"             element={<Navigate to="/" replace />} />
            </Routes>
          </ErrorBoundary>
        </Shell>
      </BrowserRouter>
    </QueryClientProvider>
  );
};