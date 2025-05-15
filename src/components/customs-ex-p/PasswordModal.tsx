
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
import { KeyRound, LogIn, X, User as UserIcon } from 'lucide-react';

export interface LoginCredentials {
  username?: string;
  password: string;
}

interface PasswordModalProps {
  isOpen: boolean;
  onSubmit: (credentials: LoginCredentials) => void;
  onClose: () => void;
  error?: string;
}

export const PasswordModal: FC<PasswordModalProps> = ({ isOpen, onSubmit, onClose, error: initialError }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [currentError, setCurrentError] = useState(initialError || '');

  useEffect(() => {
    setCurrentError(initialError || '');
  }, [initialError]);

  const handleSubmit = () => {
    setCurrentError('');
    onSubmit({ username: username.trim() === '' ? undefined : username.trim(), password });
  };

  useEffect(() => {
    if (isOpen) {
      setUsername('');
      setPassword('');
      setCurrentError(initialError || '');
      setTimeout(() => {
        const inputElement = document.getElementById('username'); // Focus username first
        if (inputElement) {
          inputElement.focus();
        } else {
           const passwordElement = document.getElementById('password');
           if (passwordElement) passwordElement.focus();
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
      <DialogContent className="sm:max-w-[425px] text-foreground overflow-hidden" onInteractOutside={(e) => { onClose(); }} onEscapeKeyDown={(e) => { onClose(); }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <KeyRound className="w-6 h-6 text-foreground" />
            Acceso Restringido
          </DialogTitle>
          <DialogDescription>
            Por favor, ingrese sus credenciales para continuar.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid items-center gap-2">
            <Label htmlFor="username" className="flex items-center gap-1"><UserIcon className="w-3 h-3" />Nombre de Usuario (Opcional para Admin/Viewer)</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ingrese su nombre de usuario"
              onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
            />
          </div>
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
              onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
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
