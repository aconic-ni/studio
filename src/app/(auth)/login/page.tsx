
"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoginModal } from '@/components/auth/LoginModal';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // This effect handles redirection once the user state is definitive
    if (!isClient || loading) return; 

    if (user) { 
      // User is authenticated, redirect them
      if (user.isStaticUser) {
        router.push('/database');
      } else {
        router.push('/examiner');
      }
    }
    // If user is null (and not loading, and on client), this component will render the LoginModal below
  }, [user, loading, router, isClient]);

  const handleLoginSuccess = (isStaticUser?: boolean) => {
    // The LoginModal itself will call its onClose after success.
    // The useEffect listening to AuthContext's 'user' state (above) will handle redirection.
    // No explicit router.push() here to prevent race conditions with context update.
  };
  
  if (!isClient || loading) { 
    // If not on client yet, or auth state is loading, show a global loader
    return (
      <div className="min-h-screen flex items-center justify-center grid-bg">
        <Loader2 className="h-16 w-16 animate-spin text-white" />
      </div>
    );
  }

  // At this point: isClient is true, and loading is false.
  if (user) {
    // If user is truthy, it means authentication is successful and the useEffect above
    // is (or will soon be) redirecting. Show a loader during this phase.
    return (
      <div className="min-h-screen flex items-center justify-center grid-bg">
        <Loader2 className="h-16 w-16 animate-spin text-white" />
        <p className="ml-3 text-white">Redirigiendo...</p>
      </div>
    );
  }

  // If we reach here, it means:
  // - We are on the client (isClient is true)
  // - Auth loading is complete (loading is false)
  // - User is not authenticated (user is null)
  // This is the only scenario where we should render the LoginModal.
  return (
    <div className="min-h-screen flex items-center justify-center grid-bg">
       <LoginModal 
         isOpen={true} // Modal is always open when LoginPage renders it
         onClose={() => router.push('/')} // If user manually closes modal from /login page, go to home
         onLoginSuccess={handleLoginSuccess} 
       />
    </div>
  );
}
