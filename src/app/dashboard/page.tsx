
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

const allTools = [
  {
    name: 'EA Valuation',
    description: 'Generate property valuations and market reports.',
    href: '/ea-valuation',
    icon: <PoundSterling className="w-6 h-6" />,
    id: 'ea-valuation',
  },
  {
    name: 'EA Floor Plan Pro',
    description: 'Convert sketches into 2D and 3D floor plans.',
    href: '/floor-plan-maestro',
    icon: <ScanLine className="w-6 h-6" />,
    id: 'ea-floor-plan-pro',
  },
  {
    name: 'EA Image Pro',
    description: 'Enhance property photos using AI tools.',
    href: '/ea-image-pro',
    icon: <ImageIcon className="w-6 h-6" />,
    id: 'ea-image-pro',
  },
  {
    name: 'EA 360',
    description: 'Create virtual tours and immersive visuals.',
    href: '/ea-360',
    icon: <Orbit className="w-6 h-6" />,
    id: 'ea-360',
  },
  {
    name: 'EA Analyse & Describe',
    description: 'Generate marketing descriptions and summaries.',
    href: '/ea-analyse',
    icon: <BarChart className="w-6 h-6" />,
    id: 'ea-analyse',
  },
  {
    name: 'Socials',
    description: 'Create and schedule AI-powered posts.',
    href: '/socials',
    icon: <Share2 className="w-6 h-6" />,
    id: 'socials',
  },
  {
    name: 'EACALLER',
    description: 'Firebase AI Outbound Calling Agent.',
    href: '/eacaller',
    icon: <PhoneCall className="w-6 h-6" />,
    id: 'eacaller',
  },
  {
    name: 'Outlook Voice Assistant',
    description: 'Control Outlook with your voice.',
    href: '/outlook-voice-assistant',
    icon: <Mail className="w-6 h-6" />,
    id: 'outlook-voice-assistant',
  },
  {
    name: 'Creator Studio',
    description: 'Generate images and videos using AI.',
    href: '/creator-studio',
    icon: <Clapperboard className="w-6 h-6" />,
    id: 'creator-studio',
  },
  {
    name: 'EA-ALTO',
    description: 'Synchronize property data with your Alto account.',
    href: '/ea-alto',
    icon: <Repeat className="w-6 h-6" />,
    id: 'ea-alto',
  },
  {
    name: 'EACanvass',
    description: 'Generate and manage canvassing leads and materials.',
    href: '/eacanvass',
    icon: <BookUser className="w-6 h-6" />,
    id: 'eacanvass',
  },
];

const adminTool = {
  name: 'Admin Panel',
  description: 'Manage users, permissions, and agency data.',
  href: '/admin',
  icon: <Users className="w-6 h-6" />,
  id: 'admin',
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.5,
      ease: 'easeOut',
    },
  }),
};

function DashboardContent() {
  const { userProfile, loading, effectiveRole } = useAuth();

  const visibleTools = useMemo(() => {
    let tools = [...allTools];
    
    // Add admin tool if the user is an admin or superadmin
    if (effectiveRole === 'admin' || effectiveRole === 'superadmin') {
      tools.push(adminTool);
    }
    
    // Filter tools based on permissions if the user is not an admin
    if (effectiveRole !== 'admin' && effectiveRole !== 'superadmin') {
      tools = allTools.filter((tool) => {
        if (!userProfile) return true; // Show all while loading profile
        if (userProfile.permissions?.includes('all')) return true;
        return userProfile.permissions?.includes(tool.id);
      });
    }

    return tools;
  }, [userProfile, effectiveRole]);

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <GreetingHeader name={userProfile?.name || 'User'} />

      {visibleTools.length > 0 ? (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          initial="hidden"
          animate="visible"
        >
          {visibleTools.map((tool, index) => (
            <motion.div
              key={tool.id}
              custom={index}
              variants={cardVariants}
              className="w-full max-w-sm h-[160px]"
            >
              <ToolCard {...tool} />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <h3 className="text-lg font-semibold">No Tools Available</h3>
          <p>Your account does not have any tools assigned. Please contact your administrator.</p>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { loading, user } = useAuth();

  if (loading || !user) {
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
