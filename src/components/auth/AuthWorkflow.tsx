
"use client";

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { APP_NAME, APP_SUBTITLE, APP_AUTHOR } from '@/lib/constants';
// import { generateAccessCode, convertCodeToWords } from '@/lib/utils'; // Commented out
import { LoginSchema, type LoginFormData, type UserRole } from '@/lib/schemas'; // Updated schema import
import { AppLogo } from '@/components/common/AppLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from '@/hooks/use-toast';

interface AuthWorkflowProps {
  onLoginSuccess: (role: UserRole) => void;
}

export function AuthWorkflow({ onLoginSuccess }: AuthWorkflowProps) {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  // const [serverAccessCode, setServerAccessCode] = useState(''); // Commented out
  
  const { toast } = useToast();

  // useEffect(() => { // Commented out
  //   setServerAccessCode(generateAccessCode());
  // }, []);

  // const accessCodeWords = useMemo(() => convertCodeToWords(serverAccessCode), [serverAccessCode]); // Commented out

  const form = useForm<LoginFormData>({ // Updated to LoginFormData
    resolver: zodResolver(LoginSchema), // Updated to LoginSchema
    defaultValues: {
      email: '', // Added email
      password: '', // Added password
    },
  });

  const onSubmit: SubmitHandler<LoginFormData> = (data) => { // Updated to LoginFormData
    // Placeholder for actual Firebase authentication
    console.log("Login attempt with:", data.email, data.password);
    toast({ title: "Inicio de Sesión", description: "Verificando credenciales..." });
    
    let role: UserRole = 'gestor'; // Default role

    if (data.email.toLowerCase() === 'admin@customsex.com') {
      role = 'admin';
    } else if (data.email.toLowerCase() === 'ejecutivo@customsex.com') {
      role = 'ejecutivo';
    } else if (data.email.toLowerCase() === 'gestor@customsex.com') {
      role = 'gestor';
    }
    // Any other email defaults to 'gestor' as set above

    // For now, grant access immediately. Replace with Firebase auth later.
    onLoginSuccess(role); 
    
    // Old logic:
    // if (data.accessCode === serverAccessCode) {
    //   toast({ title: "Acceso Concedido", description: "Bienvenido a CustomsEX-p." });
    //   onLoginSuccess();
    // } else {
    //   toast({
    //     title: "Error de Acceso",
    //     description: "Incorrecto. Inténtelo de nuevo o solicite uno nuevo.",
    //     variant: "destructive",
    //   });
    //   form.reset();
    //   // Optionally regenerate code on failed attempt:
    //   // setServerAccessCode(generateAccessCode());
    // }
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
                      Correo Electrónico (Usuario)
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="email"
                        required 
                        className="w-full px-4 py-3 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white/20 text-white placeholder-gray-300"
                        autoComplete="email"
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
              
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-md font-medium w-full">
                Ingresar
              </Button>
            </form>
          </Form>
          
          {/* {serverAccessCode && ( // Commented out access code display
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-300 mt-1"> </p>
            </div>
          )} */}
        </DialogContent>
      </Dialog>
    </div>
  );
}
