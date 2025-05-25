
"use client";

import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import { AuthProvider as ContextAuthProvider } from '@/contexts/auth-context';
import { ExamProvider } from '@/contexts/exam-context'; // Import ExamProvider
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
    // If user is present and on login, redirect to home
    if (!loading && user && pathname === '/login') {
      router.push('/');
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    );
  }

  // If not loading, and not user, and not on login page, this means redirect is in progress or failed
  // This case is usually handled by the useEffect redirect.
  // If user is logged in, or if on the login page, render children.
  if (user || pathname === '/login') {
     return <ExamProvider>{children}</ExamProvider>; // Wrap children with ExamProvider
  }

  // Fallback for edge cases during redirect, or if a non-login page is accessed without auth
  // (though useEffect should prevent this)
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
