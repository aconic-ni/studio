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
import type { Product } from '@/types';
import { PackagePlus, Tag, Hash, DollarSign, Globe } from 'lucide-react';

const productSchema = z.object({
  name: z.string().min(1, "Product Name is required"),
  hsCode: z.string().min(1, "HS Code is required (e.g., 8517.12)"),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  value: z.coerce.number().positive("Value must be a positive number"),
  countryOfOrigin: z.string().min(1, "Country of Origin is required"),
});

type ProductFormData = z.infer<typeof productSchema>;

interface AddProductFormProps {
  onAddProduct: (product: Product) => void;
}

export const AddProductForm: FC<AddProductFormProps> = ({ onAddProduct }) => {
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      hsCode: '',
      quantity: 1,
      value: 0,
      countryOfOrigin: '',
    },
  });

  const onSubmit = (data: ProductFormData) => {
    onAddProduct({ ...data, id: crypto.randomUUID() });
    form.reset();
  };

  return (
    <Card className="shadow-lg mt-8">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <PackagePlus className="w-5 h-5 text-primary" />
          Add Product
        </CardTitle>
        <CardDescription>Specify the features of the product to add it to the list.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Tag className="w-4 h-4" />Product Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Smartphone Model X" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="hsCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Tag className="w-4 h-4" />HS Code</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 8517.12.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Hash className="w-4 h-4" />Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 100" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><DollarSign className="w-4 h-4" />Value (per unit)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="e.g., 299.99" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="countryOfOrigin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Globe className="w-4 h-4" />Country of Origin</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., China" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" className="w-full sm:w-auto">
              <PackagePlus className="mr-2 h-4 w-4" /> Add Product
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
