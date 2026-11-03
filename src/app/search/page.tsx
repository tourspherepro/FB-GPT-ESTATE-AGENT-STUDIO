
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { AppLayout } from '@/components/app-layout';
import Link from 'next/link';

const siteData = [
  { title: "EA Valuation", type: "Tool", description: "Generate property valuations and market reports.", link: "/ea-valuation" },
  { title: "EA Image Pro", type: "Tool", description: "Enhance property photos using AI precision.", link: "/ea-image-pro" },
  { title: "EA Floor Plan Pro", type: "Tool", description: "Convert sketches into 2D and 3D floor plans.", link: "/ea-floor-plan-pro" },
  { title: "Socials Suite", type: "Tool", description: "Create AI-powered social media posts for agents.", link: "/socials" },
  { title: "EA Analyse & Describe", type: "Tool", description: "Generate marketing descriptions and summaries.", link: "/ea-analyse" },
  { title: "Pricing", type: "Page", description: "Compare plans and pricing options for your agency.", link: "/pricing" },
  { title: "Features", type: "Page", description: "Explore everything EASTUDIO can do for your business.", link: "/#features" },
  { title: "Contact", type: "Page", description: "Get in touch with support or request a demo.", link: "/contact" },
];

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get('query') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState(siteData);

  useEffect(() => {
    if (query) {
      const filteredData = siteData.filter(item =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filteredData);
    } else {
      setResults(siteData); // Show all if query is empty
    }
  }, [query]);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const searchInput = form.elements.namedItem('search') as HTMLInputElement;
    const newQuery = searchInput.value.trim();
    // Update URL without a full page reload
    router.push(`/search?query=${encodeURIComponent(newQuery)}`);
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-6 py-16">
        <form onSubmit={handleSearch} className="flex justify-center mb-10">
          <div className="flex items-center bg-white rounded-full shadow-md w-full max-w-lg px-5 py-3">
            <Search className="text-slate-500 mr-3 w-5 h-5" />
            <input
              name="search"
              type="text"
              defaultValue={query}
              placeholder="Refine your search..."
              className="flex-1 bg-transparent outline-none text-slate-800"
            />
            <button type="submit" className="ml-3 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:opacity-90 transition">
              Search
            </button>
          </div>
        </form>

        <h1 className="text-3xl font-bold text-slate-800 mb-6">
          {query ? `Search results for: “${query}”` : "Search EASTUDIO"}
        </h1>

        <div className="grid gap-6 md:grid-cols-2">
          {results.map(item => (
            <div key={item.title} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                  {item.title}
                </h2>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{item.type}</span>
              </div>
              <p className="text-slate-600 mb-4">{item.description}</p>
              <Link href={item.link} className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:opacity-90">
                View
              </Link>
            </div>
          ))}
        </div>

        {results.length === 0 && (
          <p className="text-slate-500 mt-8">
            No results found for “{query}”. Try searching for “valuation”, “floor plan”, or “socials”.
          </p>
        )}
      </div>
    </AppLayout>
  );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div>Loading search...</div>}>
            <SearchPageContent />
        </Suspense>
    )
}
