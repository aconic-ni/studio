
"use client";

import type { FC } from 'react';
import type { Product, ProductStatus } from '@/types';
import { PRODUCT_STATUS } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trash2, ListChecks, Edit3 } from 'lucide-react'; // Added Edit3

interface ProductsTableProps {
  products: Product[];
  onRemoveProduct: (productId: string) => void;
  onEditProduct: (product: Product) => void; // New prop for editing
}

const getStatusBadgeVariant = (status: ProductStatus): string => {
  switch (status) {
    case PRODUCT_STATUS.CONFORME:
      return "bg-green-100 text-green-700 border-green-300 hover:bg-green-200 dark:bg-green-700/30 dark:text-green-300 dark:border-green-600";
    case PRODUCT_STATUS.EXCEDENTE:
      return "bg-red-100 text-red-700 border-red-300 hover:bg-red-200 dark:bg-red-700/30 dark:text-red-300 dark:border-red-600";
    case PRODUCT_STATUS.FALTANTE:
      return "bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200 dark:bg-yellow-700/30 dark:text-yellow-300 dark:border-yellow-600";
    case PRODUCT_STATUS.AVERIA:
      return "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 dark:bg-gray-600/30 dark:text-gray-300 dark:border-gray-500";
    default:
      return "bg-secondary text-secondary-foreground hover:bg-secondary/80";
  }
};

const getStatusDisplayName = (status: ProductStatus): string => {
    switch (status) {
        case PRODUCT_STATUS.CONFORME: return "Conforme";
        case PRODUCT_STATUS.EXCEDENTE: return "Excedente";
        case PRODUCT_STATUS.FALTANTE: return "Faltante";
        case PRODUCT_STATUS.AVERIA: return "Avería";
        default: return status;
    }
}

export const ProductsTable: FC<ProductsTableProps> = ({ products, onRemoveProduct, onEditProduct }) => {
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
                <TableHead>Item</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Cant. Unid.</TableHead>
                <TableHead>Unid. Medida</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead>Origen</TableHead>
                <TableHead>Estado Merc.</TableHead>
                <TableHead>Peso</TableHead>
                <TableHead>Serie</TableHead>
                <TableHead>Cant. Bultos</TableHead>
                <TableHead>Num. Bultos</TableHead>
                <TableHead>Observación</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {products.map((product) => (
                <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.itemNumber}</TableCell>
                    <TableCell>{product.description}</TableCell>
                    <TableCell className="text-right">{product.unitQuantity}</TableCell>
                    <TableCell>{product.measurementUnit}</TableCell>
                    <TableCell>{product.brand || '-'}</TableCell>
                    <TableCell>{product.model || '-'}</TableCell>
                    <TableCell>{product.origin}</TableCell>
                    <TableCell>{product.merchandiseState || '-'}</TableCell>
                    <TableCell className="text-right">{product.weightValue && product.weightUnit ? `${product.weightValue} ${product.weightUnit}` : '-'}</TableCell>
                    <TableCell>{product.serialNumber || '-'}</TableCell>
                    <TableCell className="text-right">{product.packageQuantity}</TableCell>
                    <TableCell>{product.packageNumbers || '-'}</TableCell>
                    <TableCell className="max-w-xs truncate" title={product.observation}>{product.observation ? (product.observation.length > 30 ? product.observation.substring(0, 27) + '...' : product.observation) : '-'}</TableCell>
                    <TableCell>
                        <Badge variant="outline" className={`font-semibold ${getStatusBadgeVariant(product.status)}`}>
                            {getStatusDisplayName(product.status)}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEditProduct(product)}
                        aria-label={`Editar ${product.description}`}
                      >
                        <Edit3 className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemoveProduct(product.id)}
                        aria-label={`Eliminar ${product.description}`}
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
