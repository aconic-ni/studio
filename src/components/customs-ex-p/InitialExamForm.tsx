
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
import { Calendar as CalendarIcon, User, MapPin, FileText, Bookmark } from 'lucide-react';

const examInfoSchema = z.object({
  examId: z.string().min(1, " "), // Message is a space to hide it but trigger error state
  date: z.string().min(1, " "), 
  inspectorName: z.string().min(1, " "),
  location: z.string().min(1, " "),
  reference: z.string().optional(),
});

type ExamInfoFormData = z.infer<typeof examInfoSchema>;

interface InitialExamFormProps {
  onExamInfoSubmit: (data: ExamInfo) => void;
  initialData?: ExamInfo | null;
  isReadOnly?: boolean; // For pre-filled gestor name
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
  });

  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    }
  }, [initialData, form]);

  const watchedValues = form.watch();
  useEffect(() => {
    const debouncedSubmit = setTimeout(() => {
      form.trigger().then(isValid => {
        // Always submit current values, valid or not, to keep parent state updated
        const currentValues = form.getValues();
        onExamInfoSubmit({
            examId: currentValues.examId || '',
            date: currentValues.date || new Date().toISOString().split('T')[0],
            inspectorName: currentValues.inspectorName || '',
            location: currentValues.location || '',
            reference: currentValues.reference || '',
        });
      });
    }, 300); 

    return () => clearTimeout(debouncedSubmit);
  }, [watchedValues, form, onExamInfoSubmit]);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <FileText className="w-6 h-6 text-primary" />
          Información del Examen
        </CardTitle>
        <CardDescription>Ingrese los detalles generales para esta examinación aduanera.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0"> {/* Reduced gap-y for tighter packing */}
            <FormField
              control={form.control}
              name="examId"
              render={({ field }) => (
                <FormItem className="mb-4"> {/* Added margin bottom to form item */}
                  <FormLabel className="flex items-center gap-2"><FileText className="w-4 h-4" />ID de Examen</FormLabel>
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
                <FormItem className="mb-4 md:col-span-2"> {/* Optional: spans 2 cols on md+ if desired, or keep 1 */}
                  <FormLabel className="flex items-center gap-2"><Bookmark className="w-4 h-4" />Referencia (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., REF-123, Factura 456" {...field} />
                  </FormControl>
                  <FormMessage /> {/* Still include for other potential errors if schema changes */}
                </FormItem>
              )}
            />
          </div>
        </Form>
      </CardContent>
    </Card>
  );
};

