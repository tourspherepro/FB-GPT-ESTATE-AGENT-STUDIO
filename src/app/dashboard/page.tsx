
'use client';

import { AppLayout } from '@/components/app-layout';
import { ToolCard } from '@/components/tool-card';
import {
  BarChart,
  ScanLine,
  Share2,
  Users,
  PoundSterling,
  Orbit,
  Image as ImageIcon,
  PhoneCall,
  Mail,
  Clapperboard,
  Repeat,
  BookUser
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { GreetingHeader } from '@/components/dashboard/greeting-header';

import { DashboardContent } from '@/components/dashboard/dashboard-content';

export default function DashboardPage() {
  const { loading, user, isDesignMode } = useAuth();

  if (loading || (!user && !isDesignMode)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        <DashboardContent />
        <footer className="text-center py-12 mt-4 text-sm text-slate-500 border-t border-slate-200">
          © 2025 EASTUDIO — For estate agents, built by estate agents.
        </footer>
      </div>
    </AppLayout>
  );
}
