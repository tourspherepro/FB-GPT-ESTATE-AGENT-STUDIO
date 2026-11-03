
'use client';

import React from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight,
  PlayCircle,
  BarChart,
  ScanLine,
  ImageIcon,
  Orbit,
  Share2,
  Receipt,
  FileText,
  AreaChart,
  Mail,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import EAValuationMock from '@/components/mocks/EAValuationMock';
import AIBrochureMock from '@/components/mocks/AIBrochureMock';
import EAMailerMock from '@/components/mocks/EAMailerMock';
import SocialPostMock from '@/components/mocks/SocialPostMock';
import MarketTrendsMock from '@/components/mocks/MarketTrendsMock';


// --- Reusable Feature Section Component ---
interface FeatureSectionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  reverse?: boolean;
}

const FeatureSection: React.FC<FeatureSectionProps> = ({ title, description, icon, children, reverse = false }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [50, -50]);
  const opacity = useTransform(scrollYProgress, [0, 0.4, 0.6, 1], [0, 1, 1, 0]);

  return (
    <motion.section
      ref={ref}
      style={{ y }}
      className={`relative py-24 sm:py-32 flex items-center min-h-[70vh] overflow-hidden`}
    >
      <div className="container mx-auto px-6 sm:px-8">
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-12 items-center ${reverse ? 'md:flex-row-reverse' : ''}`}>
          <motion.div
            style={{ opacity }}
            className={`flex flex-col ${reverse ? 'md:items-end md:text-right' : 'md:items-start'}`}
          >
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-teal-300 mb-6 shadow-inner border border-white/20">
              {icon}
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold font-heading tracking-tight text-white">{title}</h2>
            <p className="mt-4 max-w-lg text-lg text-slate-300">
              {description}
            </p>
          </motion.div>
          <motion.div
            style={{ opacity }}
            className="relative w-full h-96 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl flex items-center justify-center p-4"
          >
             {children}
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
};


// --- The Main Page Component ---
export default function FeaturesPage() {
    
  const features = [
      {
        title: 'EA Valuation',
        description: 'Get instant market insights and predictive valuations powered by live data models.',
        icon: <Receipt size={32} />,
        visual: <EAValuationMock />
      },
       {
        title: 'AI Brochure',
        description: 'Generate stunning, professional property brochures with a single click.',
        icon: <FileText size={32} />,
        visual: <AIBrochureMock />
      },
       {
        title: 'EA Mailer',
        description: 'Create and send beautiful, targeted email campaigns to your client list.',
        icon: <Mail size={32} />,
        visual: <EAMailerMock />
      },
      {
        title: 'Social Post',
        description: 'Auto-generate social posts, videos, and ads for each property — complete with your branding and tone.',
        icon: <Share2 size={32} />,
         visual: <SocialPostMock />
      },
      {
        title: 'Market Trends',
        description: 'Visualize your success. Track performance, engagement, and ROI — all in one smart dashboard.',
        icon: <TrendingUp size={32} />,
         visual: <MarketTrendsMock />
      },
      {
        title: 'EA Analyse & Describe',
        description: 'Transform property details into elegant, SEO-optimized listings in seconds. AI language models craft descriptions that sell.',
        icon: <BarChart size={32} />,
        visual: <p className="text-slate-400">Visual placeholder for Analyse & Describe</p>
      },
      {
        title: 'EA Floor Plan Pro',
        description: 'Sketch. Snap. Send. Instantly convert floor plan drawings into precise digital 2D & 3D layouts — no manual tracing required.',
        icon: <ScanLine size={32} />,
         visual: <p className="text-slate-400">Visual placeholder for Floor Plan Pro</p>
      },
      {
        title: 'EA Image Pro',
        description: 'Enhance property photos with smart lighting balance, sky replacement, and object cleanup — all AI-driven.',
        icon: <ImageIcon size={32} />,
         visual: <p className="text-slate-400">Visual placeholder for Image Pro</p>
      },
      {
        title: 'EA 360',
        description: 'Build immersive 360° tours that bring listings to life. Engage buyers remotely with stunning virtual experiences.',
        icon: <Orbit size={32} />,
         visual: <p className="text-slate-400">Visual placeholder for EA 360</p>
      },
  ];

  return (
    <div className="bg-slate-900 text-white">
      {/* Hero Section */}
      <div className="relative min-h-screen flex flex-col items-center justify-center text-center bg-gradient-to-b from-sky-900 via-blue-900 to-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="z-10 container mx-auto px-6 sm:px-8"
        >
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold font-heading tracking-tight">
            Discover the Power of Intelligent Real Estate Tools
          </h1>
          <p className="mt-6 max-w-3xl mx-auto text-lg sm:text-xl text-slate-300">
            Our AI suite gives modern estate agents superpowers
            <br />
            automating visuals, analysis, and marketing
          </p>
          <div className="mt-10 flex flex-wrap gap-4 justify-center">
            <Button size="lg" className="bg-gradient-to-r from-teal-400 to-cyan-500 hover:brightness-110 text-white shadow-lg transform hover:scale-105 transition-transform" asChild>
                <Link href="/signup">Get Started Free <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent text-white border-white/30 hover:bg-white hover:text-blue-800 transition-colors backdrop-blur-sm" asChild>
                <Link href="/demo"><PlayCircle className="mr-2 h-5 w-5" /> Watch Demo</Link>
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Features Narrative Scroll */}
      <div className="relative">
        {features.map((feature, index) => (
          <React.Fragment key={feature.title}>
            <div className={`bg-gradient-to-b ${index % 2 === 0 ? 'from-slate-900 to-blue-900/70' : 'from-blue-900/70 to-slate-900'}`}>
                 <FeatureSection
                    title={feature.title}
                    description={feature.description}
                    icon={feature.icon}
                    reverse={index % 2 !== 0}
                >
                  {feature.visual}
                </FeatureSection>
            </div>
             {index < features.length - 1 && (
                <div className="h-[1px] w-full bg-gradient-to-r from-sky-400/0 via-sky-400/50 to-teal-400/0" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Final CTA Section */}
      <section className="py-24 sm:py-32 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#334155]">
        <div className="container mx-auto px-6 sm:px-8 text-center">
             <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.6 }}
            >
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-white">Ready to Transform Your Agency with AI?</h2>
                <div className="mt-8 flex flex-wrap gap-4 justify-center">
                    <Button size="lg" className="bg-gradient-to-r from-teal-400 to-cyan-500 hover:brightness-110 text-white shadow-lg transform hover:scale-105 transition-transform" asChild>
                        <Link href="/signup">Get Started Free <ArrowRight className="ml-2 h-5 w-5" /></Link>
                    </Button>
                    <Button size="lg" variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white hover:text-blue-800 transition-colors backdrop-blur-sm" asChild>
                        <Link href="/demo"><PlayCircle className="mr-2 h-5 w-5" /> Watch Demo</Link>
                    </Button>
                </div>
            </motion.div>
        </div>
      </section>
       <footer className="py-8 bg-[#0f172a] text-center text-sm text-slate-400">
            <Link href="/" className="hover:text-white">Back to Home</Link>
        </footer>
    </div>
  );
}
