
"use client";

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from './ui/button';
import Link from 'next/link';
import EAValuationMock from './mocks/EAValuationMock';
import AIBrochureMock from './mocks/AIBrochureMock';
import EAMailerMock from './mocks/EAMailerMock';
import SocialPostMock from './mocks/SocialPostMock';
import MarketTrendsMock from './mocks/MarketTrendsMock';

interface Tool {
  id: string;
  title: string;
  fullDescription: string;
  icon: React.ReactNode;
}

interface ToolModalProps {
  tool: Tool;
  onClose: () => void;
}

const mockMap: { [key: string]: React.ComponentType } = {
  'ea-valuation': EAValuationMock,
  'ai-brochure': AIBrochureMock,
  'ea-mailer': EAMailerMock,
  'socials': SocialPostMock,
  'market-trends': MarketTrendsMock,
};

export function ToolModal({ tool, onClose }: ToolModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const MockComponent = mockMap[tool.id];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-md p-4"
      >
        <motion.div
          ref={modalRef}
          initial={{ scale: 0.9, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 50 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="relative bg-slate-900/90 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl w-full max-w-4xl grid md:grid-cols-2 overflow-hidden"
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white z-10">
            <X size={24} />
          </button>
          
          <div className="p-8 md:p-10 flex flex-col justify-center text-white text-center md:text-left">
             <div className="w-16 h-16 mx-auto md:mx-0 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white mb-6 shadow-inner">
                {React.cloneElement(tool.icon as React.ReactElement, { className: "w-8 h-8" })}
            </div>
            <h2 className="text-3xl font-bold font-heading">{tool.title}</h2>
            <p className="mt-4 text-lg text-white/80">{tool.fullDescription}</p>
             <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Button asChild className="bg-gradient-to-r from-teal-400 to-cyan-500 text-white shadow-lg transform hover:scale-105 transition-transform">
                    <Link href={`/${tool.id}`}>Try This Tool</Link>
                </Button>
                <Button variant="outline" onClick={onClose} className="bg-transparent text-white/80 border-white/20 hover:bg-white/10 hover:text-white">
                    Close
                </Button>
            </div>
          </div>
          
          <div className="hidden md:flex items-center justify-center p-10 bg-white/5">
            <div className="w-full h-full rounded-lg border-2 border-dashed border-white/10 flex items-center justify-center">
                 {MockComponent ? (
                    <div className="w-full h-full p-4">
                        <MockComponent />
                    </div>
                 ) : (
                   <p className="text-white/30">Visual placeholder</p>
                 )}
            </div>
          </div>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
