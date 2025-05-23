
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
import { getFirebaseAuth, getFirebaseFirestore } from '@/lib/firebase';
import { localUsers } from '@/lib/localUsers'; // Assuming localUsers.ts exists

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
    console.log("[Login Attempt] Email:", data.email);

    // 1. Check local users first
    const localUserMatch = localUsers.find(
      (user) => user.email === data.email && user.password === data.password
    );

    if (localUserMatch) {
      console.log("[Login Success] Local user matched:", localUserMatch.email, "Role:", localUserMatch.role);
      // toast({ title: "Acceso Local Concedido", description: `Bienvenido (local). Rol: ${localUserMatch.role?.toUpperCase()}` });
      onLoginSuccess(localUserMatch.role);
      setIsLoading(false);
      setIsLoginModalOpen(false);
      return;
    }

    // 2. If no local match, attempt Firebase Auth
    console.log("[Login Attempt] No local user match, attempting Firebase Auth for:", data.email);
    const auth = getFirebaseAuth();
    const db = getFirebaseFirestore();

    if (!auth || !db) {
        console.error("[Login Error] Firebase auth or db instance is not available.");
        toast({ title: "Error de Configuración", description: "Servicio de autenticación no disponible.", variant: "destructive" });
        setIsLoading(false);
        return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;
      console.log("[AuthWorkflow - Firebase Auth] Signed in. User UID:", user.uid, "Email:", user.email);

      const userDocRef = doc(db, "users", user.uid);
      console.log("[AuthWorkflow - Firestore Role Check] Attempting to get doc:", `/users/${user.uid}`);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const role = userData.role as UserRole;
        console.log(`[AuthWorkflow - Firestore Role Check] Document for UID ${user.uid} exists. UserData:`, userData, "Role from Firestore:", role);
        if (role) {
          onLoginSuccess(role);
        } else {
          console.warn(`[AuthWorkflow - Firestore Role Check] Role field missing or empty in Firestore for UID: ${user.uid}. UserData:`, userData, "Defaulting to 'gestor' role.");
          onLoginSuccess('gestor'); // Default if role field is missing
        }
      } else {
        console.warn(`[AuthWorkflow - Firestore Role Check] Firestore document /users/${user.uid} NOT FOUND for authenticated user ${user.email}. Defaulting to 'gestor' role.`);
        onLoginSuccess('gestor'); // Default if user document doesn't exist
      }
      setIsLoginModalOpen(false);

    } catch (error: any) {
      console.error("[Firebase Auth Error] Login failed for", data.email, "Error Code:", error.code, "Message:", error.message, error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        toast({ title: "Error de Acceso", description: "Usuario o contraseña incorrectos.", variant: "destructive" });
      } else {
        // For other Firebase errors (network, service unavailable), only log to console.
        console.error("Firebase login attempt failed with a non-credential error:", error.code, error.message);
        // Do not show a toast for general backend errors here.
      }
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
    
