
"use client";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useExamContext, ExamStep } from '@/contexts/exam-context';
import type { InitialInfoFormData } from '@/lib/schemas/exam-schemas';
import { initialInfoSchema } from '@/lib/schemas/exam-schemas';
import { useClientAuth } from '@/hooks/use-client-auth';
import { useEffect } from 'react';

function extractNameFromEmail(email?: string | null): string {
  if (!email) return "";
  try {
    const localPart = email.substring(0, email.lastIndexOf('@'));
    const nameParts = localPart.split(/[._-]/); 
    const formattedName = nameParts
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
    return formattedName;
  } catch (error) {
    console.error("Error extracting name from email:", error);
    return "";
  }
}

export function InitialInfoForm() {
  const { setExamData, setCurrentStep, examData: existingExamData } = useExamContext();
  const { user } = useClientAuth();

  const form = useForm<InitialInfoFormData>({
    resolver: zodResolver(initialInfoSchema),
    defaultValues: {
      ne: '',
      reference: '',
      manager: '',
      location: '',
    },
  });

  useEffect(() => {
    const defaultManagerName =
      existingExamData?.manager ||
      (user?.email ? extractNameFromEmail(user.email) : '');
    
    form.reset({
      ne: existingExamData?.ne || '',
      reference: existingExamData?.reference || '',
      manager: defaultManagerName,
      location: existingExamData?.location || '',
    });
  }, [user, existingExamData, form]);


  function onSubmit(data: InitialInfoFormData) {
    setExamData(data);
    setCurrentStep(ExamStep.PRODUCT_LIST);
  }

  return (
    <Card className="w-full max-w-3xl mx-auto custom-shadow bg-card text-card-foreground"> {/* Matched HTML: bg-white, custom-shadow */}
      <CardHeader className="p-5 md:p-8 pb-0"> {/* Matched HTML: p-5 md:p-8 */}
        <CardTitle className="text-xl md:text-2xl font-semibold mb-6 text-foreground"> {/* Matched HTML: text-gray-800 */}
          Nuevo Examen
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 md:p-8 pt-0"> {/* Matched HTML: p-5 md:p-8 for content area */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="ne"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="block text-sm font-medium text-foreground/80 mb-1">NE (Seguimiento NX1) *</FormLabel> {/* Matched HTML: text-gray-700 */}
                    <FormControl>
                      <Input placeholder="Ej: NX1-12345" {...field} className="w-full px-4 py-3 border-input focus:ring-primary" /> {/* Matched HTML styles */}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="block text-sm font-medium text-foreground/80 mb-1">Referencia (Contenedor, Guía, BL, Factura...)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: MSKU1234567" {...field} className="w-full px-4 py-3 border-input focus:ring-primary" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="manager"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="block text-sm font-medium text-foreground/80 mb-1">Nombre del Gestor *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre completo del gestor" {...field} className="w-full px-4 py-3 border-input focus:ring-primary" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="block text-sm font-medium text-foreground/80 mb-1">Ubicación de la Mercancía *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Almacén Central, Bodega 5" {...field} className="w-full px-4 py-3 border-input focus:ring-primary" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" className="btn-primary text-white px-6 py-3 rounded-md font-medium"> {/* Matched HTML button style */}
                Continuar
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
