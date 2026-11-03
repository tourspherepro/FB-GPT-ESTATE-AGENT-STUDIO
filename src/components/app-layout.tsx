
'use client';

import { DashboardProvider } from '@/context/DashboardContext';
import { AICopilotPanel } from './ai-copilot-panel';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { isDesignMode } = useAuth();
  return (
    <ProtectedRoute>
        <DashboardProvider>
          <div className="relative min-h-screen bg-slate-50">
            <div className="absolute inset-0 z-0 overflow-hidden">
              <div className="absolute left-0 top-0 h-[500px] w-full animate-gradient-pulse bg-[length:200%_200%] bg-gradient-to-br from-cyan-500/10 via-blue-500/0 to-transparent opacity-50 blur-3xl"></div>
            </div>
            <div className="relative z-10">
              {isDesignMode && (
                <div className="border-b border-amber-200 bg-amber-50 px-6 py-3 text-sm text-amber-900">
                  <div className="container mx-auto flex flex-wrap items-center justify-between gap-3">
                    <span className="font-semibold">LOCAL DESIGN MODE — Actual interface, sample profile, no live data or saving</span>
                    <div className="flex flex-wrap gap-4 font-semibold underline">
                      <a href="/dashboard?design=user">User dashboard</a>
                      <a href="/admin?design=admin">Admin dashboard</a>
                      <a href="/login">Login</a>
                    </div>
                  </div>
                </div>
              )}
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
