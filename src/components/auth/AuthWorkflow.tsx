
"use client";

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { APP_NAME, APP_SUBTITLE, APP_AUTHOR } from '@/lib/constants';
import { LoginSchema, type LoginFormData, type UserRole } from '@/lib/schemas';
import { AppLogo } from '@/components/common/AppLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from '@/hooks/use-toast';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore'; 
import { auth, db } from '@/lib/firebase';
import { localUsers } from '@/lib/localUsers'; 

interface AuthWorkflowProps {
  onLoginSuccess: (role: UserRole) => void;
}

export function AuthWorkflow({ onLoginSuccess }: AuthWorkflowProps) {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { toast } = useToast();

  const form = useForm<LoginFormData>({ 
    resolver: zodResolver(LoginSchema), 
    defaultValues: {
      email: '', 
      password: '', 
    },
  });

  const onSubmit: SubmitHandler<LoginFormData> = async (data) => { 
    setIsLoading(true);
    
    const localUserMatch = localUsers.find(
      (user) => user.email === data.email && user.password === data.password
    );

    if (localUserMatch) {
      toast({ title: "Acceso Local Concedido", description: `Bienvenido (local). Rol: ${localUserMatch.role?.toUpperCase()}` });
      onLoginSuccess(localUserMatch.role);
      setIsLoading(false);
      setIsLoginModalOpen(false);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const role = userData.role as UserRole;
        if (role) {
          // onLoginSuccess will be called by onAuthStateChanged in HomePage if this path is taken
          // for now, we can signal success and close
          setIsLoginModalOpen(false); 
        } else {
          throw new Error("Rol de usuario no encontrado en Firestore.");
        }
      } else {
        console.warn(`Datos de usuario (rol) no encontrados en Firestore para UID: ${user.uid}. Podría ser un usuario de Firebase Auth sin perfil en Firestore o Firestore está inactivo.`);
        // If Firestore is inactive or user doc doesn't exist, onAuthStateChanged will handle default role.
        // We can consider this a successful AuthN, role will be default.
        setIsLoginModalOpen(false);
      }
    } catch (error: any) {
      console.error("Login error (Firebase):", error.code, error.message);
      let errorMessage = "Error al iniciar sesión.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = "Usuario o contraseña incorrectos.";
      }
      // Reverted: UI toast for all Firebase login errors
      toast({ title: "Error de Acceso", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="flex flex-col items-center text-center">
        <div onClick={() => setIsLoginModalOpen(true)} className="logo-pulse mb-8 cursor-pointer">
          <AppLogo size={128} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">{APP_NAME}</h1>
        <p className="text-blue-200">{APP_SUBTITLE}</p>
        <p className="text-blue-200 text-sm mt-1">{APP_AUTHOR}</p>
      </div>

      <Dialog open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen}>
        <DialogContent className="glass-effect sm:max-w-md text-white p-6 rounded-lg">
          <DialogHeader className="text-left mb-4">
            <DialogTitle className="text-2xl font-bold text-white">{APP_NAME}</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email" 
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="block text-sm font-medium text-white mb-1 leading-tight">
                      Usuario
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        required 
                        className="w-full px-4 py-3 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white/20 text-white placeholder-gray-300"
                        autoComplete="username" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage className="text-red-300" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="block text-sm font-medium text-white mb-1 leading-tight">
                      Contraseña
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="password"
                        required 
                        className="w-full px-4 py-3 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white/20 text-white placeholder-gray-300"
                        autoComplete="current-password"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage className="text-red-300" />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-md font-medium w-full" disabled={isLoading}>
                {isLoading ? 'Ingresando...' : 'Ingresar'}
              </Button>
            </form>
          </Form>
          
          <div className="mt-4 text-center">
              <p className="text-xs text-gray-300 mt-1"> </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
