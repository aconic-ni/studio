"use client";

import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import { AuthProvider as ContextAuthProvider, AuthContext } from '@/contexts/auth-context';
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

  if (!user && pathname !== '/login') {
     // This case should ideally be caught by the redirect, but as a fallback:
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Redirecting to login...</p>
      </div>
    );
  }
  
  // Allow access to login page if not authenticated or any page if authenticated
  return <>{children}</>;
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
