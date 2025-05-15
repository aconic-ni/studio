
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
import { Calendar as CalendarIcon, User, MapPin, FileText } from 'lucide-react';

const examInfoSchema = z.object({
  examId: z.string().min(1, "ID de Examen es requerido"),
  date: z.string().min(1, "Fecha es requerida"), 
  inspectorName: z.string().min(1, "Nombre del Gestor Aduanero es requerido"),
  location: z.string().min(1, "Ubicación es requerida"),
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
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="examId"
              render={({ field }) => (
                <FormItem>
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
                <FormItem>
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
                <FormItem>
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
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><MapPin className="w-4 h-4" />Ubicación</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Puerto de Veracruz, Muelle 1" {...field} />
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
