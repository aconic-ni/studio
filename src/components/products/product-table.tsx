"use client";
import type { Product } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ProductRowActions } from "./product-row-actions";

interface ProductTableProps {
  products: Product[];
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
}

export function ProductTable({ products, onEditProduct, onDeleteProduct }: ProductTableProps) {
  if (products.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-10">
        <p>No products found.</p>
        <p>Click &quot;Add New Product&quot; to get started.</p>
      </div>
    );
  }
  return (
    <div className="rounded-md border shadow-sm bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item Number</TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="hidden md:table-cell">Brand</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead className="hidden sm:table-cell">Packaging</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="font-medium">{product.itemNumber}</TableCell>
              <TableCell>{product.name}</TableCell>
              <TableCell className="hidden md:table-cell">{product.brand || "-"}</TableCell>
              <TableCell className="text-right">{product.quantity}</TableCell>
              <TableCell className="hidden sm:table-cell">
                {product.packagingCondition ? (
                  <Badge variant={product.packagingCondition === "New" ? "default" : "secondary"}>
                    {product.packagingCondition}
                  </Badge>
                ) : (
                  "-"
                )}
              </TableCell>
              <TableCell className="text-right">
                <ProductRowActions
                  onEdit={() => onEditProduct(product)}
                  onDelete={() => onDeleteProduct(product)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
