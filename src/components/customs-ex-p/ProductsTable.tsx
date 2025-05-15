"use client";

import type { FC } from 'react';
import type { Product } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trash2, ListChecks } from 'lucide-react';

interface ProductsTableProps {
  products: Product[];
  onRemoveProduct: (productId: string) => void;
}

export const ProductsTable: FC<ProductsTableProps> = ({ products, onRemoveProduct }) => {
  if (products.length === 0) {
    return (
      <Card className="mt-8 shadow-md">
        <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
                <ListChecks className="w-5 h-5 text-primary" />
                Listado de Productos
            </CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground text-center py-8">Aún no se han agregado productos. Use el botón de "Agregar Nuevo Producto" para comenzar.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-8 shadow-lg">
        <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
                <ListChecks className="w-5 h-5 text-primary" />
                Listado de Productos
            </CardTitle>
            <CardDescription>Resumen de todos los productos agregados a esta examinación.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Código HS</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Valor (unidad)</TableHead>
                <TableHead>País de Origen</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {products.map((product) => (
                <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.hsCode}</TableCell>
                    <TableCell className="text-right">{product.quantity}</TableCell>
                    <TableCell className="text-right">{product.value.toFixed(2)}</TableCell>
                    <TableCell>{product.countryOfOrigin}</TableCell>
                    <TableCell className="text-right">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemoveProduct(product.id)}
                        aria-label={`Eliminar ${product.name}`}
                    >
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
        </CardContent>
    </Card>
  );
};
