"use client";

import React, { useState } from 'react';
import { HeroDynamic } from '@/components/hero-dynamic';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AreaChart, FileText, Image as ImageIcon, Orbit, Receipt, ScanLine, Share2, BarChart, Mail, TrendingUp, PhoneCall, Mic, PoundSterling, Clapperboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import HeaderHome from "@/components/HeaderHome";
import { ToolModal } from '@/components/tool-modal';
import Footer from '@/components/Footer';
import { Badge } from '@/components/ui/badge';

const features = [
  {
    icon: <BarChart className="w-7 h-7" />,
    id: 'ea-analyse',
    title: 'EA Analyse & Describe',
    description: 'Generate compelling property descriptions, summaries, and insights powered by advanced AI language models.',
    fullDescription: "Transform property details into elegant, SEO-optimized listings in seconds using AI."
  },
  {
    icon: <ScanLine className="w-7 h-7" />,
    id: 'ea-floor-plan-pro',
    title: 'EA Floor Plan Pro',
    description: 'Sketch, snap, and instantly convert floor plan drawings into precise 2D & 3D layouts.',
    fullDescription: "Sketch, snap, and instantly convert floor plan drawings into precise 2D & 3D layouts — no manual tracing required."
  },
  {
    icon: <ImageIcon className="w-7 h-7" />,
    id: 'ea-image-pro',
    title: 'EA Image Pro',
    description: 'Automatically enhance property photos with intelligent sky replacement, lighting balance, and object removal.',
    fullDescription: "Enhance property photos with smart lighting balance, sky replacement, and object cleanup — all AI-driven."
  },
  {
    icon: <Orbit className="w-7 h-7" />,
    id: 'ea-360',
    title: 'EA 360',
    description: 'Build immersive 360° tours that bring listings to life with virtual walkthroughs.',
    fullDescription: "Build immersive 360° tours that bring listings to life with virtual walkthroughs."
  },
  {
    icon: <Share2 className="w-7 h-7" />,
    id: 'socials',
    title: 'Socials Suite',
    description: 'Generate beautiful social media posts, reels, and carousels powered by AI.',
    fullDescription: "Auto-generate social posts, videos, and ads for each property — complete with your branding and tone."
  },
  {
    icon: <PoundSterling className="w-7 h-7" />,
    id: 'ea-valuation',
    title: 'EA Valuation',
    description: 'Instantly calculate property valuations and generate interactive market insights.',
    fullDescription: "Get instant market insights and predictive valuations powered by live data models."
  },
  {
    icon: <FileText className="w-7 h-7" />,
    id: 'ai-brochure',
    title: 'AI Brochure',
    description: 'Professional brochures, proposals, and emails — created by AI, styled for estate agents.',
    fullDescription: "Generate professional brochures, proposals, and emails styled for estate agents."
  },
  {
    icon: <Mail className="w-7 h-7" />,
    id: 'ea-mailer',
    title: 'EA Mailer',
    description: 'Create and send beautiful, targeted email campaigns to your client list.',
    fullDescription: 'Create and send beautiful, targeted email campaigns to your client list.'
  },
  {
    icon: <TrendingUp className="w-7 h-7" />,
    id: 'market-trends',
    title: 'Market Trends',
    description: 'Visualize your success with performance, engagement, and ROI dashboards.',
    fullDescription: "Visualize your success with performance, engagement, and ROI dashboards."
  },
  {
    icon: <PhoneCall className="w-7 h-7" />,
    id: 'eacaller',
    title: 'EACALLER',
    description: 'AI-powered outbound calling agent to book valuation appointments.',
    fullDescription: "An AI Outbound Calling Agent for an estate agency. Its single purpose is to call leads and book valuation appointments."
  },
  {
    icon: <Mic className="w-7 h-7" />,
    id: 'outlook-voice-assistant',
    title: 'Outlook Voice Assistant',
    description: 'Control your Outlook desktop app with voice commands directly from your browser.',
    fullDescription: "Control your Outlook desktop app with voice commands directly from your browser."
  },
  {
    icon: <Clapperboard className="w-7 h-7" />,
    id: 'creator-studio',
    title: 'Creator Studio',
    description: 'Generate images and videos using AI models like Stable Diffusion and VideoCrafter.',
    fullDescription: "Generate stunning images and videos with the power of AI."
  },
];

const howItWorksSteps = [
  {
    step: 1,
    title: 'Connect Your Agency',
    description: 'Set up your profile and properties in minutes.',
  },
  {
    step: 2,
    title: 'Automate Your Marketing',
    description: 'Let AI handle content, media, and client engagement.',
  },
  {
    step: 3,
    title: 'Close More Deals',
    description: 'Get insights, analytics, and AI-assisted lead generation.',
  },
];

const testimonials = [
    {
        quote: "EASTUDIO has completely transformed how we market properties — it’s like having a digital assistant 24/7.",
        name: "Samantha Jones",
        company: "Prestige Properties",
        fallback: "S"
    },
    {
        quote: "The time saved on creating floor plans and descriptions alone is worth its weight in gold. A must-have for any modern agency.",
        name: "David Chen",
        company: "Urban Dwellings",
        fallback: "D"
    },
    {
        quote: "Our social media engagement has skyrocketed since we started using the AI content generator. It's incredibly intuitive.",
        name: "Maria Garcia",
        company: "Coastal Homes Realty",
        fallback: "M"
    },
];

export default function HomePage() {
  const [selectedTool, setSelectedTool] = useState<(typeof features)[0] | null>(null);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <HeaderHome />
      <main className="flex-1">
        <HeroDynamic />

        <section id="features" className="bg-background py-20 sm:py-28">
          <div className="container mx-auto px-6 sm:px-8">
            <div className="max-w-5xl mx-auto text-center relative">
              <div className="mb-4 flex justify-center">
                <Badge variant="destructive" className="bg-red-600 text-white font-bold px-3 py-1 animate-pulse">BETA</Badge>
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Everything you need, powered by AI</h2>
              <p className="mt-4 text-lg text-muted-foreground">For estate agents, built by estate agents</p>
            </div>
            <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  className="p-8 rounded-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-lg border border-slate-200/50 dark:border-slate-800/50 shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ delay: index * 0.1, duration: 0.6, ease: "easeOut" }}
                  onClick={() => setSelectedTool(feature)}
                >
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white mb-5 shadow-inner">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 sm:py-28 bg-slate-50 dark:bg-slate-900/80 relative">
            <div className="container mx-auto px-6 sm:px-8 relative">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">How It Works</h2>
                </div>
                <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 items-start">
                    {howItWorksSteps.map((item, index) => (
                        <motion.div 
                            key={item.step} 
                            className="flex flex-col items-center text-center relative group"
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, amount: 0.5 }}
                            transition={{ delay: index * 0.2, duration: 0.5 }}
                        >
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white mb-4 shadow-lg text-2xl font-bold">
                                {item.step}
                            </div>
                            <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                            <p className="mt-2 text-base text-muted-foreground">{item.description}</p>
                            {index < howItWorksSteps.length - 1 && (
                                <div className="hidden md:block absolute left-1/2 top-8 h-0.5 w-full bg-gradient-to-r from-blue-500/0 via-blue-500/50 to-blue-500/0 " />
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>

        <section className="py-20 sm:py-28 bg-background">
            <div className="container mx-auto px-6 sm:px-8">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Trusted by forward-thinking estate agents</h2>
                </div>
                <Carousel className="relative w-full max-w-5xl mx-auto mt-16" opts={{loop: true}}>
                    <CarouselContent className="-ml-4">
                        {testimonials.map((testimonial, index) => (
                            <CarouselItem key={index} className="pl-4 md:basis-1/2 lg:basis-1/3">
                                <div className="p-1 h-full">
                                    <Card className="p-8 rounded-2xl bg-card border border-border/50 h-full flex flex-col justify-between shadow-lg">
                                        <p className="text-base text-muted-foreground italic">&quot;{testimonial.quote}&quot;</p>
                                        <div className="flex items-center gap-4 mt-6">
                                            <Avatar>
                                                <AvatarFallback>{testimonial.fallback}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-semibold text-foreground">{testimonial.name}</p>
                                                <p className="text-sm text-muted-foreground">{testimonial.company}</p>
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious className="hidden sm:flex" />
                    <CarouselNext className="hidden sm:flex" />
                </Carousel>
            </div>
        </section>
        
        <section className="py-20 sm:py-28 bg-gradient-to-r from-blue-800 to-indigo-900 text-white">
          <div className="container mx-auto px-6 sm:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready to transform your agency with AI?</h2>
              <p className="mt-4 text-lg text-blue-200 max-w-2xl mx-auto">Start automating your workflow and close deals faster today.</p>
              <div className="mt-8 flex flex-wrap gap-4 justify-center">
                <Button asChild size="lg" className="bg-gradient-to-r from-teal-400 to-cyan-500 hover:brightness-110 text-white shadow-lg transform hover:scale-105 transition-transform">
                  <Link href="/signup">Get Started Free</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white hover:text-blue-800 transition-colors backdrop-blur-sm">
                  <Link href="/demo">Book a Demo</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
       <AnimatePresence>
        {selectedTool && (
          <ToolModal
            tool={selectedTool}
            onClose={() => setSelectedTool(null)}
          />
        )}
      </AnimatePresence>
      <Footer />
    </div>
  );
}