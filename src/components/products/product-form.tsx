
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox"; // Added Checkbox
import type { Product, ProductFormData } from "@/lib/types";

// Updated Zod schema based on the new fields from HTML
const formSchema = z.object({
  itemNumber: z.string().min(1, "Número de Item es requerido"),
  name: z.string().min(1, "Descripción es requerida"), // 'name' maps to 'description' in HTML
  weight: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  unitMeasure: z.string().optional(),
  serial: z.string().optional(),
  origin: z.string().optional(),
  numberPackages: z.string().optional(),
  quantityPackages: z.coerce.number().min(0, "Cantidad de bultos debe ser no-negativa").optional(),
  quantity: z.coerce.number().min(1, "Cantidad de unidades debe ser al menos 1"), // 'quantity' maps to 'quantityUnits'
  packagingCondition: z.string().optional(), // Text input as per HTML
  observation: z.string().optional(),
  isConform: z.boolean().optional().default(false),
  isExcess: z.boolean().optional().default(false),
  isMissing: z.boolean().optional().default(false),
  isFault: z.boolean().optional().default(false),
  // Fields from InitialInfoForm that might be part of product context if needed, but typically not in product item itself
  reference: z.string().optional(), 
  location: z.string().optional(),
});

interface ProductFormProps {
  product?: Product;
  onSubmit: (data: ProductFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ProductForm({ product, onSubmit, onCancel, isLoading }: ProductFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      itemNumber: product?.itemNumber || "",
      name: product?.name || "",
      weight: product?.weight || "",
      brand: product?.brand || "",
      model: product?.model || "",
      unitMeasure: product?.unitMeasure || "",
      serial: product?.serial || "",
      origin: product?.origin || "",
      numberPackages: product?.numberPackages || "",
      quantityPackages: product?.quantityPackages || 0,
      quantity: product?.quantity || 1,
      packagingCondition: product?.packagingCondition || "",
      observation: product?.observation || "",
      isConform: product?.isConform || false,
      isExcess: product?.isExcess || false,
      isMissing: product?.isMissing || false,
      isFault: product?.isFault || false,
      reference: product?.reference || "",
      location: product?.location || "",
    },
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    await onSubmit(values as ProductFormData); // Cast as ProductFormData
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="itemNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de Item</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: SKU123" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="weight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Peso</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: 10kg" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="name" // Maps to 'description' in your HTML
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Textarea placeholder="Descripción detallada del producto" {...field} rows={2} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="brand"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Marca</FormLabel>
                <FormControl>
                  <Input placeholder="Marca del producto" {...field} />
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
                <FormLabel>Modelo</FormLabel>
                <FormControl>
                  <Input placeholder="Modelo del producto" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="unitMeasure"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unidad de Medida</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Piezas, Cajas" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="serial"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Serie</FormLabel>
                <FormControl>
                  <Input placeholder="Número de serie" {...field} />
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
                <FormLabel>Origen</FormLabel>
                <FormControl>
                  <Input placeholder="País de origen" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="numberPackages"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Numeración de Bultos</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: 1/10, 2/10" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="quantityPackages"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cantidad de Bultos</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="quantity" // Maps to 'quantityUnits'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cantidad de Unidades</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="packagingCondition"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado de Mercancía (Nueva, Usada, Otros)</FormLabel>
                <FormControl>
                   <Input placeholder="Ej: Nueva, Usada" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="observation"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Observación</FormLabel>
                <FormControl>
                  <Textarea placeholder="Observaciones adicionales" {...field} rows={2}/>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 mt-4">
          <FormField
            control={form.control}
            name="isConform"
            render={({ field }) => (
              <FormItem className="custom-checkbox-label">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} className="custom-checkbox-input" />
                </FormControl>
                <div className="custom-checkbox-checkmark"></div>
                <FormLabel className="text-sm text-gray-700 ml-2">Conforme a factura</FormLabel>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="isExcess"
            render={({ field }) => (
              <FormItem className="custom-checkbox-label">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} className="custom-checkbox-input" />
                </FormControl>
                 <div className="custom-checkbox-checkmark"></div>
                <FormLabel className="text-sm text-gray-700 ml-2">Notificar excedente</FormLabel>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="isMissing"
            render={({ field }) => (
              <FormItem className="custom-checkbox-label">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} className="custom-checkbox-input" />
                </FormControl>
                <div className="custom-checkbox-checkmark"></div>
                <FormLabel className="text-sm text-gray-700 ml-2">Notificar faltante</FormLabel>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="isFault"
            render={({ field }) => (
              <FormItem className="custom-checkbox-label">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} className="custom-checkbox-input" />
                </FormControl>
                <div className="custom-checkbox-checkmark"></div>
                <FormLabel className="text-sm text-gray-700 ml-2">Notificar Avería</FormLabel>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end pt-4 gap-3">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="px-4 py-3 border-gray-300 text-gray-700 hover:bg-gray-50">
            Cancelar
          </Button>
          <Button type="submit" className="btn-primary text-white px-6 py-3" disabled={isLoading}>
            {isLoading ? "Guardando..." : (product ? "Guardar Cambios" : "Guardar")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
