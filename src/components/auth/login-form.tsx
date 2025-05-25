
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"; // Keep Card for non-modal structure
import { useClientAuth } from '@/hooks/use-client-auth';
import { useRouter } from 'next/navigation';
import { LogIn } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { AuthError } from 'firebase/auth'; 

const formSchema = z.object({
  email: z.string().email({ message: "Por favor, introduce una dirección de correo válida." }).min(1, { message: "El correo es requerido." }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
});

interface LoginFormProps {
  inModalContext?: boolean; // To adjust styling if inside the new glass modal
}

export function LoginForm({ inModalContext = false }: LoginFormProps) {
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

  const formContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4"> {/* Added mt-4 if in modal */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-white mb-1 leading-none">
            Solicitar Acceso a: ( <a href="https://wa.me/+50588102647" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline leading-none"> «clic aquí» </a> ):
          </label>
        </div>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={inModalContext ? "text-white" : ""}>Correo</FormLabel>
              <FormControl>
                <Input 
                  placeholder="tu@correo.aconic" 
                  {...field} 
                  className={inModalContext ? "bg-white/20 text-white placeholder:text-gray-300 border-white/30 focus:ring-blue-500" : ""}
                />
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
              <FormLabel className={inModalContext ? "text-white" : ""}>Contraseña</FormLabel>
              <FormControl>
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  {...field} 
                  className={inModalContext ? "bg-white/20 text-white placeholder:text-gray-300 border-white/30 focus:ring-blue-500" : ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full btn-primary text-white px-8 py-3 rounded-md font-medium" disabled={isLoading}>
          {isLoading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-solid border-primary-foreground border-t-transparent mr-2"></div>
          ) : (
            <LogIn className="mr-2 h-4 w-4" />
          )}
          Ingresar {/* Changed from Iniciar Sesión */}
        </Button>
      </form>
    </Form>
  );

  if (inModalContext) {
    return formContent; // Return only form if in modal, header is handled by Dialog
  }

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="space-y-1">
         {/* Title "CustomsEX-p" will be part of the DialogTitle in login/page.tsx */}
         {/* This CardHeader can be simplified or removed if only modal view is used */}
        <CardTitle className="text-2xl">CustomsEX-p</CardTitle>
        <CardDescription>Accede con tu correo electrónico de ACONIC</CardDescription>
      </CardHeader>
      <CardContent>
        {formContent}
      </CardContent>
    </Card>
  );
}
