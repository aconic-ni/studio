"use client";

import { useState, useEffect, useMemo } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { APP_NAME, APP_SUBTITLE, APP_AUTHOR } from '@/lib/constants';
import { generateAccessCode, convertCodeToWords } from '@/lib/utils';
import { AccessCodeSchema, type AccessCodeFormData } from '@/lib/schemas';
import { AppLogo } from '@/components/common/AppLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { XIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AuthWorkflowProps {
  onLoginSuccess: () => void;
}

export function AuthWorkflow({ onLoginSuccess }: AuthWorkflowProps) {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [serverAccessCode, setServerAccessCode] = useState('');
  
  const { toast } = useToast();

  useEffect(() => {
    setServerAccessCode(generateAccessCode());
  }, []);

  const accessCodeWords = useMemo(() => convertCodeToWords(serverAccessCode), [serverAccessCode]);

  const form = useForm<AccessCodeFormData>({
    resolver: zodResolver(AccessCodeSchema),
    defaultValues: {
      accessCode: '',
    },
  });

  const onSubmit: SubmitHandler<AccessCodeFormData> = (data) => {
    if (data.accessCode === serverAccessCode) {
      toast({ title: "Acceso Concedido", description: "Bienvenido a CustomsEX-p." });
      onLoginSuccess();
    } else {
      toast({
        title: "Error de Acceso",
        description: "Código incorrecto. Inténtelo de nuevo o solicite uno nuevo.",
        variant: "destructive",
      });
      form.reset();
      // Optionally regenerate code on failed attempt:
      // setServerAccessCode(generateAccessCode());
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
          <DialogHeader className="flex flex-row justify-between items-center mb-4">
            <DialogTitle className="text-2xl font-bold text-white">{APP_NAME}</DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="text-white hover:text-gray-300">
                <XIcon className="h-6 w-6" />
              </Button>
            </DialogClose>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="accessCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="block text-sm font-medium text-white mb-1 leading-tight">
                      Solicitar Acceso a Coordinación ACONIC (
                      <a 
                        href="https://wa.me/+50583956505" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 underline leading-tight"
                        onClick={(e) => e.stopPropagation()}
                      >
                        clic aquí
                      </a>
                      ):
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="text"
                        maxLength={6}
                        required 
                        className="w-full px-4 py-3 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary code-input bg-white/20 text-white placeholder-gray-300"
                        autoComplete="off" 
                        inputMode="numeric" 
                        pattern="[0-9]*"
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
          
          {serverAccessCode && (
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-300 mt-1">Código: {accessCodeWords}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
