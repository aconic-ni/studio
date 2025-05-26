
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
    if (!isClient || loading) return; 

    if (user) { 
      if (user.isStaticUser) {
        router.push('/database');
      } else if (user.role === 'revisor') {
        router.push('/database');
      } else { // Default for other Firebase authenticated users
        router.push('/examiner');
      }
    }
  }, [user, loading, router, isClient]);

  const handleLoginSuccess = (isStaticUser?: boolean) => {
    // Redirection is handled by the useEffect listening to AuthContext's 'user' state.
  };
  
  if (!isClient || loading) { 
    return (
      <div className="min-h-screen flex items-center justify-center grid-bg">
        <Loader2 className="h-16 w-16 animate-spin text-white" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center grid-bg">
        <Loader2 className="h-16 w-16 animate-spin text-white" />
        <p className="ml-3 text-white">Redirigiendo...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center grid-bg">
       <LoginModal 
         isOpen={true} 
         onClose={() => router.push('/')} 
         onLoginSuccess={handleLoginSuccess} 
       />
    </div>
  );
}
