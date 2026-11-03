
'use client';

import { DashboardProvider } from '@/context/DashboardContext';
import { AICopilotPanel } from './ai-copilot-panel';
import { ProtectedRoute } from './ProtectedRoute';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
        <DashboardProvider>
          <div className="relative min-h-screen bg-slate-50">
            <div className="absolute inset-0 z-0 overflow-hidden">
              <div className="absolute left-0 top-0 h-[500px] w-full animate-gradient-pulse bg-[length:200%_200%] bg-gradient-to-br from-cyan-500/10 via-blue-500/0 to-transparent opacity-50 blur-3xl"></div>
            </div>
            <div className="relative z-10">
              <main className="container mx-auto px-6 sm:px-8 py-8">
                {children}
              </main>
              <AICopilotPanel />
            </div>
          </div>
        </DashboardProvider>
    </ProtectedRoute>
  );
}
