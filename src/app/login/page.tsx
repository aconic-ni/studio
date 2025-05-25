
"use client";

import { useState } from 'react';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  return (
    <>
      <div className="min-h-screen flex flex-col items-center justify-center bg-grid-pattern text-white p-4">
        <main className="flex flex-col items-center text-center">
          {/* Clickable area for logo and text */}
          <div
            className="text-center cursor-pointer group"
            onClick={() => setIsLoginModalOpen(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsLoginModalOpen(true); }}
            aria-label="Open login form"
          >
            <div id="appLogo" className="logo-pulse mb-8 mx-auto">
              <FileText data-ai-hint="document invoice" className="h-32 w-32 text-white block mx-auto" />
            </div>
            <header className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold">CustomsFA-L</h1>
              <p className="text-blue-200 mt-1 text-sm md:text-base">Sistema de FACTURACIÓN LOCAL</p>
            </header>
          </div>

          {/* Explicit Login Button */}
          <Button
            onClick={() => setIsLoginModalOpen(true)}
            size="lg"
            className="bg-[hsl(var(--foreground))] text-primary-foreground hover:bg-[hsl(var(--foreground))]/90 text-lg"
          >
            Iniciar Sesión
          </Button>
        </main>

        <footer className="absolute bottom-8 text-center text-sm text-blue-300">
          Stvaer © 2025 <em className="italic">for</em> ACONIC.
        </footer>
      </div>

      <Dialog open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0 shadow-2xl">
          {/* LoginForm already includes Card styling */}
          <LoginForm />
        </DialogContent>
      </Dialog>
    </>
  );
}
