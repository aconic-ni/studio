
"use client";

import type { FC } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Product } from '@/types';
import { AddProductForm } from './AddProductForm';
import { PackagePlus, Save, X } from 'lucide-react';

// Matches the Zod schema in AddProductForm
type ProductFormData = Omit<Product, 'id'>;

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveProduct: (productData: ProductFormData, editingProductId: string | null) => void;
  productToEdit?: Product | null;
  initialProductData: Omit<Product, 'id'>; // To reset form for new product
}

export const AddProductModal: FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onSaveProduct,
  productToEdit,
  initialProductData
}) => {
  const isEditing = !!productToEdit;

  // This key forces re-render of AddProductForm when productToEdit changes, ensuring form resets
  const formKey = productToEdit ? productToEdit.id : 'new-product';

  const handleFormSubmit = (data: ProductFormData) => {
    onSaveProduct(data, productToEdit ? productToEdit.id : null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/*
        DialogContent classes:
        - sm:max-w-[600px] md:max-w-[750px] lg:max-w-[900px]: Responsive width.
        - flex flex-col: Enables flex layout for header, scrollarea, footer.
        - max-h-[90vh]: Critical for limiting modal height.
        - overflow-hidden: Ensures content outside max-h is clipped, necessary for ScrollArea to work.
        - text-foreground: Sets default text color.
        - Default ShadCN DialogContent also includes p-6 for overall padding.
      */}
      <DialogContent className="sm:max-w-[600px] md:max-w-[750px] lg:max-w-[900px] flex flex-col max-h-[90vh] overflow-hidden text-foreground">
        <DialogHeader> {/* Standard header, takes its natural height */}
          <DialogTitle className="text-xl flex items-center gap-2">
            <PackagePlus className="w-5 h-5 text-foreground" />
            {isEditing ? 'Editar Producto' : 'Agregar Nuevo Producto'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Modifique los detalles del producto.' : 'Especifique las características del producto para agregarlo a la lista.'}
          </DialogDescription>
        </DialogHeader>
        {/*
          ScrollArea classes:
          - flex-grow: Allows it to take up the available vertical space.
          - min-h-0: Crucial in flex context to prevent content from defining parent size before scroll.
        */}
        <ScrollArea className="flex-grow min-h-0">
          {/* AddProductForm is the content that will scroll. It has its own internal padding. */}
          <AddProductForm
            key={formKey}
            initialData={productToEdit || initialProductData}
            onSubmit={handleFormSubmit}
            formId="product-form"
          />
        </ScrollArea>
        <DialogFooter className="pt-4 border-t"> {/* Standard footer, takes its natural height */}
          <Button type="button" variant="outline" onClick={onClose}>
            <X className="mr-2 h-4 w-4" /> Cancelar
          </Button>
          <Button type="submit" form="product-form">
            {isEditing ? <Save className="mr-2 h-4 w-4" /> : <PackagePlus className="mr-2 h-4 w-4" />}
            {isEditing ? 'Actualizar Producto' : 'Agregar Producto'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
