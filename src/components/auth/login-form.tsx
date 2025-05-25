
"use client";
import { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useClientAuth } from '@/hooks/use-client-auth';
import { useRouter } from 'next/navigation';
import { Building2, LogIn } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { AuthError } from 'firebase/auth'; // Import AuthError for specific error handling

const formSchema = z.object({
  email: z.string().email({ message: "Por favor, introduce una dirección de correo válida." }).min(1, { message: "El correo es requerido." }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
});

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useClientAuth();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function getFirebaseErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case "auth/invalid-email":
        return "El formato del correo electrónico no es válido.";
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return "Correo o contraseña incorrectos.";
      case "auth/user-disabled":
        return "Esta cuenta de usuario ha sido deshabilitada.";
      case "auth/too-many-requests":
        return "Demasiados intentos fallidos. Intenta más tarde.";
      default:
        return "Ocurrió un error al iniciar sesión. Intenta de nuevo.";
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      await login(values.email, values.password);
      toast({ title: "Inicio de Sesión Exitoso", description: "Por favor, completa la información inicial." });
      router.push('/new-exam');
    } catch (error) {
      let errorMessage = "Ocurrió un error desconocido.";
      if (error instanceof Error) {
        if ((error as AuthError).code) {
          errorMessage = getFirebaseErrorMessage((error as AuthError).code);
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({ title: "Fallo de Inicio de Sesión", description: errorMessage, variant: "destructive" });
      form.setError("email", { type: "manual", message: " " }); 
      form.setError("password", { type: "manual", message: errorMessage });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" />
          <CardTitle className="text-2xl">ACONIC Facturación Local</CardTitle>
        </div>
        <CardDescription>Accede con tu correo electrónico de ACONIC</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo</FormLabel>
                  <FormControl>
                    <Input placeholder="tu@correo.aconic" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-solid border-primary-foreground border-t-transparent mr-2"></div>
              ) : (
                <LogIn className="mr-2 h-4 w-4" />
              )}
              Iniciar Sesión
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
