
"use client";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useExamContext, ExamStep } from '@/contexts/exam-context';
import type { InitialInfoFormData } from '@/lib/schemas/exam-schemas';
import { initialInfoSchema } from '@/lib/schemas/exam-schemas';
import { useClientAuth } from '@/hooks/use-client-auth';
import { useEffect } from 'react';

// Helper function to extract and format name from email
function extractNameFromEmail(email?: string | null): string {
  if (!email) return "";
  try {
    const localPart = email.substring(0, email.lastIndexOf('@'));
    const nameParts = localPart.split(/[._-]/); // Split by dot, underscore, or hyphen
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
    // Set default values once user and existingExamData are available
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
    <Card className="w-full max-w-3xl mx-auto shadow-xl border">
      <CardHeader>
        <CardTitle className="text-2xl">Información Inicial de Facturación</CardTitle>
        <CardDescription>Complete los detalles básicos para iniciar el proceso de facturación.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="ne"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NE (Seguimiento NX1) *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: NX1-12345" {...field} />
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
                    <FormLabel>Referencia (Contenedor, Guía, BL, Factura...)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: MSKU1234567" {...field} />
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
                    <FormLabel>Nombre del Gestor *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre completo del gestor" {...field} />
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
                    <FormLabel>Ubicación de la Mercancía *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Almacén Central, Bodega 5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-end pt-4">
              <Button type="submit" size="lg">
                Continuar al Inventario
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
