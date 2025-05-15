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
import { Trash2, PackageSearch } from 'lucide-react';

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
                <PackageSearch className="w-5 h-5 text-primary" />
                Product List
            </CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground text-center py-8">No products added yet. Use the form above to add products.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-8 shadow-lg">
        <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
                <PackageSearch className="w-5 h-5 text-primary" />
                Product List
            </CardTitle>
            <CardDescription>Overview of all products added to this examination.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>HS Code</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead>Country of Origin</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
                        aria-label={`Remove ${product.name}`}
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
