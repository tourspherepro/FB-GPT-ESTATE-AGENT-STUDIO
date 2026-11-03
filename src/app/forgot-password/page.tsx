
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const { resetPassword, loading } = useAuth();
  const { toast } = useToast();
  const [isSent, setIsSent] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    await resetPassword(email);
    setIsSent(true);
  };

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-[#00A3CC] via-[#0070C0] to-[#1E4E8C] font-body flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 z-0 bg-grid-pattern opacity-10 pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-lg flex flex-col items-center">
        <div className="mb-10 text-center text-white">
          <Link href="/">
            <h1 className="font-heading text-4xl font-bold tracking-widest uppercase mb-2">EASTUDIO</h1>
            <p className="text-sm font-medium text-white/90">For estate agents, built by estate agents.</p>
          </Link>
        </div>

        <div className="w-full bg-[#E6F4F9]/95 backdrop-blur-md rounded-[2.5rem] p-10 md:p-14 shadow-2xl">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-[#1E293B] mb-2">Reset Password</h2>
            {isSent ? (
              <p className="mt-2 text-sm text-slate-500 font-medium">Check your inbox for a reset link.</p>
            ) : (
              <p className="mt-2 text-sm text-slate-500 font-medium">We'll send you a link to get back into your account.</p>
            )}
          </div>
          
          {isSent ? (
            <div className="text-center">
                 <Button asChild className="w-full h-14 bg-gradient-to-r from-[#00BCD4] to-[#3F51B5] text-white rounded-full font-bold shadow-xl">
                    <Link href="/login">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Sign In
                    </Link>
                </Button>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-6">
                <div className="space-y-2">
                <Label htmlFor="email" className="text-[#1E293B] font-semibold ml-1">Email Address</Label>
                <Input 
                    id="email" 
                    type="email" 
                    placeholder="you@example.com" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required
                    className="bg-[#F8FAFC] border-none h-14 rounded-2xl px-6 text-slate-800 focus-visible:ring-2 focus-visible:ring-sky-500"
                />
                </div>

                <Button type="submit" disabled={loading} className="w-full h-14 bg-gradient-to-r from-[#00BCD4] to-[#3F51B5] text-white rounded-full font-bold text-lg shadow-xl shadow-sky-500/20 hover:brightness-110 transition-all transform hover:scale-[1.02]">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Send Reset Link
                </Button>
            </form>
          )}

          <div className="mt-8 text-center">
            <p className="text-sm font-medium text-slate-600">
              Remembered? <Link href="/login" className="text-sky-600 font-bold hover:underline">Sign in</Link>
            </p>
          </div>
        </div>

        <footer className="mt-12 text-center">
            <p className="text-[10px] sm:text-xs text-white/70 font-medium tracking-wide">
                © 2025 EASTUDIO — For estate agents, built by estate agents.
            </p>
        </footer>
      </div>
    </div>
  );
}
