'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { ArrowRight, PlayCircle, Search, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface HeroContent {
  headlineTop: string;
  headlineBottom: string;
  subtext: string;
  subtextLine2?: string;
  subtextLine3?: string;
  buttonPrimaryText: string;
  buttonPrimaryLink: string;
  buttonSecondaryText: string;
  buttonSecondaryLink: string;
  searchPlaceholder: string;
}

const fallbackContent: HeroContent = {
  headlineTop: "AI Tools Built for Modern Estate Agents.",
  headlineBottom: "",
  subtext: "EASTUDIO gives agents the power to",
  subtextLine2: "create, analyse, and operate faster than ever before.",
  subtextLine3: "",
  buttonPrimaryText: "Get Started Free",
  buttonPrimaryLink: "/signup",
  buttonSecondaryText: "Watch Demo",
  buttonSecondaryLink: "/demo",
  searchPlaceholder: "Search EASTUDIO for tools, features, or guides..."
};

export function HeroDynamic() {
  const router = useRouter();
  const { firestore: db } = useFirebase();
  const [content, setContent] = useState<HeroContent>(fallbackContent);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      if (!db) return;
      try {
        const docRef = doc(db, 'site_content', 'hero_section');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            setContent(docSnap.data() as HeroContent);
        }
      } catch (error) {
        console.warn("HeroDynamic: Fetch failed, using defaults.", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [db]);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const searchInput = form.elements.namedItem('search') as HTMLInputElement;
    const query = searchInput.value.trim();
    if (query) {
      router.push(`/search?query=${encodeURIComponent(query)}`);
    }
  };

  return (
    <section className="relative flex flex-col justify-center items-center min-h-[80vh] text-center bg-gradient-to-br from-cyan-500/80 via-blue-600/80 to-indigo-700/80 text-white overflow-hidden px-4 py-16">
      <div className="absolute inset-0 z-0 bg-grid-pattern opacity-10 animate-pulse"></div>
      <div className="absolute inset-0 z-0 animate-glow-pulse bg-gradient-to-r from-cyan-500/30 to-blue-700/30 opacity-50"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="z-10"
      >
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-heading font-bold tracking-tight" style={{ lineHeight: 1.2 }}>
            {content.headlineTop}
            {content.headlineBottom && (
                <span className="block mt-2 md:mt-4 text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-cyan-300">
                {content.headlineBottom}
                </span>
            )}
          </h1>
          <p className="mt-6 text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
            {content.subtext}
          </p>
           {content.subtextLine2 && (
             <p className="mt-2 text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
              {content.subtextLine2}
            </p>
          )}
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <Button size="lg" className="bg-gradient-to-r from-teal-400 to-cyan-500 hover:brightness-110 text-white shadow-lg transform hover:scale-105 transition-transform" asChild>
                <Link href={content.buttonPrimaryLink}>
                    {content.buttonPrimaryText} <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-white/10 text-white border-white/20 backdrop-blur-sm hover:bg-white hover:text-blue-600 transition-colors" asChild>
                <Link href={content.buttonSecondaryLink}>
                    <PlayCircle className="mr-2 h-5 w-5" /> {content.buttonSecondaryText}
                </Link>
            </Button>
          </div>
          <div className="mt-10 flex justify-center">
            <form onSubmit={handleSearch} className="flex items-center bg-white/80 backdrop-blur-sm rounded-full shadow-md w-full max-w-lg px-2 py-1.5">
              <Search className="text-slate-500 ml-3 w-5 h-5" />
              <input
                type="text"
                name="search"
                placeholder={content.searchPlaceholder}
                className="flex-1 bg-transparent outline-none text-slate-800 placeholder-slate-400 text-sm px-3"
              />
              <button type="submit" className="px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium text-sm hover:opacity-90 transition">
                Search
              </button>
            </form>
          </div>
        </div>
      </motion.div>
      {loading && <div className="absolute top-4 right-4"><Loader2 className="w-4 h-4 animate-spin text-white/20" /></div>}
    </section>
  );
}
