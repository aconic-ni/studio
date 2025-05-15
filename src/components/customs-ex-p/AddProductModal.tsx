
"use client";

import type { FC } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Product } from '@/types';
import { AddProductForm } from './AddProductForm';
import { PackagePlus, Save, X } from 'lucide-react';

// This file and component are no longer used and can be deleted.
// The functionality has been moved to a dedicated view in src/app/page.tsx

// Matches the Zod schema in AddProductForm
type ProductFormData = Omit<Product, 'id'>;

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveProduct: (productData: ProductFormData, editingProductId: string | null) => void;
  productToEdit?: Product | null;
  initialProductData: Omit<Product, 'id'>; 
}

export const AddProductModal: FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onSaveProduct,
  productToEdit,
  initialProductData
}) => {
  const isEditing = !!productToEdit;
  const formKey = productToEdit ? productToEdit.id : 'new-product';

  const handleFormSubmit = (data: ProductFormData) => {
    onSaveProduct(data, productToEdit ? productToEdit.id : null);
    onClose();
  };

  if (!isOpen) return null; // Return null if not open to avoid rendering an empty dialog

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] md:max-w-[750px] lg:max-w-[900px] flex flex-col max-h-[90vh] overflow-hidden text-foreground">
        <DialogHeader> 
          <DialogTitle className="text-xl flex items-center gap-2">
            <PackagePlus className="w-5 h-5 text-foreground" />
            {isEditing ? 'Editar Producto' : 'Agregar Nuevo Producto'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Modifique los detalles del producto.' : 'Especifique las características del producto para agregarlo a la lista.'}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-grow min-h-0">
          <AddProductForm
            key={formKey}
            initialData={productToEdit || initialProductData}
            onSubmit={handleFormSubmit}
            // formId="product-form" // formId is no longer needed as AddProductForm is not submitted by external modal button
          />
        </ScrollArea>
        <DialogFooter className="pt-4 border-t"> 
          <Button type="button" variant="outline" onClick={onClose}>
            <X className="mr-2 h-4 w-4" /> Cancelar
          </Button>
          {/* This button needs to trigger the form submission.
              Since AddProductForm's internal submit button is removed,
              this button should now have type="submit" and form="product-form"
              where "product-form" is the ID of the <form> tag inside AddProductForm.
              However, this component is being deprecated.
          */}
          <Button type="submit" form="product-form-in-modal-example"> {/* Example ID */}
            {isEditing ? <Save className="mr-2 h-4 w-4" /> : <PackagePlus className="mr-2 h-4 w-4" />}
            {isEditing ? 'Actualizar Producto' : 'Agregar Producto'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
