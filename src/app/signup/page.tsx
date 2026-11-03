'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SignUpPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { signup, loading } = useAuth();
  const { toast } = useToast();

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Passwords do not match',
        description: 'Please check your passwords and try again.',
      });
      return;
    }
    
    await signup(email, password, fullName);
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
            <h2 className="text-3xl font-bold text-[#1E293B] mb-2">Create Account</h2>
            <p className="text-sm text-slate-500 font-medium">Join the intelligent property revolution.</p>
          </div>
          
          <form onSubmit={handleCreateAccount} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="full-name" className="text-[#1E293B] font-semibold ml-1">Full Name</Label>
              <Input 
                id="full-name" 
                placeholder="John Doe" 
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)} 
                required 
                className="bg-[#F8FAFC] border-none h-14 rounded-2xl px-6 text-slate-800 focus-visible:ring-2 focus-visible:ring-sky-500"
              />
            </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="password" className="text-[#1E293B] font-semibold ml-1">Password</Label>
                    <Input 
                        id="password" 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                        className="bg-[#F8FAFC] border-none h-14 rounded-2xl px-6 text-slate-800 focus-visible:ring-2 focus-visible:ring-sky-500"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-[#1E293B] font-semibold ml-1">Confirm</Label>
                    <Input 
                        id="confirm-password" 
                        type="password" 
                        value={confirmPassword} 
                        onChange={(e) => setConfirmPassword(e.target.value)} 
                        required 
                        className="bg-[#F8FAFC] border-none h-14 rounded-2xl px-6 text-slate-800 focus-visible:ring-2 focus-visible:ring-sky-500"
                    />
                </div>
            </div>

            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full h-14 bg-gradient-to-r from-[#00BCD4] to-[#3F51B5] text-white rounded-full font-bold text-lg shadow-xl shadow-sky-500/20 hover:brightness-110 transition-all transform hover:scale-[1.02]"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create Account
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm font-medium text-slate-600">
              Already have an account? <Link href="/login" className="text-sky-600 font-bold hover:underline">Sign in</Link>
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
