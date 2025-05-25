
"use client";

import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import { AuthProvider as ContextAuthProvider } from '@/contexts/auth-context';
import { ExamProvider } from '@/contexts/exam-context';
import { useClientAuth } from '@/hooks/use-client-auth';
import { Toaster } from "@/components/ui/toaster";

const ProtectedRoutesWrapper = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useClientAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user && pathname !== '/login') {
      router.push('/login');
    }
    // Allow access to login page if loading, or if not loading and no user
    // If user is present and on login, redirect to new exam page
    if (!loading && user && pathname === '/login') {
      router.push('/new-exam');
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (user || pathname === '/login') {
     return <ExamProvider>{children}</ExamProvider>;
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <p>Redirecting...</p>
    </div>
  );
};

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ContextAuthProvider>
      <ProtectedRoutesWrapper>
        {children}
      </ProtectedRoutesWrapper>
      <Toaster />
    </ContextAuthProvider>
  );
}
