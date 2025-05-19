"use client";

import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ProductSchema, type Product } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { HsCodeSuggestor } from './HsCodeSuggestor'; // Import the new component
import { ScrollArea } from '@/components/ui/scroll-area';

interface AddProductModalContentProps {
  onSubmitProduct: (product: Product) => void;
  onClose: () => void;
  initialData?: Product;
  productDescriptionForAISuggestion?: string;
}

export function AddProductModalContent({ onSubmitProduct, onClose, initialData }: AddProductModalContentProps) {
  const form = useForm<Product>({
    resolver: zodResolver(ProductSchema),
    defaultValues: initialData || {
      itemNumber: '',
      description: '',
      weight: '',
      brand: '',
      model: '',
      unitMeasure: '',
      serial: '',
      origin: '',
      numberPackages: '',
      quantityPackages: 1,
      quantityUnits: 1,
      packagingCondition: '',
      observation: '',
      hsCode: '',
      isConform: false,
      isExcess: false,
      isMissing: false,
      isFault: false,
    },
  });

  const watchedDescription = form.watch("description");

  const handleSuggestion = (hsCode: string, explanation: string) => {
    form.setValue("hsCode", hsCode);
    // You could also store explanation if needed, e.g., in observation or a new field
    if(form.getValues("observation")){
        form.setValue("observation", `${form.getValues("observation")}\nExplicación HS: ${explanation}`);
    } else {
        form.setValue("observation", `Explicación HS: ${explanation}`);
    }
  };

  const handleSubmit: SubmitHandler<Product> = (data) => {
    const productWithId = { ...data, id: initialData?.id || crypto.randomUUID() };
    onSubmitProduct(productWithId);
    onClose();
  };
  
  const renderInput = (name: keyof Product, label: string, placeholder?: string, type: string = "text", spanFull?: boolean) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={spanFull ? "md:col-span-2" : ""}>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            {type === "textarea" ? (
              <Textarea placeholder={placeholder} {...field} value={field.value || ''} rows={2} />
            ) : (
              <Input type={type} placeholder={placeholder} {...field} value={field.value || ''} />
            )}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  const renderCheckbox = (name: keyof Product, label: string) => (
     <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
            <FormControl>
              <Checkbox
                checked={field.value as boolean}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>{label}</FormLabel>
            </div>
          </FormItem>
        )}
      />
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <ScrollArea className="h-[65vh] pr-4"> {/* Adjust height as needed */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderInput("itemNumber", "Número de Item", "Ej: 001")}
          {renderInput("weight", "Peso", "Ej: 10 KG")}
          {renderInput("description", "Descripción", "Detalles del producto", "textarea", true)}
          <div className="md:col-span-2">
             {watchedDescription && (
                <HsCodeSuggestor
                    productDescription={watchedDescription}
                    onSuggestion={handleSuggestion}
                />
             )}
          </div>
          {renderInput("hsCode", "Código HS (Sugerido)", "Ej: 8517.12.00")}
          {renderInput("brand", "Marca", "Ej: Samsung")}
          {renderInput("model", "Modelo", "Ej: Galaxy S21")}
          {renderInput("unitMeasure", "Unidad de Medida", "Ej: UN / Pares / Docenas ")}
          {renderInput("serial", "Serie", "Ej: SN12345ABC")}
          {renderInput("origin", "Origen", "Ej: China")}
          {renderInput("numberPackages", "Numeración de Bultos", "Ej: 1/10, 2/10...")}
          {renderInput("quantityPackages", "Cantidad de Bultos", "Ej: 10", "number")}
          {renderInput("quantityUnits", "Cantidad de Unidades", "Ej: 100", "number")}
          {renderInput("packagingCondition", "Estado de Mercancía (Nueva, Usada, Otros)", "Ej: Nueva")}
          {renderInput("observation", "Observación", "Cualquier detalle adicional", "textarea", true)}
        </div>

        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 mt-4">
          {renderCheckbox("isConform", "Conforme a factura")}
          {renderCheckbox("isExcess", "Notificar excedente")}
          {renderCheckbox("isMissing", "Notificar faltante")}
          {renderCheckbox("isFault", "Notificar Avería")}
        </div>
        </ScrollArea>
        <DialogFooter className="pt-4 gap-3">
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancelar</Button>
          </DialogClose>
          <Button type="submit">{initialData ? 'Guardar Cambios' : 'Guardar Producto'}</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
