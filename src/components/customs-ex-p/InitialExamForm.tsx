"use client";

import type { FC } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { ExamInfo } from '@/types';
import { Calendar as CalendarIcon, User, MapPin, FileText } from 'lucide-react';

const examInfoSchema = z.object({
  examId: z.string().min(1, "Exam ID is required"),
  date: z.string().min(1, "Date is required"),
  inspectorName: z.string().min(1, "Inspector Name is required"),
  location: z.string().min(1, "Location is required"),
});

type ExamInfoFormData = z.infer<typeof examInfoSchema>;

interface InitialExamFormProps {
  onExamInfoSubmit: (data: ExamInfo) => void;
  initialData?: ExamInfo;
}

export const InitialExamForm: FC<InitialExamFormProps> = ({ onExamInfoSubmit, initialData }) => {
  const form = useForm<ExamInfoFormData>({
    resolver: zodResolver(examInfoSchema),
    defaultValues: initialData || {
      examId: '',
      date: new Date().toISOString().split('T')[0], // Default to today's date
      inspectorName: '',
      location: '',
    },
  });

  const onSubmit = (data: ExamInfoFormData) => {
    onExamInfoSubmit(data);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <FileText className="w-6 h-6 text-primary" />
          Exam Information
        </CardTitle>
        <CardDescription>Enter the general details for this customs examination.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="examId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><FileText className="w-4 h-4" />Exam ID</FormLabel>
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
                  <FormLabel className="flex items-center gap-2"><CalendarIcon className="w-4 h-4" />Date</FormLabel>
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
                  <FormLabel className="flex items-center gap-2"><User className="w-4 h-4" />Inspector Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., John Doe" {...field} />
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
                  <FormLabel className="flex items-center gap-2"><MapPin className="w-4 h-4" />Location</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Port of Antwerp, Terminal 1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* The form submission is handled by the page, so no submit button here if part of a larger flow, or keep it to "save" this section */}
            {/* For this design, let's assume exam info is "set" once and doesn't need a dedicated save button within this component if part of a single page flow */}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
