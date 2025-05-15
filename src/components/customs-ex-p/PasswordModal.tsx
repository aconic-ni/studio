
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
import { KeyRound, LogIn, X } from 'lucide-react';

interface PasswordModalProps {
  isOpen: boolean;
  onSubmit: (password: string) => void;
  onClose: () => void; 
  error?: string;
}

export const PasswordModal: FC<PasswordModalProps> = ({ isOpen, onSubmit, onClose, error: initialError }) => {
  const [password, setPassword] = useState('');
  const [currentError, setCurrentError] = useState(initialError || '');

  useEffect(() => {
    setCurrentError(initialError || '');
  }, [initialError]);

  const handleSubmit = () => {
    setCurrentError(''); 
    onSubmit(password);
  };
  
  useEffect(() => {
    if (isOpen) {
      setPassword(''); 
      setCurrentError(initialError || ''); 
      setTimeout(() => {
        const inputElement = document.getElementById('password');
        if (inputElement) {
          inputElement.focus();
        }
      }, 100); 
    }
  }, [isOpen, initialError]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px] text-foreground" onInteractOutside={(e) => { e.preventDefault(); onClose(); }} onEscapeKeyDown={(e) => {e.preventDefault(); onClose(); }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <KeyRound className="w-6 h-6 text-foreground" />
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
        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={onClose} className="mt-2 sm:mt-0">
            <X className="mr-2 h-4 w-4" /> Cancelar
          </Button>
          <Button onClick={handleSubmit}>
            <LogIn className="mr-2 h-4 w-4" /> Ingresar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

    
