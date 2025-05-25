
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { LoginForm } from '@/components/auth/login-form';
import { X } from 'lucide-react';

const AppLogoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-32 w-32 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" data-ai-hint="clipboard document">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);

export default function LoginPage() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  return (
    <>
      <div className="min-h-screen flex flex-col items-center justify-center grid-bg text-white p-4">
        <main
          className="flex flex-col items-center text-center cursor-pointer group"
          onClick={() => setIsLoginModalOpen(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsLoginModalOpen(true); }}
          aria-label="Abrir formulario de inicio de sesión"
        >
          <div id="appLogo" className="logo-pulse mb-8">
            <AppLogoIcon />
          </div>
          <header className="text-center mb-12">
            <h1 className="text-3xl font-bold text-white mb-2">CustomsEX-p</h1>
            <p className="text-blue-200">Sistema de EXAMENES PREVIOS</p>
            <p className="text-blue-200 text-sm mt-1">Diseñado por Jordy Stvaer © 2025</p>
          </header>
        </main>

        {/* Removed the explicit button as per HTML, clicking the logo area opens modal */}
      </div>

      <Dialog open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen}>
        <DialogContent className="sm:max-w-md p-6 glass-effect rounded-lg border-0 text-white">
          <DialogHeader className="mb-0"> {/* Reduced margin for closer match to HTML */}
            <div className="flex justify-between items-center">
              <DialogTitle className="text-2xl font-bold text-white">CustomsEX-p</DialogTitle>
              <DialogClose asChild>
                <Button variant="ghost" size="icon" className="text-white hover:text-gray-300">
                  <X className="h-6 w-6" />
                  <span className="sr-only">Cerrar</span>
                </Button>
              </DialogClose>
            </div>
          </DialogHeader>
          {/* LoginForm will be placed here. It handles its own card styling. */}
          {/* We pass a prop to tell LoginForm it's in a modal context for styling. */}
          <LoginForm inModalContext={true} />
        </DialogContent>
      </Dialog>
    </>
  );
}
