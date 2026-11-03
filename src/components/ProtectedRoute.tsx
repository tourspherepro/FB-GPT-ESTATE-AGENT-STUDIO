
'use client';

import React, { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, isDesignMode } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && !user && !isDesignMode) {
      router.push('/login');
    }
  }, [user, loading, isDesignMode, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user && !isDesignMode) {
    return null; // or a loading spinner, but useEffect handles redirection
  }

  return <>{children}</>;
}
