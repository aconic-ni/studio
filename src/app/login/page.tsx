
"use client";

import { useState } from 'react';
import { Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  return (
    <>
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-grid-pattern relative overflow-hidden">
        {/* Clickable area for logo and text */}
        <div
          className="text-center cursor-pointer group mb-8"
          onClick={() => setIsLoginModalOpen(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsLoginModalOpen(true); }}
          aria-label="Open login form"
        >
          <Building2 data-ai-hint="building company" className="h-20 w-20 sm:h-24 sm:w-24 mx-auto text-white mb-4 sm:mb-6 transition-transform duration-300 group-hover:scale-110" />
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-1 sm:mb-2">CustomsFA-L</h1>
          <p className="text-lg sm:text-xl text-blue-100">Sistema de Facturación Local</p>
        </div>

        {/* Explicit Login Button */}
        <Button
          onClick={() => setIsLoginModalOpen(true)}
          variant="secondary"
          size="lg"
          className="bg-white/90 text-primary hover:bg-white shadow-lg"
        >
          Iniciar Sesión
        </Button>
      </main>

      <Dialog open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0 shadow-2xl">
          {/* LoginForm already includes Card styling */}
          <LoginForm />
        </DialogContent>
      </Dialog>
    </>
  );
}
