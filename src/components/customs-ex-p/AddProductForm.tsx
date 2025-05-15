"use client";

import type { FC } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { Product } from '@/types';
import { PackagePlus, Tag, Hash, DollarSign, Globe, X } from 'lucide-react';

const productSchema = z.object({
  name: z.string().min(1, "Nombre del Producto es requerido"),
  hsCode: z.string().min(1, "Código HS es requerido (e.g., 8517.12)"),
  quantity: z.coerce.number().int().min(1, "Cantidad debe ser al menos 1"),
  value: z.coerce.number().positive("Valor debe ser un número positivo"),
  countryOfOrigin: z.string().min(1, "País de Origen es requerido"),
});

type ProductFormData = z.infer<typeof productSchema>;

interface AddProductFormProps {
  onAddProduct: (product: Product) => void;
  onCancel: () => void;
}

export const AddProductForm: FC<AddProductFormProps> = ({ onAddProduct, onCancel }) => {
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

  // Reset form when modal opens (via key prop or useEffect if form instance is stable)
  // This is typically handled by AddProductModal re-mounting or explicitly calling reset.
  // For now, we assume form.reset() in onSubmit is sufficient for subsequent adds.
  // If the modal simply hides/shows, the form state persists.
  // AddProductModal re-renders AddProductForm if its props change or it re-mounts.
  // A simple way: AddProductModal could pass a `key` prop to AddProductForm that changes when it opens.
  // Or, form.reset() could be called by AddProductModal when it opens.
  // For now, assuming form.reset() in onSubmit is enough.

  const onSubmit = (data: ProductFormData) => {
    onAddProduct({ ...data, id: crypto.randomUUID() });
    form.reset(); 
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
        <div className="grid md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2"><Tag className="w-4 h-4" />Nombre del Producto</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Teléfono Inteligente Modelo X" {...field} />
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
                <FormLabel className="flex items-center gap-2"><Tag className="w-4 h-4" />Código HS</FormLabel>
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
                <FormLabel className="flex items-center gap-2"><Hash className="w-4 h-4" />Cantidad</FormLabel>
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
                <FormLabel className="flex items-center gap-2"><DollarSign className="w-4 h-4" />Valor (por unidad)</FormLabel>
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
                <FormLabel className="flex items-center gap-2"><Globe className="w-4 h-4" />País de Origen</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., China" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onCancel}>
                <X className="mr-2 h-4 w-4" /> Cancelar
            </Button>
            <Button type="submit">
                <PackagePlus className="mr-2 h-4 w-4" /> Agregar Producto
            </Button>
        </div>
      </form>
    </Form>
  );
};
