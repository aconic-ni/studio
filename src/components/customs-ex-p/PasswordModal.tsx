"use client";

import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { KeyRound, LogIn } from 'lucide-react';

interface PasswordModalProps {
  isOpen: boolean;
  onSubmit: (password: string) => void;
  error?: string;
}

export const PasswordModal: FC<PasswordModalProps> = ({ isOpen, onSubmit, error: initialError }) => {
  const [password, setPassword] = useState('');
  const [currentError, setCurrentError] = useState(initialError || '');

  useEffect(() => {
    setCurrentError(initialError || '');
  }, [initialError]);

  const handleSubmit = () => {
    setCurrentError(''); 
    onSubmit(password);
  };
  
  // Ensure password field is focused when modal opens and error is cleared
  useEffect(() => {
    if (isOpen) {
      setPassword(''); // Clear password field on open
      setCurrentError(initialError || ''); // Reset error state
      setTimeout(() => {
        const inputElement = document.getElementById('password');
        if (inputElement) {
          inputElement.focus();
        }
      }, 100); // Delay to ensure modal is rendered
    }
  }, [isOpen, initialError]);


  return (
    <Dialog open={isOpen} >
      <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <KeyRound className="w-6 h-6 text-primary" />
            Acceso Restringido
          </DialogTitle>
          <DialogDescription>
            Por favor, ingrese la clave para continuar.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid items-center gap-2">
            <Label htmlFor="password">Clave</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (currentError) setCurrentError(''); 
              }}
              placeholder="Ingrese su clave"
              aria-describedby="password-error"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSubmit();
                }
              }}
            />
          </div>
          {currentError && <p id="password-error" className="text-sm text-destructive">{currentError}</p>}
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} className="w-full">
            <LogIn className="mr-2 h-4 w-4" /> Ingresar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
