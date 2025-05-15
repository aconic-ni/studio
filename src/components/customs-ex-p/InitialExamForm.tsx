
"use client";

import type { FC } from 'react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { ExamInfo } from '@/types';
import { Calendar as CalendarIcon, User, MapPin, FileText as FileTextIcon, Bookmark } from 'lucide-react'; // Renamed FileText to FileTextIcon to avoid conflict

const examInfoSchema = z.object({
  examId: z.string().min(1, " "), 
  date: z.string().min(1, " "), 
  inspectorName: z.string().min(1, " "),
  location: z.string().min(1, " "),
  reference: z.string().optional(),
});

type ExamInfoFormData = z.infer<typeof examInfoSchema>;

interface InitialExamFormProps {
  onExamInfoSubmit: (data: ExamInfo) => void;
  initialData?: ExamInfo | null;
  isReadOnly?: boolean; 
}

export const InitialExamForm: FC<InitialExamFormProps> = ({ onExamInfoSubmit, initialData, isReadOnly }) => {
  const form = useForm<ExamInfoFormData>({
    resolver: zodResolver(examInfoSchema),
    defaultValues: initialData || {
      examId: '',
      date: new Date().toISOString().split('T')[0],
      inspectorName: '',
      location: '',
      reference: '',
    },
    mode: 'onChange', // Validate on change for immediate feedback
  });

  // Effect to reset form if initialData prop changes (e.g., loading a different exam)
  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    }
  // form.reset is stable if form instance is stable. initialData is the dependency.
  }, [initialData, form.reset]);

  // Effect to update parent state on form changes
  const watchedValues = form.watch(); // Watch all fields
  useEffect(() => {
    const debouncedSubmit = setTimeout(() => {
      const currentValues = form.getValues();
      // Pass current values to parent. Parent derives completeness/validity if needed.
      onExamInfoSubmit({
        examId: currentValues.examId || '',
        date: currentValues.date || new Date().toISOString().split('T')[0], // Defaulting here if empty
        inspectorName: currentValues.inspectorName || '',
        location: currentValues.location || '',
        reference: currentValues.reference || '',
      });
    }, 300);

    return () => clearTimeout(debouncedSubmit);
  // Ensure dependencies are correct. form.getValues is a method, so 'form' is the dependency.
  // onExamInfoSubmit is a prop. watchedValues triggers the effect.
  }, [watchedValues, form, onExamInfoSubmit]);


  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <FileTextIcon className="w-6 h-6 text-primary" />
          Información del Examen
        </CardTitle>
        <CardDescription>Ingrese los detalles generales para esta examinación aduanera.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0">
            <FormField
              control={form.control}
              name="examId"
              render={({ field }) => (
                <FormItem className="mb-4"> 
                  <FormLabel className="flex items-center gap-2"><FileTextIcon className="w-4 h-4" />ID de Examen</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., EXM-2024-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel className="flex items-center gap-2"><CalendarIcon className="w-4 h-4" />Fecha</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="inspectorName"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel className="flex items-center gap-2"><User className="w-4 h-4" />Nombre del Gestor Aduanero</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Juan Pérez" 
                      {...field} 
                      readOnly={isReadOnly && !!initialData?.inspectorName} 
                      className={isReadOnly && !!initialData?.inspectorName ? "bg-muted/50 cursor-not-allowed" : ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel className="flex items-center gap-2"><MapPin className="w-4 h-4" />Ubicación</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Puerto de Veracruz, Muelle 1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reference"
              render={({ field }) => (
                <FormItem className="mb-4 md:col-span-2"> 
                  <FormLabel className="flex items-center gap-2"><Bookmark className="w-4 h-4" />Referencia (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., REF-123, Factura 456" {...field} />
                  </FormControl>
                  <FormMessage /> 
                </FormItem>
              )}
            />
          </div>
        </Form>
      </CardContent>
    </Card>
  );
};
