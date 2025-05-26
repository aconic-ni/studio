
"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, FileText, Loader2 } from 'lucide-react'; // Added Building2
import { LoginModal } from '@/components/auth/LoginModal';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      if (user.isStaticUser) {
        router.push('/database');
      } else {
        router.push('/examiner');
      }
    }
  }, [user, loading, router]);

  const handleLoginSuccess = (isStaticUser?: boolean) => {
    if (isStaticUser) {
      router.push('/database');
    } else {
      router.push('/examiner');
    }
  };

  if (loading) {
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
      </div>
    );
  }

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
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
