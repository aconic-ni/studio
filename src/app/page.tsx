
"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2 } from 'lucide-react';
import { LoginModal } from '@/components/auth/LoginModal';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react'; 

export default function HomePage() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // This effect handles redirection once the user state is definitive
    if (!isClient || loading) return;

    if (user) { // If user object exists, redirect
      if (user.isStaticUser) {
        router.push('/database');
      } else {
        router.push('/examiner');
      }
    }
    // If user is null (and not loading, and on client), this component will render the main page content
  }, [user, loading, router, isClient]);

  const handleLoginSuccess = (isStaticUser?: boolean) => {
    // LoginModal itself will no longer call its onClose upon success.
    // We just need to ensure our local state for the modal is also updated if login was triggered from here.
    setIsLoginModalOpen(false);
    // The useEffect listening to AuthContext's 'user' state (above) will handle redirection.
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
    // If user is truthy, it means authentication is successful (or user was already logged in)
    // and the useEffect above is (or will soon be) redirecting. Show a loader.
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
  // Render the main page content.
  return (
    <div className="min-h-screen flex flex-col items-center justify-center grid-bg text-white p-4">
      <main className="flex flex-col items-center text-center">
        <div
          id="appLogo"
          className="logo-pulse mb-8 cursor-pointer block mx-auto"
          onClick={() => setIsLoginModalOpen(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setIsLoginModalOpen(true)}
          aria-label="Abrir inicio de sesión"
        >
          <Building2 data-ai-hint="office building" className="h-32 w-32 text-white block mx-auto" strokeWidth={1.5} />
        </div>
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold">CustomsFA-L</h1>
          <p className="text-blue-200 mt-1 text-sm md:text-base">Sistema de FACTURACIÓN LOCAL</p>
        </header>
        <Button 
          onClick={() => setIsLoginModalOpen(true)} 
          className="text-white bg-[#4d7599] hover:bg-[#3a5670] text-lg px-8 py-4"
          size="lg"
        >
          Iniciar Sesión
        </Button>
      </main>

      <footer className="absolute bottom-8 text-center text-sm text-blue-300">
        Stvaer © 2025 <em className="italic">for</em> ACONIC.
      </footer>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)} // This handles manual close from HomePage
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
