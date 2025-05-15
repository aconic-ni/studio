
"use client";

import type { FC } from 'react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
// Removed Button from here as it's now in modal footer
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { Product, ProductStatus } from '@/types'; // Product type not strictly needed here if we use ProductFormData
import { PRODUCT_STATUS } from '@/types';
import { 
    PackagePlus, X, ListOrdered, Archive, Boxes, ShoppingBasket, AlignLeft, Bookmark, ToyBrick, 
    Globe2, ShieldQuestion, Weight, Ruler, Barcode, MessageCircle, CheckCircle2 
} from 'lucide-react';

// Schema for form data, omits 'id'
const productSchema = z.object({
  itemNumber: z.string().min(1, "Número de Item es requerido"),
  packageNumbers: z.string().optional(),
  packageQuantity: z.coerce.number().int().min(0, "Cantidad de Bultos debe ser al menos 0"),
  unitQuantity: z.coerce.number().int().min(1, "Cantidad de Unidades debe ser al menos 1"),
  description: z.string().min(1, "Descripción es requerida"),
  brand: z.string().optional(),
  model: z.string().optional(),
  origin: z.string().min(1, "Origen es requerido"),
  merchandiseState: z.string().optional(),
  weightValue: z.coerce.number().positive("Peso debe ser un número positivo").optional().or(z.literal(0)),
  weightUnit: z.string().optional(),
  measurementUnit: z.string().min(1, "Unidad de Medida es requerida"),
  serialNumber: z.string().optional(),
  observation: z.string().optional(),
  status: z.nativeEnum(PRODUCT_STATUS, { errorMap: () => ({ message: "Debe seleccionar un estado."}) }),
});

// This is the type the form will output
export type ProductFormData = z.infer<typeof productSchema>;

interface AddProductFormProps {
  onSubmit: (data: ProductFormData) => void; // Changed from onAddProduct
  initialData?: ProductFormData; // For editing
  formId: string; // To link modal's submit button
}

export const AddProductForm: FC<AddProductFormProps> = ({ onSubmit, initialData, formId }) => {
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: initialData || { // Populate with initialData if provided
      itemNumber: '',
      packageNumbers: '',
      packageQuantity: 0,
      unitQuantity: 1,
      description: '',
      brand: '',
      model: '',
      origin: '',
      merchandiseState: '',
      weightValue: 0,
      weightUnit: 'kg',
      measurementUnit: 'unidades',
      serialNumber: '',
      observation: '',
      status: PRODUCT_STATUS.CONFORME,
    },
  });

  useEffect(() => {
    // Reset the form if initialData changes (e.g., when switching between editing different products or new product)
    form.reset(initialData || {
      itemNumber: '',
      packageNumbers: '',
      packageQuantity: 0,
      unitQuantity: 1,
      description: '',
      brand: '',
      model: '',
      origin: '',
      merchandiseState: '',
      weightValue: 0,
      weightUnit: 'kg',
      measurementUnit: 'unidades',
      serialNumber: '',
      observation: '',
      status: PRODUCT_STATUS.CONFORME,
    });
  }, [initialData, form]);

  // The actual submit handler which calls the onSubmit prop
  const handleFormSubmit = (data: ProductFormData) => {
    onSubmit(data); // Pass data up to the modal
    // Form reset will be handled by modal closing or initialData change if needed
  };

  return (
    <Form {...form}>
      {/* Added pt-4 and pb-4 for vertical padding within the scrollable area */}
      <form onSubmit={form.handleSubmit(handleFormSubmit)} id={formId} className="space-y-6 pt-4 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="itemNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2"><ListOrdered className="w-4 h-4" />Número de Item</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="packageNumbers"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2"><Archive className="w-4 h-4" />Numeración de Bultos</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 001-010, A05" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="packageQuantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2"><Boxes className="w-4 h-4" />Cantidad de Bultos</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g., 10" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="unitQuantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2"><ShoppingBasket className="w-4 h-4" />Cantidad de Unidades</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g., 100" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="measurementUnit"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2"><Ruler className="w-4 h-4" />Unidad de Medida (Cant.)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Unidades, Pares" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="lg:col-span-2">
                <FormLabel className="flex items-center gap-2"><AlignLeft className="w-4 h-4" />Descripción</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Camisetas de algodón para hombre" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="brand"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2"><Bookmark className="w-4 h-4" />Marca</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., SuperMarca" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2"><ToyBrick className="w-4 h-4" />Modelo</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., TX-1000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="serialNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2"><Barcode className="w-4 h-4" />Serie</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., SN12345ABC" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="origin"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2"><Globe2 className="w-4 h-4" />Origen</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., China" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="merchandiseState"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2"><ShieldQuestion className="w-4 h-4" />Estado de Mercancía</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Nuevo, Usado, Reacondicionado" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="grid grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="weightValue"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="flex items-center gap-2"><Weight className="w-4 h-4" />Peso</FormLabel>
                        <FormControl>
                        <Input type="number" step="any" placeholder="e.g., 25.5" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="weightUnit"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="flex items-center gap-2"><Ruler className="w-4 h-4" />Unidad de Peso</FormLabel>
                        <FormControl>
                        <Input placeholder="e.g., kg, lb" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
            <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                <FormItem className="space-y-2">
                    <FormLabel className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />Estado</FormLabel>
                    <FormControl>
                    <RadioGroup
                        onValueChange={field.onChange}
                        // Use `value` instead of `defaultValue` to make it a controlled component with react-hook-form
                        value={field.value}
                        className="grid grid-cols-2 gap-2 md:grid-cols-2 lg:flex lg:flex-wrap lg:gap-x-4 lg:space-y-0"
                    >
                        {Object.values(PRODUCT_STATUS).map((statusValue) => (
                        <FormItem key={statusValue} className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                            <RadioGroupItem value={statusValue} id={`status-${statusValue.replace(/\s+/g, '-')}`} />
                            </FormControl>
                            <FormLabel htmlFor={`status-${statusValue.replace(/\s+/g, '-')}`} className="font-normal text-sm">
                            {statusValue}
                            </FormLabel>
                        </FormItem>
                        ))}
                    </RadioGroup>
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>

        <FormField
          control={form.control}
          name="observation"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2"><MessageCircle className="w-4 h-4" />Observación</FormLabel>
              <FormControl>
                <Textarea placeholder="Alguna observación adicional sobre el producto..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Buttons are now in the modal footer */}
      </form>
    </Form>
  );
};

