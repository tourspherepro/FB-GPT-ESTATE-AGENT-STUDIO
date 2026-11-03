'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { PlusCircle, Pencil, Camera, BarChart2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useState, useEffect } from 'react';

type GreetingHeaderProps = {
  name: string;
};

const quickActions = [
    { tooltip: 'Add Property', icon: <PlusCircle className="w-5 h-5" /> },
    { tooltip: 'Generate Description', icon: <Pencil className="w-5 h-5" /> },
    { tooltip: 'Enhance Photo', icon: <Camera className="w-5 h-5" /> },
    { tooltip: 'View Insights', icon: <BarChart2 className="w-5 h-5" /> },
];

export function GreetingHeader({ name }: GreetingHeaderProps) {
  const [today, setToday] = useState<string | null>(null);

  useEffect(() => {
    // We set the date inside useEffect to avoid hydration mismatches
    // between the server and the client.
    setToday(new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="mb-4"
    >
      <div className="flex justify-between items-center p-4 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-blue-600/10">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Welcome back, {name} 👋
          </h1>
          <p className="mt-1 text-slate-500">
            Your AI-powered property tools at a glance. {today ? `· ${today}` : ''}
          </p>
        </div>

        <TooltipProvider>
            <div className="flex items-center gap-3 p-2 rounded-full bg-gradient-to-r from-cyan-500/10 to-blue-600/10 hover:shadow-lg transition-shadow">
                {quickActions.map((action) => (
                    <Tooltip key={action.tooltip}>
                        <TooltipTrigger asChild>
                            <Button
                                variant="default"
                                size="icon"
                                className="w-9 h-9 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg hover:shadow-blue-500/30 transform hover:scale-105 transition-all duration-300"
                            >
                                {action.icon}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{action.tooltip}</p>
                        </TooltipContent>
                    </Tooltip>
                ))}
            </div>
        </TooltipProvider>

      </div>
    </motion.div>
  );
}
