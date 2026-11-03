'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const { login, loading } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-[#00A3CC] via-[#0070C0] to-[#1E4E8C] font-body flex flex-col items-center justify-center p-4">
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 z-0 bg-grid-pattern opacity-10 pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-lg flex flex-col items-center">
        {/* Header Section */}
        <div className="mb-10 text-center text-white">
          <Link href="/">
            <h1 className="font-heading text-4xl font-bold tracking-widest uppercase mb-2">EASTUDIO</h1>
            <p className="text-sm font-medium text-white/90">For estate agents, built by estate agents.</p>
          </Link>
        </div>

        {/* Login Card */}
        <div className="w-full bg-[#E6F4F9]/95 backdrop-blur-md rounded-[2.5rem] p-10 md:p-14 shadow-2xl">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-[#1E293B] mb-2">Welcome Back</h2>
            <p className="text-sm text-slate-500 font-medium">Sign in to access your dashboard.</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#1E293B] font-semibold ml-1">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="Name@home.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required
                className="bg-[#F8FAFC] border-none h-14 rounded-2xl px-6 text-slate-800 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-sky-500"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1 pr-1">
                <Label htmlFor="password" className="text-[#1E293B] font-semibold">Password</Label>
                <Link href="/forgot-password" className="text-sm font-semibold text-sky-600 hover:text-sky-700 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••••••••••"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required
                className="bg-[#F8FAFC] border-none h-14 rounded-2xl px-6 text-slate-800 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-sky-500"
              />
            </div>

            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full h-14 bg-gradient-to-r from-[#00BCD4] to-[#3F51B5] text-white rounded-full font-bold text-lg shadow-xl shadow-sky-500/20 hover:brightness-110 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
              Sign in with Email
            </Button>
          </form>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button asChild variant="outline" className="h-12 rounded-full border-sky-500 bg-white text-sky-700 font-semibold hover:bg-sky-50">
              <Link href="/dashboard?design=user">Open User Dashboard</Link>
            </Button>
            <Button asChild variant="outline" className="h-12 rounded-full border-sky-500 bg-white text-sky-700 font-semibold hover:bg-sky-50">
              <Link href="/admin?design=admin">Open Admin Dashboard</Link>
            </Button>
          </div>
          <p className="mt-2 text-center text-xs text-slate-500">Local design mode only. Live data and saving require sign-in.</p>

          <div className="mt-10 text-center">
            <p className="text-sm font-medium text-slate-600">
              Don't have an account? <Link href="/signup" className="text-sky-600 font-bold hover:underline">Sign up</Link>
            </p>
          </div>
        </div>

        {/* Footer Section */}
        <footer className="mt-12 text-center">
            <p className="text-[10px] sm:text-xs text-white/70 font-medium tracking-wide">
                © 2025 EASTUDIO — For estate agents, built by estate agents.
            </p>
        </footer>
      </div>
    </div>
  );
}
